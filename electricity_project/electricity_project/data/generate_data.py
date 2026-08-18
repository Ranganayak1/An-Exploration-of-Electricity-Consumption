"""
generate_data.py
-----------------
Generates a state-wise, month-wise electricity consumption dataset for India
covering January 2019 to December 2020 (the period requested in the project
brief, including the COVID-19 nationwide lockdown of March-June 2020).

Because this environment has no internet access, the dataset is synthetically
generated using realistic base-load figures (approx. actual order-of-magnitude
monthly consumption in Million Units - MU) per state, combined with:
  - Seasonal demand curves (summer peak due to cooling load, winter trough)
  - Year-on-year organic growth (~5-7%)
  - COVID-19 lockdown shock (Apr-May 2020 sharp drop, phased recovery Jun-Dec 2020)
  - Sector-realistic behaviour: industrial/commercial heavy states drop harder
    in lockdown; states with a higher residential share drop less / even rise.

This is NOT official government data - it is a realistic stand-in built for
the purpose of this analytics project (data integration -> DB -> SQL ->
visualization -> dashboard -> story -> Flask web app).

Output:
  - data/electricity_consumption.csv
  - data/electricity_consumption.db   (SQLite DB, table: consumption, states)
"""

import sqlite3
import numpy as np
import pandas as pd
from pathlib import Path

np.random.seed(42)

DATA_DIR = Path(__file__).resolve().parent
CSV_PATH = DATA_DIR / "electricity_consumption.csv"
DB_PATH = DATA_DIR / "electricity_consumption.db"

# ---------------------------------------------------------------------------
# 1. State master data: region, approx. base monthly consumption (MU) in 2019,
#    approx. population (in millions, for per-capita calc), and an
#    "industrial_share" factor (0-1) that drives how hard COVID hits them.
# ---------------------------------------------------------------------------
STATES = [
    # state, region, base_mu_2019, population_millions, industrial_share
    ("Maharashtra", "Western", 14200, 123, 0.62),
    ("Gujarat", "Western", 11800, 63, 0.68),
    ("Goa", "Western", 420, 1.5, 0.40),
    ("Madhya Pradesh", "Western", 6300, 82, 0.45),
    ("Chhattisgarh", "Western", 5200, 29, 0.70),

    ("Uttar Pradesh", "Northern", 12600, 231, 0.35),
    ("Punjab", "Northern", 5300, 30, 0.42),
    ("Haryana", "Northern", 5100, 28, 0.48),
    ("Rajasthan", "Northern", 6900, 81, 0.40),
    ("Delhi", "Northern", 4200, 19, 0.20),
    ("Uttarakhand", "Northern", 1500, 11, 0.45),
    ("Himachal Pradesh", "Northern", 900, 7, 0.38),
    ("Jammu and Kashmir", "Northern", 1300, 13, 0.15),

    ("Tamil Nadu", "Southern", 12900, 77, 0.55),
    ("Karnataka", "Southern", 9200, 67, 0.48),
    ("Andhra Pradesh", "Southern", 7100, 53, 0.42),
    ("Telangana", "Southern", 6700, 39, 0.46),
    ("Kerala", "Southern", 3600, 35, 0.22),
    ("Puducherry", "Southern", 380, 1.6, 0.35),

    ("West Bengal", "Eastern", 5800, 99, 0.32),
    ("Odisha", "Eastern", 6100, 46, 0.72),
    ("Bihar", "Eastern", 2900, 124, 0.15),
    ("Jharkhand", "Eastern", 3300, 39, 0.65),

    ("Assam", "Northeastern", 1100, 35, 0.20),
    ("Meghalaya", "Northeastern", 220, 3.4, 0.25),
    ("Manipur", "Northeastern", 140, 3.2, 0.12),
    ("Tripura", "Northeastern", 190, 4.1, 0.18),
    ("Nagaland", "Northeastern", 110, 2.2, 0.10),
]

df_states = pd.DataFrame(
    STATES,
    columns=["state", "region", "base_mu_2019", "population_millions", "industrial_share"],
)

