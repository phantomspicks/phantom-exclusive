# Phantom Exclusive — Payment Verification Setup

This build no longer trusts a browser redirect by itself. It creates a unique Whop checkout session on the server, returns the customer to the Phantom page, asks Whop's Payments API whether that exact checkout succeeded, and only then sends the hidden active pick to that browser.

## 1. Connect server storage in Vercel
The Command Center must be shared by every visitor, so plays cannot live only in your phone's localStorage anymore.

In Vercel, open the project → **Storage / Marketplace** → add **Upstash Redis**. Redeploy afterward. The integration should inject either:
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`, or
- `KV_REST_API_URL` + `KV_REST_API_TOKEN`.

## 2. Add these Vercel Environment Variables
In Project → Settings → Environment Variables, add:

- `WHOP_API_KEY` — your Whop company API key. Keep this secret.
- `WHOP_COMPANY_ID` — your `biz_...` company ID.
- `WHOP_PRODUCT_ID` — your Exclusive Play `prod_...` ID (recommended so checkout stays tied to that product).
- `WHOP_AFFILIATE_CODE=phantomspicks`
- `SESSION_SECRET` — a long random string (40+ characters).
- `PUBLIC_SITE_URL=https://phantom-exclusive.vercel.app` (replace with your actual production URL if different).

Then redeploy.

## 3. Whop API permissions
Your Whop API key needs permission to create checkout configurations and read payments. Whop currently documents checkout creation permissions including `checkout_configuration:create`; payment verification requires the Payments API read permissions.

## 4. First Command Center visit
Open `/admin.html` after deployment. If your old active play is still stored in that browser, the page will offer to migrate it into the new shared server storage. Accept that prompt once.

## 5. Real flow
1. Viewer sees **ACTIVE PLAY LIVE** but not the hidden pick.
2. Viewer taps **UNLOCK ACTIVE PLAY — $20**.
3. Server creates a unique Whop checkout configuration for $20 and sends the viewer to Whop.
4. Whop redirects the viewer back after checkout.
5. The site verifies the exact checkout through Whop's Payments API.
6. Only after a successful payment does `/api/public-state` return the active pick details to that viewer.
7. The signed access cookie remains valid through losses/pushes and automatically expires for future plays as soon as a WIN is settled after that purchase.

## Security note
Do **not** place `WHOP_API_KEY`, Redis tokens, `SESSION_SECRET` in `app.js`, `index.html`, or any client-side file. This build reads them only inside Vercel server functions.
