# Color Pop

An offline colouring app for the kids' Chromebook. It has no ads, no accounts and no network calls, and the kids' drawings never leave the device.

It's a web app you install from Chrome (a PWA). It is one self-contained HTML file plus a service worker, so after the first launch it runs with Wi-Fi off.

## What the kids get

| | 🐥 **Ibrahim** (3½) | 🦁 **Fatima** (7) |
|---|---|---|
| Pages | 37 simple pictures + 22 simple flags | all 82 pictures (incl. 10 mandalas) + 40 flags |
| First step | straight to colouring | **trace the dotted lines**, then colour (skip button ⏭) |
| Colours | **Magic** on: the marker picks the right colour | free colours; the 🪄 button turns Magic on |
| Tap | colour blooms out from the finger | same |
| Scribble | stays inside the region and fills itself at **45 %** | fills itself at **80 %** |
| Help | the next region glows after 2.5 s idle | the glow appears after 6 s, only in Magic mode |
| Tools | undo | undo, eraser, spray can, ✓ "I'm done" |
| Reading | none: colour and picture names are spoken | names are shown and spoken |

**Stars unlock things.** Every finished page earns a star (shown top right):

| Stars | Unlocks |
|---|---|
| 2, 4, 6, 8 | Rainbow, gold glitter, polka dots, pink glitter markers |
| 3 | 🦄 Unicorn page |
| 5 | 🛸 Flying saucer page |
| 7 | 🐉 Dragon page (7+) |
| 9 | 🧜 Mermaid page (7+) |
| 11, 14, 17, 20 | Candy stripes, hearts, stars, galaxy markers |
| 12 | 🎈 Hot-air balloon page (7+) |
| 15 | 🎃 Pumpkin carriage page (7+) |

**Also in the app:**

- **Themes:** a row above the pictures filters them: animals, vehicles, fairy tale, space & dinosaurs, patterns (mandalas, 7+ only) and fun stuff.
- **My drawings** (📝 tab): the kid draws on paper with a dark pen or crayon. Take a photo with the Chromebook camera, or choose a picture file. The app cleans it up into line art and turns it into a page to colour. Hold 🗑 on a drawing for 1.5 s to delete it.
- **Gallery** (🖼 tab): everything they have coloured. Tap a picture to watch a time-lapse replay of how it was painted (tap the page to skip). The celebration screen has the same ▶ button.
- Progress saves automatically for each kid, and pages can be reopened and recoloured.

## Parent settings

On the start screen, **press and hold the ⚙ (top right) for 1.5 seconds**, then answer the times-table question. From there you can:

- rename the two players (the names show on the start screen and in the export);
- turn Magic colours and the tracing step on or off for each kid;
- turn sound, the soft background music and the spoken names on or off;
- hold-to-reset a kid's progress or delete their drawings;
- **export every picture** as full-size PNGs in one zip (it lands in Downloads).

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
   - **Cloudflare Pages or Netlify Drop**: upload the contents of `dist/` after `npm run build`. Private repos are fine with these.
2. **Allow the site** (Family Link only). If the kid's Chrome setting is *Only allow approved sites*, open the Family Link app → your kid → **Controls → Google Chrome and Web → Manage sites → Approved**, and add the domain (e.g. `you.github.io`).
3. **Install.** Sign in as the kid, open the URL in Chrome, then use **⋮ menu → Cast, save and share → Install page as app** (or the install icon in the address bar). Right-click the icon on the shelf → **Pin**.
4. **Check offline.** Turn Wi-Fi off and launch it from the shelf.

Repeat steps 3–4 in each kid's account if they have separate Google accounts. Each account keeps its own progress.

If installing is blocked on a supervised account, use **⋮ → Cast, save and share → Create shortcut… → Open as window** instead. It behaves almost the same.

**Updates:** commit and push to `main`; the workflow tests, builds and redeploys in about a minute. The app always opens instantly from its cache and refreshes itself in the background when online, so the new version appears on the launch after that. Progress, drawings and settings are kept across updates.

