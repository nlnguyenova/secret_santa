# Secret Santa — GitHub Pages only

A static, client-side Secret Santa website. No Supabase, database, CLI, or extra account is needed. It keeps the burgundy stripes, falling snow, and animated envelope design.

## Publish on GitHub Pages

1. Upload `index.html`, `styles.css`, and `app.js` to the root of your GitHub repository, replacing the old versions.
2. Commit the changes.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/(root)`, and save.
5. Open the published Pages URL after deployment completes.

## Make a draw

1. Open the website and enter each participant on a separate line.
2. Click **Generate the draw**.
3. The organizer sees the full assignment list.
4. Click **Copy reveal link** next to each person and privately send that link to the matching participant. They open it to reveal their recipient in the letter design.

The draw algorithm shuffles the recipients until it finds a permutation where nobody gets themselves. Because each recipient appears exactly once in the shuffled list, nobody is assigned twice. Names must be unique ignoring capitalization. The page supports 2–100 participants.

## Important privacy limitation

GitHub Pages is static hosting, so this version has no secure server-side storage. Each reveal link contains the recipient's name in an encoded URL parameter. It is not encrypted: anyone who obtains that link can inspect or open it, so send links privately and do not post them publicly. The organizer can see every assignment. If you refresh the organizer page, the generated results are not saved; keep the assignments or links before leaving the page. To make a new draw, use **Start a new draw**.
