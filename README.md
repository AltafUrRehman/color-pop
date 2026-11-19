# Color Pop

An offline colouring app for the kids' Chromebook. It has no ads, no accounts and no network calls, and the kids' drawings never leave the device.

It's a web app you install from Chrome (a PWA). It is one self-contained HTML file plus a service worker, so after the first launch it runs with Wi-Fi off.

## What the kids get

| | 🐥 **3+** (the 3½-year-old) | 🦁 **7+** (the 7-year-old) |
|---|---|---|
| Pages | 8 simple pictures + 16 simple flags | all 16 pictures + 28 flags |
| Colours | **Magic** on: the marker picks the right colour | Free colours; the 🪄 button turns Magic on |
| Tap | colour blooms out from the finger | same |
| Scribble | stays inside the region and fills itself at **45 %** | fills itself at **80 %** |
| Help | the next region glows after 2.5 s idle | the glow appears after 6 s, only in Magic mode |
| Tools | undo | undo, eraser, ✓ "I'm done" |
| Reading | none | country / picture names |

Every finished page earns a star. Progress saves automatically for each kid, and pages can be reopened and recoloured.

## Run it on your machine

```bash
npm install
npm run dev          # http://localhost:5173 (no service worker in dev)
npm run build        # -> dist/ (index.html, sw.js, manifest, icons)
npm run preview      # serve the production build
```

## Put it on the Chromebook

1. **Host it** (one-time, free). Pick one:
   - **GitHub Pages**: push this folder to a GitHub repo (public on the free plan). In the repo, go to **Settings → Pages → Source: GitHub Actions**. The included workflow tests, builds and deploys on every push to `main`. The URL will be `https://<you>.github.io/<repo>/`.
   - **Cloudflare Pages or Netlify Drop**: upload the contents of `dist/` (or `color-pop-site.zip`). Private repos are fine with these.
2. **Allow the site** (Family Link only). If the kid's Chrome setting is *Only allow approved sites*, open the Family Link app → your kid → **Controls → Google Chrome and Web → Manage sites → Approved**, and add the domain (e.g. `you.github.io`).
3. **Install.** Sign in as the kid, open the URL in Chrome, then use **⋮ menu → Cast, save and share → Install page as app** (or the install icon in the address bar). Right-click the icon on the shelf → **Pin**.
4. **Check offline.** Turn Wi-Fi off and launch it from the shelf.

Repeat steps 3–4 in each kid's account if they have separate Google accounts. Each account keeps its own progress.

If installing is blocked on a supervised account, use **⋮ → Cast, save and share → Create shortcut… → Open as window** instead. It behaves almost the same.

**Updates:** push again. The app always opens instantly from its cache and refreshes itself in the background when online, so the new version appears on the launch after that.

## Add or change pages

**Pictures** live in `src/content/pictures.ts`. Each one is SVG on a 1000×1000 canvas:

- `class="c"`: a colourable shape. Its `fill` is the colour Magic mode uses.
- `class="k"`: a black detail (eyes, nose). It counts as part of the lines.
- `class="s"`: a sticker drawn *on top of* the paint (shines, blush, stars).
- `level`: 1 = shown to the 3+ player (keep it to ≤ 10 big regions); 2–3 = 7+ only.
- `bg`: the colour Magic mode uses for the background.

Overlapping shapes are fine: the regions come from the visible lines. For a stripe inside a body, clip it to the body and re-stroke the body outline (see the fish and the rocket).

To preview the art run `node scripts/contact-sheet.mjs color sheet.png` (or `line`).

**Flags** live in `src/content/flags.ts`. Add one import from `flag-icons` and one line. Flags with text or detailed coats of arms make poor pages.

**Kid presets** (brush size, auto-fill threshold, hint delay, palette, which tools show) are in `src/profiles.ts`.

## How it works

- `src/engine/segment.ts`: pure typed-array code that turns a rendered page into regions. It closes small gaps, labels connected areas, drops specks, grows regions under the lines and samples the target colours. Unit-tested in `tests/`.
- `src/engine/prepare.ts`: renders the page SVG in the browser and runs the segmentation (~0.2 s on a fast PC, ~0.45 s with the CPU slowed 4×).
- `src/engine/board.ts`: the painting runtime. Every stroke or fill is drawn, then masked to the region where the finger started, so paint can't cross a line. It also handles the bloom fills, the scribble-coverage auto-complete, undo (only the affected region is replayed), hints, sparkles and the marker sprite.
- `src/engine/audio.ts`: all sounds are synthesised with Web Audio, so there are no sound files.
- `src/storage/db.ts`: an IndexedDB key-value store holding the action log and a thumbnail per kid per page.
- `public/sw.js`: the offline cache, stale-while-revalidate.

## Tests

```bash
npm test                       # segmentation unit tests
npm run build && npm run e2e   # real Chrome: tap, scribble, undo, eraser, reload, offline (21 checks)
# on a Mac: CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run e2e
```

## Credits

Flag artwork: [flag-icons](https://github.com/lipis/flag-icons) by Panayiotis Lipiridis, MIT licence. The pictures were drawn for this app.
