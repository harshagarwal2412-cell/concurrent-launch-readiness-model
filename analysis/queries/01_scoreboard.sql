-- Question: Across both markets, how much is overdue, at risk, and done as of today?
SELECT
    SUM(flag = 'late')                                AS overdue_or_blocked,
    SUM(flag = 'risk')                                AS start_within_21_days,
    ROUND(100.0 * SUM(status = 'done') / COUNT(*))    AS pct_done,
    COUNT(*)                                          AS dependencies
FROM flagged;
