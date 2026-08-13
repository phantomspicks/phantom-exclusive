# Phantom Picks — Exact Mockup Build

This package rebuilds the approved black/gold Phantom Picks mockup as a functional responsive website.

## Files
- `index.html` — public Exclusive Play page
- `admin.html` — Command Center
- `styles.css` — full responsive visual system
- `app.js` — public history, filters, performance, Whop CTA placeholder
- `admin.js` — add/edit/delete/settle plays and automatic American-odds profit calculation
- `assets/` — Phantom logo and hero artwork used by the site

## Betting math
- Default play: **5U**
- **1U = $2,000**
- Default risk at 5U: **$10,000**
- Positive American odds: `profit = risk × odds / 100`
- Negative American odds: `profit = risk × 100 / abs(odds)`
- Loss: `-risk`
- Push: `$0`

## Whop checkout
Open `app.js` and paste the checkout URL here:

```js
const WHOP_CHECKOUT_URL='https://...';
```

Every public unlock action uses that variable.

## Current seeded settled plays
- Rockies vs Diamondbacks — Over 9.5 Runs — -116 — 5U — WIN — +$8,620.69
- Cubs vs Nationals — Over 9.5 Runs — -117 — 5U — WIN — +$8,547.01
- Braves vs Mets — Over 8.5 Runs — -108 — 5U — WIN — +$9,259.26

The current pending play remains fully obscured on the public page.
