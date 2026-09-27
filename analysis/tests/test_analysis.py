"""
The SQL views re-implement the readiness model's date logic (latest start, flags,
Monday-aligned collision weeks). These tests hold them to the TypeScript engine's
exported results, row for row.
"""
import sqlite3

import pandas as pd
import pytest

import pipeline


def test_shape(frames):
    assert len(frames["items"]) == 52
    assert len(frames["item_status"]) == 104  # every item in both markets


def test_schema_rejects_bad_rows(con):
    with pytest.raises(sqlite3.IntegrityError):
        con.execute("INSERT INTO item_status VALUES ('tx', 'p1', 'done')")  # unknown market
    with pytest.raises(sqlite3.IntegrityError):
        con.execute("UPDATE item_status SET status = 'sort of' WHERE item_id = 'p1'")
    with pytest.raises(sqlite3.IntegrityError):
        con.execute("UPDATE markets SET go_live = 'Jan 11' WHERE market_id = 'mi'")
    con.rollback()


def test_sql_latest_start_matches_engine_for_every_item(con):
    df = pd.read_sql_query(
        """SELECT s.market_id, s.item_id, s.latest_start AS sql, e.latest_start AS engine
           FROM schedule s JOIN engine_schedule e USING (market_id, item_id)""",
        con,
    )
    assert len(df) == 104
    assert (df.sql == df.engine).all(), df[df.sql != df.engine]


def test_sql_flags_match_engine_for_every_item(con):
    df = pd.read_sql_query(
        "SELECT f.flag AS sql, e.flag AS engine FROM flagged f JOIN engine_schedule e USING (market_id, item_id)", con
    )
    assert (df.sql == df.engine).all()


def test_scoreboard_matches_engine(con, frames):
    sql = pipeline.run(con, "01").iloc[0]
    eng = frames["engine_scoreboard"].iloc[0]
    assert (sql.overdue_or_blocked, sql.start_within_21_days, sql.pct_done, sql.dependencies) == (
        eng.late, eng.risk, eng.done_pct, eng.total,
    )


def test_collision_weeks_match_engine(con, frames):
    sql_weeks = pd.read_sql_query(
        """SELECT start_week FROM schedule, params
           WHERE is_central = 1 AND start_week >= as_of
           GROUP BY start_week HAVING SUM(market_id = 'mi') > 0 AND SUM(market_id = 'ca') > 0""",
        con,
    ).start_week
    eng = frames["engine_collisions"].query("both == 1").week_start
    assert sorted(sql_weeks) == sorted(eng)
    assert len(sql_weeks) == frames["engine_scoreboard"].overlap_weeks.iloc[0] == 9


def test_collision_weeks_start_on_monday(con):
    weeks = pd.to_datetime(pipeline.run(con, "03").start_week)
    assert (weeks.dt.dayofweek == 0).all()


def test_overdue_list_is_the_late_flags(con):
    assert len(pipeline.run(con, "02")) == pipeline.run(con, "01").overdue_or_blocked.iloc[0]


def test_every_query_has_a_question_and_runs(con):
    for q in pipeline.load_queries():
        assert q.question, q.key
        pd.read_sql_query(q.sql, con)
