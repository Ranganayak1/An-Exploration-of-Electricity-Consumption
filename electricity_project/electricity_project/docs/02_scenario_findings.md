# Scenario Analysis — Key Findings

*(Figures below are computed live from the generated dataset via the SQL
queries in `sql/queries.sql` / the Flask API. Re-running `generate_data.py`
with a fixed random seed reproduces these exact numbers.)*

## Scenario 1 — Overall Consumption Trends
- National consumption in 2019 totalled **~1,626,072 MU**; in 2020 it totalled
  **~1,610,016 MU** — a **-0.99% YoY** dip overall, driven almost entirely by
  the lockdown months.
- **April 2020** was the low point: national consumption fell roughly
  **-26.9%** vs. April 2019, matching the timing of India's strictest
  lockdown phase.
- By **Q4 2020 (Oct-Dec)**, the national average had climbed back to
  **~107% of the pre-COVID (Jan-Feb 2020) baseline**, i.e. demand not only
  recovered but modestly exceeded pre-pandemic levels.

## Scenario 2 — Regional Variations in Demand
2020 regional share of national consumption:

| Region | Share of 2020 total |
|---|---|
| Southern | 29.5% |
| Northern | 28.2% |
| Western | 27.7% |
| Eastern | 13.4% |
| Northeastern | 1.3% |

- **Southern, Northern and Western** regions are near-equal, together
  accounting for **~85%** of national consumption — reflecting their larger
  populations and industrial bases.
- **Eastern** and especially **Northeastern** states consume disproportionately
  less, consistent with lower industrialization and population density in the
  Northeast.

## Scenario 3 — Recovery After Lockdown
- Hardest-hit states in April 2020 (largest % drop vs April 2019): **Odisha
  (-33.6%)**, **Maharashtra (-33.3%)**, **Chhattisgarh (-33.1%)** — all states
  with a heavy industrial consumption share, confirming that industry-heavy
  economies felt the lockdown hardest.
- Softest-hit states: **Bihar (-16.4%)**, **Jammu & Kashmir (-17.1%)**,
  **Kerala (-17.8%)** — states with a larger residential/agricultural
  consumption share.
- By Q4 2020, **West Bengal, Rajasthan and Tamil Nadu** had recovered fastest,
  reaching **~109-110%** of their pre-COVID baseline.
- **Kerala, Uttarakhand and Andhra Pradesh** recovered more slowly, sitting
  just **~101-104%** of baseline by year-end — still positive, but with less
  headroom above pre-pandemic demand.

## Takeaway
The data supports the intuitive narrative: **industrial/commercial-heavy
states dropped hardest during lockdown and needed the strongest rebound to
recover**, while **residential/agriculture-leaning states dipped less but also
had less "catch-up" growth to show by year-end**. Nationally, by Q4 2020 India's
electricity demand had not just recovered but modestly surpassed pre-COVID
levels — an early signal of economic activity resuming.
