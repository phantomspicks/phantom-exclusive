# Phantom Picks — Phantom Drop V8

This build keeps the original v7 visual system and adds the newer Phantom Drop performance experience.

## Added
- Renamed customer-facing "Exclusive Play" to **Phantom Drop**.
- "How It Works" breakdown: Win / Loss / Push / One-Time Fee.
- Phantom Performance: **Record, Profit, ROI** calculated from graded results.
- Previous Phantom Drops with **All / Wins / Losses / Pushes** filters.
- Per-result date, matchup, pick, American odds, units, result and profit.
- Expand/collapse **View All Results**.
- Unit Size & Calculations section with 5U default, 1U = $2,000 and profit examples.
- Expanded Phantom footer and full Phantom Drop terms.
- Command Center fields for **American Odds** and **Units**.
- Automatic profit calculation when a Phantom Drop is graded.
- Command Center Phantom Performance summary.

## Required Supabase update
Run `supabase_schema.sql` in the Supabase SQL Editor once. It safely adds `american_odds`, `units`, and `profit` columns to the existing tables while preserving the v7 tables and policies.

Then keep your existing Supabase values in `config.js` and deploy the folder exactly as before.
