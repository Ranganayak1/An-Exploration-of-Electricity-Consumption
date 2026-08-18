# India Electricity Consumption Analysis (Jan 2019 &ndash; Dec 2020)

An end-to-end analytics project studying state-wise electricity consumption
across India, covering the COVID-19 nationwide lockdown. Built to satisfy all
activities in the project brief: Data Integration, SQL, Visualization,
Dashboard, Story, Performance Testing, and Web Integration.

> **Note on data source:** This sandbox environment has no internet access, so
> the dataset is **synthetically generated** (`data/generate_data.py`) using
> realistic base-load figures per state, seasonal demand curves, ~6% YoY
> organic growth, and a COVID-19 lockdown shock model (sharp Apr-May 2020
> drop, phased Jun-Dec 2020 recovery, industrial-heavy states hit harder).
> It is a realistic stand-in, not official CEA/POSOCO data. To use real
> figures, replace `data/generate_data.py`'s output with an actual dataset
> (e.g. from data.gov.in / POSOCO) in the same schema and re-run.
>
> **Note on Tableau:** Tableau Desktop cannot run in this sandboxed, offline
> environment. The "Connect DB with Tableau" and dashboard/story requirements
> are fulfilled with an equivalent, fully working stack: **SQLite +
> SQL + Flask + Chart.js**, which is directly connectable to Tableau too
> (Tableau can connect to the same `electricity_consumption.db` SQLite file
> via its native SQLite connector, or to the CSV export, if you have Tableau
> available).

---

## Project Structure

```
electricity_project/
├── data/
│   ├── generate_data.py            # builds dataset + loads SQLite DB
│   ├── electricity_consumption.csv # generated dataset (flat file)
│   └── electricity_consumption.db  # generated SQLite DB (Tableau/SQL-ready)
├── sql/
│   └── queries.sql                 # all SQL analysis queries, documented
├── app/
│   ├── app.py                      # Flask app: pages + JSON API (SQL layer)
│   ├── templates/
│   │   ├── base.html               # responsive layout/nav
│   │   ├── index.html              # overview page
│   │   ├── dashboard.html          # interactive filterable dashboard
│   │   └── story.html              # 3-scene data story
│   └── static/
│       ├── css/style.css           # responsive dashboard/story styling
│       └── js/
│           ├── dashboard.js        # Chart.js dashboard logic + filters
│           └── story.js            # Chart.js story scene charts
├── performance/
│   ├── performance_test.py         # data volume / query timing tests
│   └── performance_report.md       # generated report
├── requirements.txt
└── README.md
```

## How each project activity is covered

| Activity | Where |
|---|---|
| Problem Understanding | This README + project brief |
| Data Collection & Extraction | `data/generate_data.py` |
| Storing Data in DB / SQL Operations | `data/electricity_consumption.db`, `sql/queries.sql` |
| Connect DB with Tableau/BI layer | `app/app.py` API layer reading directly from the SQLite DB (Tableau can also connect to the same `.db` file natively) |
| Data Preparation | seasonal/COVID adjustment + per-capita calc in `generate_data.py`; aggregation queries in `sql/queries.sql` |
| Data Visualizations (12 unique) | `app/templates/dashboard.html` + `story.html`, rendered via `dashboard.js` / `story.js` |
| Dashboard (responsive) | `/dashboard` route, `style.css` responsive breakpoints |
| Story (3 scenes) | `/story` route |
| Performance Testing | `performance/performance_test.py` → `performance/performance_report.md` |
| Web Integration with Flask | entire `app/` Flask application |

## Setup & Run

```bash
cd electricity_project

# 1. Install dependencies
pip install -r requirements.txt

# 2. Generate the dataset and SQLite database
python3 data/generate_data.py

# 3. (Optional) Run the SQL analysis queries directly
sqlite3 data/electricity_consumption.db < sql/queries.sql   # or open queries.sql in any SQLite client

# 4. (Optional) Run performance tests
python3 performance/performance_test.py

# 5. Launch the Flask web app
cd app
python3 app.py
```

Then open **http://localhost:5000** in a browser:
- `/` &mdash; project overview
- `/dashboard` &mdash; interactive, filterable dashboard (region + state filters, 9 chart panels)
- `/story` &mdash; 3-scene guided data story

## Dataset Schema

**`consumption` table** (672 rows = 28 states x 24 months, Jan 2019-Dec 2020)

| Column | Description |
|---|---|
| state | Indian state/UT name |
| region | Northern / Southern / Eastern / Western / Northeastern |
| year, month, date | Time period |
| consumption_mu | Electricity consumption, Million Units (MU) |
| population_millions | Approx. state population |
| per_capita_kwh | Derived per-capita consumption |

**`states` table** &mdash; state master with region and industrial-share factor
used in the COVID shock model.

## Key Calculation Fields

1. `SUM(consumption_mu)` &mdash; national/regional totals
2. `AVG(consumption_mu)` &mdash; baseline & recovery averages
3. Year-on-Year % change
4. Regional % share of national total
5. Per-capita kWh
6. Lockdown impact % (Apr 2019 vs Apr 2020)
7. Recovery % (Q4-2020 avg vs pre-COVID Jan-Feb 2020 avg)
8. Top-N / Bottom-N ranking

See `performance/performance_report.md` for the full breakdown and query
timing benchmarks.
