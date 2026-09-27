# Analysis: Python + SQL

The readiness model's scheduling logic, rebuilt in **SQL (SQLite)** and analyzed with **pandas** and **matplotlib**. **pytest** holds the SQL to the TypeScript engine row for row.

**Start here:** [`report.ipynb`](report.ipynb)

```
analysis/
├── data/          # CSVs exported from the app's model (npm run export:data), worked example as of 2026-09-26
├── schema.sql     # tables + two views that implement the model: `schedule` and `flagged`
├── queries/       # one business question per .sql file
├── pipeline.py    # loads CSVs into SQLite, runs queries, returns DataFrames
├── report.ipynb   # the analysis, with charts
└── tests/         # pytest
```

## The model in SQL

```sql
-- latest start = go-live minus lead time
date(m.go_live, printf('%+d days', -i.lead_days))                     AS latest_start
-- Monday of the week it falls in, for collision detection
date(m.go_live, printf('%+d days', -i.lead_days), '-6 days', 'weekday 1') AS start_week
```

A `CASE` expression in the `flagged` view assigns overdue, at-risk and on-track using the same rules as the app.

## Questions and findings

| # | Question | SQL techniques |
|---|---|---|
| 01 | How much is overdue, at risk, done? | aggregation over a view |
| 02 | What's overdue and who owns it? | multi-table joins, date arithmetic |
| 03 | Which weeks need the central team for both launches? | `GROUP BY` week + `HAVING`-style filter on both markets |
| 04 | Which central functions peak when? | CTE + `ROW_NUMBER()` to pick each owner's peak month, correlated subquery |
| 05 | How ready is each workstream? | conditional aggregation pivot by market |
| 06 | Which items set the critical path? | pivot with `MAX(CASE …)` |

**Overdue right now (query 02):**

| market     | item                                                                         | owner         | status     |   days_late |
|:-----------|:-----------------------------------------------------------------------------|:--------------|:-----------|------------:|
| Michigan   | Payer credentialing and delegated roster submitted                           | Credentialing | blocked    |          13 |
| Michigan   | Behavioral health licensure and supervision path confirmed for the state     | Legal         | notstarted |           3 |
| California | Eligibility and claims file specification agreed, test file exchanged        | Clinical Ops  | notstarted |           1 |
| California | NP scope, supervision or collaboration requirements confirmed and documented | Legal         | notstarted |           1 |

**Central-function load (query 04):** Clinical Ops carries 36 of 74 central starts.

| owner         |   total_starts | peak_month   |
|:--------------|---------------:|:-------------|
| Clinical Ops  |             36 | 2026-12      |
| Legal         |             10 | 2026-08      |
| Product       |             10 | 2026-11      |
| L&D           |              6 | 2026-11      |
| Credentialing |              4 | 2026-10      |
| IT            |              4 | 2026-12      |
| Marketing     |              2 | 2026-11      |
| People Ops    |              2 | 2026-09      |

![Collision weeks](figures/collision_weeks.png)

## Tests

```bash
pip install -r analysis/requirements.txt
python analysis/pipeline.py
pytest analysis -v
```

9 tests check the following:

- **Latest start and flags:** the SQL values match the TypeScript engine for all 104 item-market pairs.
- **Collision weeks:** the SQL weeks match the engine exactly, and every week starts on a Monday.
- **Schema:** it rejects unknown markets, invalid statuses and malformed dates.
