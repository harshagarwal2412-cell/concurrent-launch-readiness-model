-- Question: In which upcoming weeks do both launches need the same central team to start work?
WITH weekly AS (
    SELECT
        start_week,
        SUM(market_id = 'mi') AS mi,
        SUM(market_id = 'ca') AS ca
    FROM schedule, params
    WHERE is_central = 1
      AND start_week >= as_of
    GROUP BY start_week
)
SELECT start_week, mi, ca, mi + ca AS total
FROM weekly
WHERE mi > 0 AND ca > 0
ORDER BY total DESC, start_week
LIMIT 8;
