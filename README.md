# Phantom Picks Exclusive — V2

Changes:
- "THE PLAY THEY DON'T SEE" changed to "EXCLUSIVE PLAY"
- Added mini public Exclusive Play tracker
- Added /admin.html Command Center
- Added Supabase-backed posting and grading

Setup:
1. Run supabase_schema.sql in Supabase SQL Editor.
2. Put your Supabase Project URL + anon/publishable key into config.js.
3. Upload/replace all files in the phantom-exclusive GitHub repo.
4. Vercel redeploys automatically.
5. Customer page: /
6. Command Center: /admin.html

Important:
The current write policies are temporary for the prototype. Before public launch, admin writes should be protected with authentication.
Whop payment/access verification still needs to be connected before the blurred pick can safely reveal only to paying customers.
