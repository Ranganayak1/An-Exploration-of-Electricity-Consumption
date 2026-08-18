"""
app.py
------
Flask web application: Web Integration layer.
Serves:
  - "/"           Landing / project overview page
  - "/dashboard"  Interactive, filterable dashboard (Chart.js powered)
  - "/story"      Multi-scene data story (Scenario 1, 2, 3 narrative)
  - "/api/*"      JSON API endpoints that run SQL against the SQLite DB
                   and feed the front-end charts (this is the DB <-> UI
                   integration equivalent of "Connect DB with Tableau",
                   implemented here as "Connect DB with Flask/Chart.js").
"""

import sqlite3
from pathlib import Path
from flask import Flask, render_template, jsonify, request

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "electricity_consumption.db"

app = Flask(__name__)


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def query(sql, params=()):
    conn = get_conn()
    cur = conn.execute(sql, params)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


# ---------------------------------------------------------------------------
# Page routes
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/dashboard")
def dashboard():
    states = query("SELECT DISTINCT state FROM consumption ORDER BY state")
    regions = query("SELECT DISTINCT region FROM consumption ORDER BY region")
    return render_template("dashboard.html", states=states, regions=regions)


@app.route("/story")
def story():
    return render_template("story.html")


# ---------------------------------------------------------------------------
# API routes (data / calculation fields)
# ---------------------------------------------------------------------------

@app.route("/api/national_trend")
def api_national_trend():
    """National month-by-month total consumption (calculation field: SUM)."""
    rows = query("""
        SELECT date, ROUND(SUM(consumption_mu),1) AS total_mu
        FROM consumption GROUP BY date ORDER BY date
    """)
    return jsonify(rows)


@app.route("/api/yoy_comparison")
def api_yoy_comparison():
    """2019 vs 2020 monthly comparison (calculation field: YoY % change)."""
    rows = query("""
        SELECT c19.month,
               ROUND(c19.t19,1) AS total_2019,
               ROUND(c20.t20,1) AS total_2020,
               ROUND(100.0*(c20.t20-c19.t19)/c19.t19,2) AS yoy_change_pct
        FROM (SELECT month, SUM(consumption_mu) t19 FROM consumption WHERE year=2019 GROUP BY month) c19
        JOIN (SELECT month, SUM(consumption_mu) t20 FROM consumption WHERE year=2020 GROUP BY month) c20
          ON c19.month = c20.month
        ORDER BY c19.month
    """)
    return jsonify(rows)


@app.route("/api/regional_trend")
def api_regional_trend():
    """Region-wise monthly totals, optionally filtered by region."""
    region = request.args.get("region")
    if region and region != "All":
        rows = query("""
            SELECT region, date, ROUND(SUM(consumption_mu),1) AS total_mu
            FROM consumption WHERE region = ? GROUP BY region, date ORDER BY date
        """, (region,))
    else:
        rows = query("""
            SELECT region, date, ROUND(SUM(consumption_mu),1) AS total_mu
            FROM consumption GROUP BY region, date ORDER BY region, date
        """)
    return jsonify(rows)


@app.route("/api/regional_share_2020")
def api_regional_share_2020():
    rows = query("""
        SELECT region,
               ROUND(SUM(consumption_mu),1) AS total_2020_mu,
               ROUND(100.0*SUM(consumption_mu)/(SELECT SUM(consumption_mu) FROM consumption WHERE year=2020),2) AS pct_share
        FROM consumption WHERE year=2020 GROUP BY region ORDER BY total_2020_mu DESC
    """)
    return jsonify(rows)


@app.route("/api/state_trend")
def api_state_trend():
    """Month-wise trend for a single selected state (dashboard filter)."""
    state = request.args.get("state", "Maharashtra")
    rows = query("""
        SELECT date, consumption_mu, per_capita_kwh
        FROM consumption WHERE state = ? ORDER BY date
    """, (state,))
    return jsonify(rows)


@app.route("/api/lockdown_impact")
def api_lockdown_impact():
    """State-wise % change April 2019 -> April 2020 (lockdown shock)."""
    rows = query("""
        SELECT a.state, a.region,
               ROUND(a.consumption_mu,1) AS apr_2019,
               ROUND(b.consumption_mu,1) AS apr_2020,
               ROUND(100.0*(b.consumption_mu-a.consumption_mu)/a.consumption_mu,2) AS pct_change
        FROM consumption a
        JOIN consumption b ON a.state=b.state AND a.month=b.month
        WHERE a.year=2019 AND a.month=4 AND b.year=2020 AND b.month=4
        ORDER BY pct_change ASC
    """)
    return jsonify(rows)


