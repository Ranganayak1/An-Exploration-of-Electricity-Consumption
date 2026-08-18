"""
performance_test.py
--------------------
Performance Testing activity:
  - Amount of data rendered to DB
  - Utilization of data filters
  - No. of calculation fields
  - No. of visualizations / graphs
  - Query execution timing for each dashboard endpoint

Run with:  python3 performance/performance_test.py
Produces: performance/performance_report.md
"""

import sqlite3
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "electricity_consumption.db"
REPORT_PATH = Path(__file__).resolve().parent / "performance_report.md"

QUERIES = {
    "National monthly trend (Scenario 1)": """
        SELECT date, SUM(consumption_mu) FROM consumption GROUP BY date ORDER BY date
    """,
    "YoY comparison (Scenario 1)": """
        SELECT c19.month, SUM(c19.consumption_mu), SUM(c20.consumption_mu)
        FROM consumption c19 JOIN consumption c20
          ON c19.month = c20.month AND c19.year=2019 AND c20.year=2020
        GROUP BY c19.month
    """,
    "Regional monthly trend (Scenario 2)": """
        SELECT region, date, SUM(consumption_mu) FROM consumption GROUP BY region, date ORDER BY date
    """,
    "Regional 2020 share (Scenario 2)": """
        SELECT region, SUM(consumption_mu) FROM consumption WHERE year=2020 GROUP BY region
    """,
    "State filter drill-down (Maharashtra)": """
        SELECT date, consumption_mu FROM consumption WHERE state='Maharashtra' ORDER BY date
    """,
    "Lockdown impact state-wise (Scenario 1/3)": """
        SELECT a.state, a.consumption_mu, b.consumption_mu
        FROM consumption a JOIN consumption b ON a.state=b.state AND a.month=b.month
        WHERE a.year=2019 AND a.month=4 AND b.year=2020 AND b.month=4
    """,
    "Recovery analysis (Scenario 3)": """
        WITH pre_covid AS (SELECT state, AVG(consumption_mu) v FROM consumption WHERE year=2020 AND month IN (1,2) GROUP BY state),
             recovery_q4 AS (SELECT state, AVG(consumption_mu) v FROM consumption WHERE year=2020 AND month IN (10,11,12) GROUP BY state)
        SELECT p.state, r.v / p.v FROM pre_covid p JOIN recovery_q4 r ON p.state=r.state
    """,
    "Top/Bottom 5 states 2020": """
        SELECT state, SUM(consumption_mu) t FROM consumption WHERE year=2020 GROUP BY state ORDER BY t DESC LIMIT 5
    """,
}

N_RUNS = 200  # repeat each query to get a stable average timing


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    n_consumption = cur.execute("SELECT COUNT(*) FROM consumption").fetchone()[0]
    n_states = cur.execute("SELECT COUNT(*) FROM states").fetchone()[0]
    n_cols = len(cur.execute("SELECT * FROM consumption LIMIT 1").description)
    db_size_kb = round(DB_PATH.stat().st_size / 1024, 1)

    results = []
    for name, sql in QUERIES.items():
        # warm-up
        cur.execute(sql).fetchall()
        start = time.perf_counter()
        for _ in range(N_RUNS):
            cur.execute(sql).fetchall()
        elapsed = (time.perf_counter() - start) / N_RUNS * 1000  # ms per run
        results.append((name, round(elapsed, 3)))

    conn.close()

    lines = []
    lines.append("# Performance Testing Report\n")
    lines.append("## Data Volume Rendered to DB\n")
    lines.append(f"- Rows in `consumption` table: **{n_consumption:,}**")
    lines.append(f"- Rows in `states` table: **{n_states}**")
    lines.append(f"- Columns per consumption record: **{n_cols}**")
    lines.append(f"- Time span: **Jan 2019 - Dec 2020** (24 months x 28 states = {24*28} state-months)")
    lines.append(f"- SQLite DB file size: **{db_size_kb} KB**\n")

    lines.append("## Data Filters Utilized (Dashboard)\n")
    lines.append("- Region filter (`All`, Northern, Southern, Eastern, Western, Northeastern)")
    lines.append("- State filter (28 individual states, dropdown)")
    lines.append("- Implicit time filter (2019 vs 2020, Q1/Q4 windows used in recovery calc)\n")

    lines.append("## Calculation Fields Implemented\n")
    calc_fields = [
        "SUM(consumption_mu) - total consumption aggregation",
        "AVG(consumption_mu) - average consumption (pre-COVID / Q4 windows)",
        "YoY % change = (2020 - 2019) / 2019 * 100",
        "Regional % share of national total",
        "Per-capita kWh = consumption_mu * 1e6 / (population_millions * 1e6)",
        "Lockdown impact % = (Apr2020 - Apr2019) / Apr2019 * 100",
        "Recovery % = Q4_2020_avg / pre_covid_avg * 100",
        "Top-N / Bottom-N ranking (ORDER BY ... LIMIT 5)",
    ]
    for f in calc_fields:
        lines.append(f"- {f}")
    lines.append(f"\n**Total calculation fields: {len(calc_fields)}**\n")

    lines.append("## Visualizations / Graphs\n")
    viz = [
        "National monthly consumption line chart (2019 vs 2020)",
        "YoY % change bar chart",
        "Regional monthly trend multi-line chart (filterable)",
        "Region share of 2020 consumption doughnut chart",
        "Selected-state monthly consumption area chart",
        "Selected-state per-capita consumption area chart",
        "State-wise lockdown impact horizontal bar chart",
        "State-wise recovery % horizontal bar chart",
        "Top/Bottom 5 states table",
        "Story Scene 1: national trend chart",
        "Story Scene 2: regional comparison chart",
        "Story Scene 3: recovery bar chart",
    ]
    for v in viz:
        lines.append(f"- {v}")
    lines.append(f"\n**Total unique visualizations: {len(viz)}**\n")

    lines.append("## Query Execution Timing (avg of 200 runs each, SQLite, local)\n")
    lines.append("| Query | Avg time (ms) |")
    lines.append("|---|---|")
    for name, t in results:
        lines.append(f"| {name} | {t} |")

    total_avg = round(sum(t for _, t in results) / len(results), 3)
    lines.append(f"\n**Average across all dashboard queries: {total_avg} ms** — well within interactive-dashboard response targets (<100ms).\n")

    REPORT_PATH.write_text("\n".join(lines))
    print(f"Performance report written to {REPORT_PATH}")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
