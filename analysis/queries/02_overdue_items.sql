-- Question: What is overdue or blocked right now, and who owns it?
SELECT
    m.name                  AS market,
    w.label                 AS workstream,
    i.name                  AS item,
    f.owner,
    f.status,
    f.latest_start,
    -f.days_to_start        AS days_late
FROM flagged f
JOIN items       i USING (item_id)
JOIN markets     m USING (market_id)
JOIN workstreams w ON w.ws_id = f.ws_id
WHERE f.flag = 'late'
ORDER BY f.days_to_start;
