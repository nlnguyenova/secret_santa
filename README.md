# secret_santa[README.md](https://github.com/user-attachments/files/33910127/README.md)
# Secret Santa — GitHub Pages + Supabase

A static Secret Santa website with a Supabase Edge Function. The browser never receives the database service-role key. Tables have RLS enabled and no public policies. Participants authenticate with username + private access code. The organizer can create a draw but the setup response does not contain assignments.

## Important security notes

- **Username-only access is not secure.** This implementation uses a random private access code per participant.
- Access codes are shown only in the one-time `create_draw` response. Save the response and share each code privately.
- Do not put `SUPABASE_SERVICE_ROLE_KEY` or `SANTA_ADMIN_SECRET` in `app.js`, GitHub Pages, or any public repository file.
- The organizer's setup secret can create a draw, but it cannot read assignments via the setup response. Anyone who obtains the setup secret could create additional groups, so keep it private.
- This is a practical small-group project, not a formally audited security product. For a high-stakes/private event, add rate limiting and stronger admin authentication.
- A participant who shares their own access code can let another person view their assignment. No system can prevent a participant from voluntarily disclosing their result.

## Part 1 — Create Supabase project

1. Create a project at https://supabase.com/.
2. Open **SQL Editor**, create a new query, paste `supabase/schema.sql`, and run it.
3. Open **Project Settings → API** (or API Keys). Copy the project URL and the **service_role** key. The service-role key is server-only.
4. Install the Supabase CLI and Docker using the current instructions: https://supabase.com/docs/guides/cli
5. In a terminal, from this project folder, run:
   ```sh
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```
6. Set the Edge Function secrets. Generate a long random admin secret (for example with `openssl rand -hex 32`):
   ```sh
   supabase secrets set SANTA_ADMIN_SECRET="PASTE_A_LONG_RANDOM_SECRET"
   ```
   The project URL and service-role key are available to Supabase Edge Functions as `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the standard Supabase environment. If your project does not expose them automatically, set them as function secrets from the Supabase dashboard/CLI.
7. Deploy the function:
   ```sh
   supabase functions deploy santa
   ```
   If the function requires JWT verification to be disabled for public participant requests, deploy with:
   ```sh
   supabase functions deploy santa --no-verify-jwt
   ```
   The function itself validates participant codes and protects organizer setup with `SANTA_ADMIN_SECRET`; do not remove those checks.

## Part 2 — Connect the website

1. Edit `app.js`.
2. Replace `PASTE_YOUR_SUPABASE_FUNCTION_URL_HERE` with:
   `https://YOUR_PROJECT_REF.supabase.co/functions/v1/santa`
3. Commit and push the project to a GitHub repository.

## Part 3 — Create your first draw

The admin setup endpoint is deliberately not exposed in the public website. Use a terminal with `curl`, or an API client, and keep the admin secret private.

Example request (replace URL and secret; use your real usernames):

```sh
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/santa" \
  -H "Content-Type: application/json" \
  -H "x-santa-admin-secret: YOUR_LONG_RANDOM_ADMIN_SECRET" \
  -d '{
    "action": "create_draw",
    "groupName": "Office Secret Santa 2026",
    "usernames": ["alice", "ben", "clara", "david", "emma"]
  }'
```

The response includes each username and its generated access code, but **does not include assignments**. Save the response securely before closing the terminal, then send each participant only their own username and code through a private channel. The codes cannot be retrieved from the database in plaintext later.

If you want a local file for the response, you can append `-o codes.json` to the curl command. Store that file safely and delete it once the codes have been distributed. Avoid pasting real codes into public issue trackers, chats, or commits.

## Part 4 — Publish with GitHub Pages

1. Push `index.html`, `styles.css`, `app.js`, and the `supabase/` folder to the root of your GitHub repository.
2. On GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch `main` and folder `/(root)`, then click **Save**.
5. Wait for GitHub Pages to publish and open the URL shown in Settings → Pages.

Only the static site is hosted on GitHub Pages; the private database and server-side logic run on Supabase.

## How the draw guarantees work

- Usernames must be unique (case-insensitive).
- A shuffled permutation is generated and retried until nobody is assigned themselves.
- The database has a unique constraint on `(group_id, recipient_id)`, so the same recipient cannot be assigned to two people in the same group.
- A primary key on `(group_id, giver_id)` prevents multiple assignments for one giver.
- The public participant route accepts only a username and a matching hashed access code, then returns that participant's recipient only.
- The draw is created once when `create_draw` is called. There is no public redraw action.

## Troubleshooting

- **CORS / network error:** ensure the function deployed successfully and the function URL is correct.
- **401 for participant:** double-check username spelling and private code; usernames are case-insensitive, codes are uppercase-insensitive.
- **Create draw returns 401:** the `x-santa-admin-secret` header must match `SANTA_ADMIN_SECRET`.
- **Database permission error:** confirm the SQL schema ran and the Edge Function is using the server-side service-role key.
- **Don't publish real access codes or admin secrets in the repository.**
