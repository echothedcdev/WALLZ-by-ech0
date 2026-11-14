# WALLZ by ECH0

A browser-based 9×9 strategy game prototype.

## Included
- Responsive landing page, sign-in screen, lobby, and game screen
- Email/password sign-up and sign-in UI
- Guest sign-in using Supabase anonymous auth
- Room codes and Realtime Presence/Broadcast multiplayer prototype
- Player pawns displayed as glowing dots
- Basic adjacent-square pawn movement and turn display

## Supabase connection
Set SUPABASE_URL and SUPABASE_KEY at the top of app.js. Use the project's public publishable key (or legacy anon key), never a service-role or secret key. Enable Email auth, Anonymous sign-ins, and Realtime in the Supabase project.

## Prototype notes
The current game sync is a client-side prototype. Wall placement, full Quoridor legal-move/path rules, server-side validation, persistent profiles, and ranked matchmaking are not implemented yet. Room codes are not private authentication. Do not use this prototype for ranked play until moves are validated server-side.
