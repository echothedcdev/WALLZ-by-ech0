# WALLZ by ECH0

A browser-based 9×9 strategy game prototype with a small Node.js mail API.

## Included
- Responsive landing page, sign-in screen, lobby, and game screen
- Supabase email/password sign-up and sign-in
- Guest sign-in
- Room codes and Realtime Presence/Broadcast multiplayer prototype
- Player pawns displayed as glowing dots
- A server-side Mailtrap SMTP test-email endpoint for confirmed Supabase accounts

## Supabase connection
The browser uses the project's public URL and publishable key in `app.js`. The mail API uses the same values as server environment variables to validate the caller's Supabase access token. Never place a Supabase secret/service-role key or Mailtrap token in browser code.

Supabase Auth must have Email and Anonymous sign-ins enabled for the current UI. Realtime must be enabled for room sync.

## Mailtrap SMTP API
The root `server.js` is a Node 20+ HTTP service that sends a test message to the currently signed-in user's own confirmed email address. It does not accept arbitrary recipient addresses. It verifies the bearer token with Supabase Auth and limits each account to three test emails per 15 minutes.

### Install and run locally
```bash
npm install
cp .env.example .env
# Fill in the Mailtrap values in .env
npm start
```

Set these server environment variables:
- `SUPABASE_URL`: WALLZ Supabase project URL
- `SUPABASE_PUBLISHABLE_KEY`: the project's publishable key (not a secret/service-role key)
- `MAILTRAP_API_TOKEN`: your Mailtrap sending API token / SMTP password
- `MAIL_FROM`: an email address on a sending domain verified in Mailtrap
- `ALLOWED_ORIGINS`: `https://echothedcdev.github.io` (add your local origin separated by commas while developing)
- Optional: `MAILTRAP_HOST` (defaults to `live.smtp.mailtrap.io`), `MAILTRAP_PORT` (defaults to `587`), `MAILTRAP_USER` (defaults to `api`), and `PORT` (defaults to `3000`).

Deploy this repository as a Node service on Railway (start command: `npm start`) and add the server variables in Railway's Variables panel. Do not commit a real `.env` file. After deployment, copy the service's HTTPS public URL into `MAIL_API_URL` at the top of `app.js`, then commit that one config change. GitHub Pages continues to serve the static game; the Node service only handles email.

The lobby's **SEND TEST EMAIL** button calls `POST /api/email/test`. It requires a signed-in account with a confirmed email; guest accounts are rejected.

## Prototype notes
The current game sync is a client-side prototype. Wall placement, full Quoridor legal-move/path rules, server-side game move validation, persistent profiles, and ranked matchmaking are not implemented. Room codes are not private authentication. Do not use this prototype for ranked play until moves are validated server-side.
