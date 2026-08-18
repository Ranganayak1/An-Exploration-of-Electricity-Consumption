# Problem Understanding

## Background
Electricity is a vital driver of economic activity, reflecting both industrial
productivity and household energy access. In 2015-16, agriculture accounted
for the highest share (17.89%) of electric energy usage in India. Despite
relatively low tariffs, India's per-capita electricity consumption remains
below global averages, pointing to both growth potential and infrastructural
challenges.

The COVID-19 pandemic created a unique, high-contrast scenario for energy
analysis: nationwide lockdowns shut down industry and transport (demand down)
while confining people to their homes (residential demand up).

## Problem Statement
Analyze state-wise electricity consumption across India from **January 2019
to December 2020** to answer three business questions:

1. **How did overall national consumption change** month-by-month across this
   period, and how sharply did the COVID-19 lockdown (Mar-Jun 2020) disrupt
   the normal seasonal pattern?
2. **How did consumption differ by region** (Northern, Southern, Eastern,
   Western, Northeastern) — which regions were hit hardest, and which held up
   best?
3. **How did each state recover** after the lockdown — which states returned
   to (or exceeded) pre-COVID demand fastest, and which lagged?

## Approach
1. Collect/assemble state-wise, month-wise consumption data for the period.
2. Load into a relational database (SQLite) and run SQL aggregation queries
   to answer each scenario.
3. Prepare derived fields needed for analysis: YoY % change, per-capita
   consumption, regional share, lockdown-impact %, and recovery %.
4. Build 12 unique visualizations covering all three scenarios.
5. Assemble an interactive, responsive dashboard with region/state filters.
6. Build a 3-scene narrative "data story" for non-technical stakeholders.
7. Run performance tests on data volume and query speed.
8. Embed the dashboard and story into a Flask web application.

## Success Criteria
- Dashboard answers all 3 scenario questions with filterable, interactive
  visuals.
- Story communicates the same insights as a guided narrative.
- All SQL operations are documented and reproducible (`sql/queries.sql`).
- The full stack runs end-to-end with `python3 app/app.py`.
