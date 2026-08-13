# Phantom Picks — Exclusive Play Redesign

Files:
- `index.html` — public Exclusive Play landing page
- `admin.html` — local Command Center demo (post / grade / edit / delete)
- `styles.css` — responsive black/gold UI
- `app.js` — ledger, record, profit and ROI calculations
- `assets/phantom-character.png` — visual asset from the approved mockup
- `design-reference.png` — approved visual reference

## Rules built into the presentation
- Exclusive Play: $20
- Standard sizing: 5U
- 1U = $2,000 unless otherwise stated
- Loss: buyer remains unlocked until an Exclusive Play wins
- Push: next Exclusive Play is free
- Win: access ends; next drop requires a new purchase
- No refunds / all sales final

## Important before production
The included Command Center uses browser `localStorage`, so it is a functional front-end prototype and works on the same browser/device. For a live multi-device site, connect it to the existing Supabase/Auth backend and RLS setup. The Unlock button is intentionally not wired to a made-up checkout URL; connect it to the real Whop purchase/access flow before launch.
