# Phantom Picks Exclusive — V7

New:
- Public page now shows PREVIOUS EXCLUSIVE PLAYS.
- Admin Command Center now has PREVIOUS EXCLUSIVE PLAYS.
- History pulls automatically from `exclusive_results`.
- Each settled play shows result, sport, pick, matchup, odds/book, and date.
- Public view shows the latest 10.
- Admin view shows the full settled history currently returned by Supabase.

No new Supabase SQL is needed if V4+ is already installed.


## Red/Gold Multi-Play Upgrade
This build adds:
- Red + gold Exclusive visual system.
- Multiple simultaneous Exclusive Plays.
- Separate settlement controls for each active play.
- Delete controls for accidental active and settled entries.
- Extremely heavy locked-play blur/overlay so the pick, matchup and odds are not legible before unlock.

### IMPORTANT: Supabase update
Run the full `supabase_schema.sql` once before deploying this build. It adds the authenticated DELETE/UPDATE policy required by the new settlement/delete controls.

### Removing the mistaken Aug 12 Cubs vs Nationals entry
After deploying and running the SQL:
1. Open the Command Center.
2. Go to Previous Exclusive Plays.
3. Find `Cubs vs Nationals`, `Over 9.5 runs`, `-147`, Aug 12, 2026.
4. Tap DELETE and confirm.
Do not delete the Aug 11 Cubs vs Nationals entry.


## Profit / ROI Update
- Default Exclusive Play stake: **5U**
- Unit value: **1U = $2,000**
- Every new play defaults to 5U.
- The Command Center includes a Units field so a play can be overridden when needed.
- Win profit is calculated from American odds and stake.
- Loss = negative stake.
- Push = 0 profit.
- ROI = total net profit in units / total units risked on settled plays.
- Public and admin history show per-play units, unit profit, and dollar profit.
- Public and admin performance sections show cumulative Net Profit and ROI.

Run the updated `supabase_schema.sql` once before deploying so the `units` column exists.


## Approved Visual Rebuild
This package keeps the working Site 3 backend/features but rebuilds the public and admin front end to match the approved flashy black/red Exclusive concept much more closely:
- neon red energy / gold accents
- hooded Phantom hero treatment
- large heavily blurred locked-pick presentation
- premium red/gold admin Command Center
- multi-play posting
- 5U default, 1U=$2,000
- profit + ROI
- per-play settlement
- settled-play delete controls


## Character Fix
Replaced the temporary CSS-built hooded figure with the real Phantom artwork asset (`phantom-character.png`).