## Add or change pages

**Pictures** live in `src/content/pictures.ts`, `pictures2.ts`, `pictures3.ts` (simple pages) and `pictures4.ts` (detailed pages); the mandalas are generated in `mandalas.ts`. Each picture is SVG on a 1000×1000 canvas:

- `class="c"`: a colourable shape. Its `fill` is the colour Magic mode uses.
- `class="k"`: a black detail (eyes, nose). It counts as part of the lines.
- `class="s"`: a sticker drawn *on top of* the paint, under the lines (shines, blush, stars).
- `class="t"`: a sticker drawn on top of the lines too (white eye glints on black).
- `level`: 1 = shown to the 3+ player (keep it to ≤ 10 big regions); 2–3 = 7+ only.
- `bg`: the colour Magic mode uses for the background.
- `surprise: N` (optional): the page stays locked until the kid has N stars.
- `theme`: which filter it shows under (`animals`, `vehicles`, `fairy`, `space`, `patterns`, `fun`).

Overlapping shapes are fine: the regions come from the visible lines. For a stripe inside a body, clip it to the body and re-stroke the body outline (see the fish and the rocket).

To preview the art run `node scripts/contact-sheet.mjs color sheet.png p3` (or `line`; the last word picks the set: `p1`–`p4`, `mandalas` or `all`). To check how pages split into regions, run `npm run build && node scripts/region-sheet.mjs regions.png all3` (or page ids): every region gets its own colour, and a red label marks a level-1 page with a region too small for little fingers.

**Flags** live in `src/content/flags.ts`. Add one import from `flag-icons` and one line. Flags with text or detailed coats of arms make poor pages.

**Kid presets** (the names, brush size, auto-fill threshold, hint delay, palette, which tools show) are in `src/profiles.ts`; a name typed in parent settings overrides the one there. The default settings (tracing, Magic, sound) are in `src/settings.ts`; the special markers and their star thresholds are in `src/engine/paints.ts`.

## How it works

- `src/engine/segment.ts`: pure typed-array code that turns a rendered page into regions. It closes small gaps, labels connected areas, drops specks, grows regions under the lines and samples the target colours. Unit-tested in `tests/`.
- `src/engine/prepare.ts`: renders the page SVG in the browser and runs the segmentation (~0.1–0.3 s on a fast PC, ~0.45 s median with the CPU slowed 4×).
- `src/engine/board.ts`: the painting runtime. Every stroke, spray or fill is drawn, then masked to the region where the finger started, so paint can't cross a line. It also handles the bloom fills, the scribble-coverage auto-complete, undo (only the affected region is replayed), the trace step, the time-lapse replay, hints, sparkles and the marker sprite.
- `src/engine/paints.ts`: the special markers. Each one is a seamless tile used as a canvas pattern anchored to the page, so a replay redraws it pixel for pixel.
- `src/engine/drawing.ts`: photo → line art (adaptive threshold for uneven light, speck and shadow removal).
- `src/engine/audio.ts` and `speech.ts`: sounds and the background music are synthesised with Web Audio, so there are no sound files; names are spoken with the Chromebook's built-in voice.
- `src/engine/zip.ts`: a tiny zip writer for the export.
- `src/storage/db.ts`: an IndexedDB key-value store holding, per kid and page, the action log, a thumbnail and the full-size picture, plus the drawings and settings.
- `public/sw.js`: the offline cache, stale-while-revalidate.

## Tests

```bash
npm test                       # unit tests: segmentation, zip export, photo -> line art
npm run build && npm run e2e   # real Chrome, 39 checks: painting, trace, spray, unlocks, replay, themes,
                               # photographed drawing, parent area + export, reload, offline
# on a Mac: CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run e2e
```

## Credits

Flag artwork: [flag-icons](https://github.com/lipis/flag-icons) by Panayiotis Lipiridis, MIT licence. The pictures were drawn for this app.
