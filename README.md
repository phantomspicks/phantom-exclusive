# Phantom Picks Exclusive — V3

New Command Center behavior:
- LOCK PLAY button freezes the posted play so it cannot be accidentally edited.
- UNLOCK PLAY lets you edit it again.
- WIN / LOSS / PUSH buttons stay disabled until "THIS BET HAS SETTLED" is checked.
- Grading updates the mini public tracker automatically.

Update steps:
1. Run supabase_schema.sql in Supabase SQL Editor. This adds is_locked + is_settled.
2. Keep your real Supabase URL + publishable/anon key in config.js.
3. Replace the Site 3 repo files with this package.
4. Vercel should redeploy automatically.

Admin page: /admin.html