# ---------------------------------------------------------------------------
# 2. Monthly seasonal index (summer peak ~ May/June due to cooling demand,
#    winter trough ~ Dec/Jan; agriculture pump-load bump in Jun-Sep monsoon
#    sowing/irrigation season contributes too).
# ---------------------------------------------------------------------------
SEASONAL_INDEX = {
    1: 0.93, 2: 0.90, 3: 0.98, 4: 1.05, 5: 1.12, 6: 1.10,
    7: 1.04, 8: 1.02, 9: 1.00, 10: 0.97, 11: 0.94, 12: 0.95,
}

YOY_GROWTH = 0.06  # ~6% organic YoY growth pre-COVID

# COVID lockdown impact multipliers by month for 2020 (national phases):
# Mar 2020: lockdown announced late month (partial impact)
# Apr-May 2020: full/strict lockdown (biggest hit, esp. industrial states)
# Jun-Aug 2020: phased "Unlock" reopening
# Sep-Dec 2020: recovery, approaching / some states exceeding pre-COVID levels
COVID_IMPACT_2020 = {
    1: 0.00, 2: 0.00, 3: -0.10, 4: -0.32, 5: -0.24,
    6: -0.10, 7: -0.05, 8: -0.02, 9: 0.01, 10: 0.03,
    11: 0.02, 12: 0.04,
}

rows = []
for _, s in df_states.iterrows():
    for year in (2019, 2020):
        for month in range(1, 13):
            seasonal = SEASONAL_INDEX[month]
            base = s.base_mu_2019 * seasonal

            if year == 2020:
                base *= (1 + YOY_GROWTH)  # organic growth applied to 2020 baseline
                covid_shock = COVID_IMPACT_2020[month]
                # Industrial-heavy states hit harder during strict lockdown months,
                # residential-heavy (low industrial_share) states dip less / can rise
                if covid_shock < 0:
                    adj = covid_shock * (0.6 + 0.8 * s.industrial_share)
                else:
                    # recovery months: industrial states recover faster once reopened
                    adj = covid_shock * (0.7 + 0.6 * s.industrial_share)
                base *= (1 + adj)

            noise = np.random.normal(0, 0.015)  # small random monthly noise
            consumption = round(base * (1 + noise), 1)

            rows.append({
                "state": s.state,
                "region": s.region,
                "year": year,
                "month": month,
                "date": f"{year}-{month:02d}-01",
                "consumption_mu": consumption,
                "population_millions": s.population_millions,
            })

df = pd.DataFrame(rows)
df["per_capita_kwh"] = (df["consumption_mu"] * 1_000_000 / (df["population_millions"] * 1_000_000)).round(2)
df["date"] = pd.to_datetime(df["date"])
df = df.sort_values(["state", "date"]).reset_index(drop=True)

# ---------------------------------------------------------------------------
# 3. Save CSV
# ---------------------------------------------------------------------------
df.to_csv(CSV_PATH, index=False)
print(f"Saved CSV: {CSV_PATH}  ({len(df)} rows)")

# ---------------------------------------------------------------------------
# 4. Load into SQLite (Data Integration + DB storage requirement)
# ---------------------------------------------------------------------------
if DB_PATH.exists():
    DB_PATH.unlink()

conn = sqlite3.connect(DB_PATH)
df_states.drop(columns=["base_mu_2019"]).to_sql("states", conn, index=False)
df.to_sql("consumption", conn, index=False)

conn.execute("CREATE INDEX idx_state ON consumption(state)")
conn.execute("CREATE INDEX idx_date ON consumption(date)")
conn.execute("CREATE INDEX idx_region ON consumption(region)")
conn.commit()

cur = conn.execute("SELECT COUNT(*) FROM consumption")
print(f"Rows loaded into SQLite 'consumption' table: {cur.fetchone()[0]}")
cur = conn.execute("SELECT COUNT(*) FROM states")
print(f"Rows loaded into SQLite 'states' table: {cur.fetchone()[0]}")

conn.close()
print(f"SQLite DB ready at: {DB_PATH}")
