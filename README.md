# Phantom Picks Exclusive — THE DROP

Approved fresh redesign built on the existing Site 3 Supabase backend.

## Important
Do **not** clear or recreate your Supabase tables. The site reads the existing `exclusive_current`
and `exclusive_results` rows, so your already-settled drops stay in place automatically.

Expected existing settled drops include:
- Rockies vs Diamondbacks — Over 9.5 — -116 — Aug 12, 2026 — WIN
- Cubs vs Nationals — Over 9.5 — -117 — Aug 11, 2026 — WIN
- Braves vs Mets — Over 8.5 — -108 — Aug 10, 2026 — WIN

The accidental Cubs vs Nationals Aug 12 / -147 entry should remain deleted.

## Features
- THE DROP public design
- Owner-only Command Center through Supabase Auth
- Multiple simultaneous live plays
- 5U default per play
- 1U = $2,000
- Automatic profit and ROI from settled drops
- WIN / LOSS / PUSH settlement
- Delete live drops
- **Delete previous/settled drops** with confirmation
- Deleting a previous drop immediately removes it from public Receipts and recalculates record, profit, and ROI
- Customer-side pick details are heavily obscured
- Existing Whop unlock link retained

## Deploy
Upload all files in this package to the existing Site 3 GitHub repository and replace matching files.
Do not run destructive SQL and do not delete your existing Supabase data.
