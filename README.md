# Celestial Atlas — Telegram Mini App

A Three.js celestial atlas that opens inside Telegram as a Mini App.
Hosted for free on GitHub Pages; no bot server needed.

## 1. Put it on GitHub Pages

1. Create a **public** GitHub repo (e.g. `celestial-atlas`) and push this folder to its `main` branch.
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` deploys `site/` on every push.
   Your URL will be `https://<your-username>.github.io/celestial-atlas/`.

## 3. Post a button in your channel

Subscribers can open the app straight from a channel post, without chatting with the bot.

The app's direct link is `https://t.me/celestial3datlasbot/atlas` (created with `/newapp` in @BotFather).
You can paste it anywhere; for a post with a real button:

1. Add the bot to your channel as an admin with permission to post messages.
2. In this repo: **Settings → Secrets and variables → Actions → New repository secret**, name `BOT_TOKEN`,
   value = your bot token from @BotFather.
3. **Actions → "Post Atlas button to a channel" → Run workflow**, enter your channel (e.g. `@mychannel`).
   Style `button` posts one short line with an **Open** button; `photo` adds the preview picture.
   To send it to yourself instead (then forward it to friends), press Start in the bot and enter your
   numeric Telegram ID. Run it again any time for a new post.

## Editing the app

- Page layout and styles: `site/index.html`
- 3D scene and app logic: `src/atlas.js`

`src/atlas.js` is bundled with Three.js into one minified `site/atlas.js`. The deploy workflow does this
automatically. To preview locally: `npm install && npm run build`, then serve `site/` (for example
`npx serve site`).

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

## Credits

- Constellation illustrations: [Stellarium](https://stellarium.org) "modern" sky culture, Free Art License
  (files in `site/art/`, converted to WebP).
- Constellation lines and anchor stars: Stellarium "modern" sky culture, CC BY-SA 4.0.
- Star coordinates and magnitudes: [d3-celestial](https://github.com/ofrohn/d3-celestial) catalog, BSD-3-Clause.

`src/sky-data.js` is generated from those sources. The whole real sky is drawn turned back by about 27°
(roughly the precession since the zodiac signs were defined) so each zodiac figure sits in its sign's
30° sector; shapes and neighbouring constellations are unchanged.
