-- ============================================================================
-- queries.sql
-- SQL operations performed on the SQLite database (electricity_consumption.db)
-- as part of the "Storing Data in DB and Perform SQL Operations" activity.
--
-- Tables:
--   states(state, region, population_millions, industrial_share)
--   consumption(state, region, year, month, date, consumption_mu,
--               population_millions, per_capita_kwh)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. National month-by-month total consumption (Scenario 1: Overall Trend)
-- ----------------------------------------------------------------------------
SELECT date,
       year,
       month,
       ROUND(SUM(consumption_mu), 1) AS total_consumption_mu
FROM consumption
GROUP BY date
ORDER BY date;


-- ----------------------------------------------------------------------------
-- 2. Year-on-Year comparison, same month 2019 vs 2020 (Scenario 1)
-- ----------------------------------------------------------------------------
SELECT c2019.month,
       ROUND(c2019.total_2019, 1) AS total_2019_mu,
       ROUND(c2020.total_2020, 1) AS total_2020_mu,
       ROUND(100.0 * (c2020.total_2020 - c2019.total_2019) / c2019.total_2019, 2) AS yoy_change_pct
FROM (SELECT month, SUM(consumption_mu) AS total_2019 FROM consumption WHERE year = 2019 GROUP BY month) c2019
JOIN (SELECT month, SUM(consumption_mu) AS total_2020 FROM consumption WHERE year = 2020 GROUP BY month) c2020
  ON c2019.month = c2020.month
ORDER BY c2019.month;


-- ----------------------------------------------------------------------------
-- 3. Region-wise monthly consumption (Scenario 2: Regional Variation)
-- ----------------------------------------------------------------------------
SELECT region,
       date,
       ROUND(SUM(consumption_mu), 1) AS region_total_mu,
       ROUND(AVG(per_capita_kwh), 2) AS avg_per_capita_kwh
FROM consumption
GROUP BY region, date
ORDER BY region, date;


-- ----------------------------------------------------------------------------
-- 4. Region-wise total for 2020 and share of national total (Scenario 2)
-- ----------------------------------------------------------------------------
SELECT region,
       ROUND(SUM(consumption_mu), 1) AS region_total_2020_mu,
       ROUND(100.0 * SUM(consumption_mu) / (SELECT SUM(consumption_mu) FROM consumption WHERE year = 2020), 2) AS pct_of_national
FROM consumption
WHERE year = 2020
GROUP BY region
ORDER BY region_total_2020_mu DESC;


-- ----------------------------------------------------------------------------
-- 5. State-wise lockdown impact: April 2020 vs April 2019 (Scenario 1 & 3)
-- ----------------------------------------------------------------------------
SELECT a.state,
       a.region,
       ROUND(a.consumption_mu, 1) AS apr_2019_mu,
       ROUND(b.consumption_mu, 1) AS apr_2020_mu,
       ROUND(100.0 * (b.consumption_mu - a.consumption_mu) / a.consumption_mu, 2) AS pct_change
FROM consumption a
JOIN consumption b ON a.state = b.state AND a.month = b.month
WHERE a.year = 2019 AND a.month = 4 AND b.year = 2020 AND b.month = 4
ORDER BY pct_change ASC;


-- ----------------------------------------------------------------------------
-- 6. Recovery analysis: comparing each state's Q4-2020 (Oct-Dec) average
--    consumption against its pre-COVID Q1-2020 (Jan-Feb) average and against
--    lockdown-low (Apr-2020), to measure % recovered (Scenario 3)
-- ----------------------------------------------------------------------------
WITH pre_covid AS (
    SELECT state, AVG(consumption_mu) AS pre_covid_avg
    FROM consumption WHERE year = 2020 AND month IN (1, 2)
    GROUP BY state
),
lockdown_low AS (
    SELECT state, consumption_mu AS lockdown_low_mu
    FROM consumption WHERE year = 2020 AND month = 4
),
recovery_q4 AS (
    SELECT state, AVG(consumption_mu) AS q4_2020_avg
    FROM consumption WHERE year = 2020 AND month IN (10, 11, 12)
    GROUP BY state
)
SELECT p.state,
       s.region,
       ROUND(p.pre_covid_avg, 1) AS pre_covid_avg_mu,
       ROUND(l.lockdown_low_mu, 1) AS lockdown_low_mu,
       ROUND(r.q4_2020_avg, 1) AS q4_2020_avg_mu,
       ROUND(100.0 * r.q4_2020_avg / p.pre_covid_avg, 2) AS pct_of_pre_covid_recovered
FROM pre_covid p
JOIN lockdown_low l ON p.state = l.state
JOIN recovery_q4 r ON p.state = r.state
JOIN states s ON s.state = p.state
ORDER BY pct_of_pre_covid_recovered DESC;


-- ----------------------------------------------------------------------------
-- 7. Top 5 / Bottom 5 states by overall 2020 total consumption
-- ----------------------------------------------------------------------------
SELECT state, region, ROUND(SUM(consumption_mu), 1) AS total_2020_mu
FROM consumption
WHERE year = 2020
GROUP BY state
ORDER BY total_2020_mu DESC
LIMIT 5;

SELECT state, region, ROUND(SUM(consumption_mu), 1) AS total_2020_mu
FROM consumption
WHERE year = 2020
GROUP BY state
ORDER BY total_2020_mu ASC
LIMIT 5;


-- ----------------------------------------------------------------------------
-- 8. National per-capita consumption trend
-- ----------------------------------------------------------------------------
SELECT date, ROUND(AVG(per_capita_kwh), 2) AS avg_per_capita_kwh
FROM consumption
GROUP BY date
ORDER BY date;
