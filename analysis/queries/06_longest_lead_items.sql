-- Question: Which items set the critical path? (longest lead times, and when they had to start)
SELECT
    i.name,
    i.owner,
    i.lead_days,
    MAX(CASE WHEN s.market_id = 'mi' THEN s.latest_start END) AS mi_latest_start,
    MAX(CASE WHEN s.market_id = 'ca' THEN s.latest_start END) AS ca_latest_start
FROM items i
JOIN schedule s USING (item_id)
GROUP BY i.item_id
ORDER BY i.lead_days DESC
LIMIT 8;
