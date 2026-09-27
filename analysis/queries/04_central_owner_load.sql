-- Question: Which central functions carry both launches, and in which month does each peak?
WITH monthly AS (
    SELECT owner, strftime('%Y-%m', latest_start) AS month, COUNT(*) AS starts,
           COUNT(DISTINCT market_id) AS markets
    FROM schedule
    WHERE is_central = 1
    GROUP BY owner, month
),
peak AS (
    SELECT owner, month, starts, markets,
           ROW_NUMBER() OVER (PARTITION BY owner ORDER BY starts DESC, month) AS rk
    FROM monthly
)
SELECT
    p.owner,
    (SELECT COUNT(*) FROM schedule s WHERE s.owner = p.owner AND s.is_central = 1) AS total_starts,
    p.month  AS peak_month,
    p.starts AS starts_in_peak_month,
    p.markets = 2 AS both_markets_in_peak
FROM peak p
WHERE p.rk = 1
ORDER BY total_starts DESC;