@app.route("/api/recovery")
def api_recovery():
    """Scenario 3: recovery % of pre-COVID baseline by Q4-2020, per state."""
    rows = query("""
        WITH pre_covid AS (
            SELECT state, AVG(consumption_mu) AS pre_covid_avg
            FROM consumption WHERE year=2020 AND month IN (1,2) GROUP BY state
        ),
        lockdown_low AS (
            SELECT state, consumption_mu AS lockdown_low
            FROM consumption WHERE year=2020 AND month=4
        ),
        recovery_q4 AS (
            SELECT state, AVG(consumption_mu) AS q4_avg
            FROM consumption WHERE year=2020 AND month IN (10,11,12) GROUP BY state
        )
        SELECT p.state, s.region,
               ROUND(p.pre_covid_avg,1) AS pre_covid_avg,
               ROUND(l.lockdown_low,1) AS lockdown_low,
               ROUND(r.q4_avg,1) AS q4_2020_avg,
               ROUND(100.0*r.q4_avg/p.pre_covid_avg,2) AS pct_recovered
        FROM pre_covid p
        JOIN lockdown_low l ON p.state=l.state
        JOIN recovery_q4 r ON p.state=r.state
        JOIN states s ON s.state=p.state
        ORDER BY pct_recovered DESC
    """)
    return jsonify(rows)


@app.route("/api/top_bottom_states")
def api_top_bottom_states():
    top = query("""
        SELECT state, region, ROUND(SUM(consumption_mu),1) AS total_2020
        FROM consumption WHERE year=2020 GROUP BY state ORDER BY total_2020 DESC LIMIT 5
    """)
    bottom = query("""
        SELECT state, region, ROUND(SUM(consumption_mu),1) AS total_2020
        FROM consumption WHERE year=2020 GROUP BY state ORDER BY total_2020 ASC LIMIT 5
    """)
    return jsonify({"top": top, "bottom": bottom})


@app.route("/api/per_capita_trend")
def api_per_capita_trend():
    rows = query("""
        SELECT date, ROUND(AVG(per_capita_kwh),2) AS avg_per_capita
        FROM consumption GROUP BY date ORDER BY date
    """)
    return jsonify(rows)


@app.route("/api/kpis")
def api_kpis():
    """Headline KPI numbers for the dashboard cards."""
    total_2019 = query("SELECT SUM(consumption_mu) t FROM consumption WHERE year=2019")[0]["t"]
    total_2020 = query("SELECT SUM(consumption_mu) t FROM consumption WHERE year=2020")[0]["t"]
    apr_drop = query("""
        SELECT ROUND(100.0*(SUM(CASE WHEN year=2020 AND month=4 THEN consumption_mu END) -
                             SUM(CASE WHEN year=2019 AND month=4 THEN consumption_mu END)) /
                      SUM(CASE WHEN year=2019 AND month=4 THEN consumption_mu END), 2) AS pct
        FROM consumption
    """)[0]["pct"]
    avg_recovery = query("""
        WITH pre_covid AS (
            SELECT state, AVG(consumption_mu) AS pre_covid_avg
            FROM consumption WHERE year=2020 AND month IN (1,2) GROUP BY state
        ),
        recovery_q4 AS (
            SELECT state, AVG(consumption_mu) AS q4_avg
            FROM consumption WHERE year=2020 AND month IN (10,11,12) GROUP BY state
        )
        SELECT ROUND(AVG(100.0*r.q4_avg/p.pre_covid_avg),2) AS avg_pct
        FROM pre_covid p JOIN recovery_q4 r ON p.state=r.state
    """)[0]["avg_pct"]
    return jsonify({
        "total_2019_mu": round(total_2019, 1),
        "total_2020_mu": round(total_2020, 1),
        "yoy_growth_pct": round(100 * (total_2020 - total_2019) / total_2019, 2),
        "april_lockdown_drop_pct": apr_drop,
        "avg_q4_recovery_pct": avg_recovery,
        "states_covered": query("SELECT COUNT(DISTINCT state) c FROM consumption")[0]["c"],
    })


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
