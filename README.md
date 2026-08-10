# Phantom Picks Exclusive — V4 Login-Protected Command Center

This version adds real email/password login through Supabase Auth.

## What changed
- /admin.html opens to a login screen.
- The Command Center is hidden until authentication succeeds.
- Admin database writes are restricted to authenticated Supabase users.
- Lock/unlock and settlement-before-grading behavior remains.

## Setup
1. Run `supabase_schema.sql` in Supabase SQL Editor.
2. In Supabase, go to Authentication > Users.
3. Create your owner/admin user with the email and password you want to use.
4. In `config.js`, paste the Project URL and publishable/anon key.
5. Do NOT put a service_role/secret key in `config.js`.
6. Upload/replace these files in the `phantom-exclusive` GitHub repository.
7. Let Vercel redeploy.
8. Open `/admin.html` and sign in using the user you created in Supabase.

For a one-owner setup, keep only your owner account in Supabase Authentication.
