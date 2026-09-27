-- Question: How ready is each workstream in each market?
SELECT
    w.label                                                           AS workstream,
    SUM(f.market_id = 'mi' AND f.status = 'done') || '/' || SUM(f.market_id = 'mi') AS michigan_done,
    SUM(f.market_id = 'ca' AND f.status = 'done') || '/' || SUM(f.market_id = 'ca') AS california_done,
    SUM(f.flag = 'late')                                              AS late,
    SUM(f.flag = 'risk')                                              AS at_risk
FROM flagged f
JOIN workstreams w ON w.ws_id = f.ws_id
GROUP BY w.ws_id
ORDER BY w.sort_order;
