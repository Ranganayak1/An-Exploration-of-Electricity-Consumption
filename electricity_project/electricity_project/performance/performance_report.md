# Performance Testing Report

## Data Volume Rendered to DB

- Rows in `consumption` table: **672**
- Rows in `states` table: **28**
- Columns per consumption record: **8**
- Time span: **Jan 2019 - Dec 2020** (24 months x 28 states = 672 state-months)
- SQLite DB file size: **116.0 KB**

## Data Filters Utilized (Dashboard)

- Region filter (`All`, Northern, Southern, Eastern, Western, Northeastern)
- State filter (28 individual states, dropdown)
- Implicit time filter (2019 vs 2020, Q1/Q4 windows used in recovery calc)

## Calculation Fields Implemented

- SUM(consumption_mu) - total consumption aggregation
- AVG(consumption_mu) - average consumption (pre-COVID / Q4 windows)
- YoY % change = (2020 - 2019) / 2019 * 100
- Regional % share of national total
- Per-capita kWh = consumption_mu * 1e6 / (population_millions * 1e6)
- Lockdown impact % = (Apr2020 - Apr2019) / Apr2019 * 100
- Recovery % = Q4_2020_avg / pre_covid_avg * 100
- Top-N / Bottom-N ranking (ORDER BY ... LIMIT 5)

**Total calculation fields: 8**

## Visualizations / Graphs

- National monthly consumption line chart (2019 vs 2020)
- YoY % change bar chart
- Regional monthly trend multi-line chart (filterable)
- Region share of 2020 consumption doughnut chart
- Selected-state monthly consumption area chart
- Selected-state per-capita consumption area chart
- State-wise lockdown impact horizontal bar chart
- State-wise recovery % horizontal bar chart
- Top/Bottom 5 states table
- Story Scene 1: national trend chart
- Story Scene 2: regional comparison chart
- Story Scene 3: recovery bar chart

**Total unique visualizations: 12**

## Query Execution Timing (avg of 200 runs each, SQLite, local)

| Query | Avg time (ms) |
|---|---|
| National monthly trend (Scenario 1) | 0.191 |
| YoY comparison (Scenario 1) | 2.452 |
| Regional monthly trend (Scenario 2) | 0.363 |
| Regional 2020 share (Scenario 2) | 0.084 |
| State filter drill-down (Maharashtra) | 0.02 |
| Lockdown impact state-wise (Scenario 1/3) | 0.119 |
| Recovery analysis (Scenario 3) | 0.183 |
| Top/Bottom 5 states 2020 | 0.091 |

**Average across all dashboard queries: 0.438 ms** — well within interactive-dashboard response targets (<100ms).
