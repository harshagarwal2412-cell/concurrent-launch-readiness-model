-- Concurrent Launch Readiness Model: two markets, one central team.

CREATE TABLE params (
    as_of             TEXT NOT NULL,      -- "today" for the analysis (ISO date)
    risk_window_days  INTEGER NOT NULL
);

CREATE TABLE workstreams (
    ws_id       TEXT PRIMARY KEY,
    label       TEXT NOT NULL,
    sort_order  INTEGER NOT NULL
);

CREATE TABLE markets (
    market_id  TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    go_live    TEXT NOT NULL CHECK (go_live GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);

CREATE TABLE items (
    item_id        TEXT PRIMARY KEY,
    ws_id          TEXT NOT NULL REFERENCES workstreams (ws_id),
    name           TEXT NOT NULL,
    owner          TEXT NOT NULL,
    lead_days      INTEGER NOT NULL,   -- days before go-live the item must start (negative = after)
    duration_days  INTEGER NOT NULL CHECK (duration_days > 0),
    is_central     INTEGER NOT NULL    -- owned by a shared function serving both launches
);

CREATE TABLE item_status (
    market_id  TEXT NOT NULL REFERENCES markets (market_id),
    item_id    TEXT NOT NULL REFERENCES items (item_id),
    status     TEXT NOT NULL CHECK (status IN ('notstarted', 'inprogress', 'blocked', 'done')),
    PRIMARY KEY (market_id, item_id)
);

-- The TypeScript engine's own outputs, used by the tests to cross-check the SQL.
CREATE TABLE engine_schedule (
    market_id     TEXT NOT NULL,
    item_id       TEXT NOT NULL,
    latest_start  TEXT NOT NULL,
    flag          TEXT NOT NULL,
    PRIMARY KEY (market_id, item_id)
);
CREATE TABLE engine_collisions (week_start TEXT PRIMARY KEY, mi INTEGER, ca INTEGER, both INTEGER);
CREATE TABLE engine_scoreboard (late INTEGER, risk INTEGER, done_pct INTEGER, total INTEGER, overlap_weeks INTEGER);

-- Derived schedule: the model's core logic, written in SQL.
CREATE VIEW schedule AS
SELECT
    m.market_id,
    i.item_id,
    i.ws_id,
    i.owner,
    i.is_central,
    s.status,
    date(m.go_live, printf('%+d days', -i.lead_days))                                  AS latest_start,
    CAST(julianday(date(m.go_live, printf('%+d days', -i.lead_days)))
         - julianday(p.as_of) AS INTEGER)                                              AS days_to_start,
    -- Monday of the week the item must start in
    date(m.go_live, printf('%+d days', -i.lead_days), '-6 days', 'weekday 1')           AS start_week
FROM items i
CROSS JOIN markets m
CROSS JOIN params p
JOIN item_status s ON s.market_id = m.market_id AND s.item_id = i.item_id;

CREATE VIEW flagged AS
SELECT
    sc.*,
    CASE
        WHEN status = 'done'                                              THEN 'ok'
        WHEN status = 'blocked'                                           THEN 'late'
        WHEN status = 'notstarted' AND days_to_start < 0                  THEN 'late'
        WHEN status = 'notstarted' AND days_to_start <= p.risk_window_days THEN 'risk'
        ELSE 'ok'
    END AS flag
FROM schedule sc
CROSS JOIN params p;
