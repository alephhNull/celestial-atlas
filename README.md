# Celestial Atlas — Telegram Mini App

A Three.js celestial atlas that opens inside Telegram as a Mini App.
Hosted for free on GitHub Pages; no bot server needed.

## 1. Put it on GitHub Pages

1. Create a **public** GitHub repo (e.g. `celestial-atlas`) and push this folder to its `main` branch.
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` deploys `site/` on every push.
   Your URL will be `https://<your-username>.github.io/celestial-atlas/`.

## 2. Hook it up to a Telegram bot (all in @BotFather, no code)

1. `/newbot` → pick a name and username.
2. `/mybots` → your bot → **Bot Settings → Menu Button** → paste the Pages URL.
   A button next to the chat input now opens the app.
3. Optional: **Bot Settings → Configure Mini App → Enable Mini App** with the same URL,
   so an "Open" button appears on the bot's profile and `t.me/<botusername>?startapp` opens it directly.
4. Optional: `/newapp` gives a shareable link like `t.me/<botusername>/atlas`.

## What the Telegram integration does

- Expands to full height and disables swipe-to-close, so dragging the 3D view works.
- Matches Telegram's header and background colours to the scene.
- Respects Telegram's safe areas and viewport height.
- Haptic feedback on buttons and months.
- Telegram's native Back button leaves the "From Earth" view.
- "Full screen" uses Telegram's fullscreen mode (Bot API 8.0+).

Opened in a normal browser, the page behaves exactly like the original.
