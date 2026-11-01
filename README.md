# THE WHITE ROOM — fullscreen UI V2

Vanilla HTML/CSS/JavaScript point-and-click escape-room starter.

## What's different in V2

- Full-window experience with the Illustrator 16:9 scene centered and scaled proportionally (no page scroll, no title bar, no score, no wall names).
- Two overlaid navigation arrows, on the **left and right** of the image. **Left/Right keyboard arrow keys** also work.
- **Three fixed inventory boxes** at the bottom. The key and axe populate these slots when collected. Click an item to select it for use on the exit door.
- **Music** and **Restart** remain as unobtrusive buttons in the top-right corner.
- Clicking a navigation arrow **locks all page input** for the transition, while a **black strip sweeps left-to-right**. The next wall is progressively revealed *behind* that strip. Rapid clicks cannot skip walls.
- Object labels, the persistent text panel, and large puzzle CTA buttons have been removed. Puzzle interactions remain available by clicking the artwork.
- A short status hint appears briefly after actions then fades away.

## Run

1. Unzip the project.
2. Copy your PNG/JPG assets into `assets/images/`. `Room.png` and `Door.png` are included as an example. Missing artwork shows temporary placeholders.
3. Open `index.html`, or, if you have trouble with local asset loading, run `python -m http.server 8000` from this folder and open `http://localhost:8000/`.
4. Later, place `Moon.mp4` in `assets/media/`, and `Gnossienne No. 1.mp3` and `Clair de lune.mp3` in `assets/audio/`.

## Files

- `index.html` — full-window canvas, floating arrows, inventory, settings and inspect dialog.
- `style.css` — appearance and sweep animations (V2 overrides at the bottom).
- `game.js` — gameplay, inventory, puzzle states, storage and turn animation.

## Customize the visual presentation

- In `style.css`, `.game-canvas` uses `aspect-ratio: 16/9` to preserve your Illustrator artwork **and clickable areas**. It fits the whole scene on narrower displays instead of cropping hotspots. This may create empty space around the 16:9 stage on tall or portrait screens.
- In `style.css`, edit `.turn-button`, `.inventory`, `.inventory-slot`, `.topbar`, or `.status` for their positions or sizes.
- Wipe timing: edit `WIPE_DURATION = 850` in `game.js`, and **both** `850ms` animation declarations for `.scene-incoming.revealing` and `.wipe-bar.sweeping` in `style.css` to the same value. The line width is `.wipe-bar{width:7%}`.
- Asset placement: in `game.js`, edit the percentages supplied to `sprite()` within `renderCabinet`, `renderWindow`, `renderPainting`, and `renderExit`. They use your artboard as the coordinate system.
- Image names are **case-sensitive on GitHub Pages**. Make sure the values in the `ASSETS` object in `game.js` match your copied files exactly. The filenames shown in prior screenshots were the basis of the current mapping.
- Missing audio/video files do not stop the game from running; the ending includes a moon fallback image.

## Test answers / existing puzzle route

1. Read the opening letter. Click cabinet drawer; click it again to examine the tarot. Cards I, II, III show 4, 2, 7; set the clock to **4:27**, revealing code **1888**.
2. At the window, compare the three-star pattern with the constellation chart. Set the five-letter box to **PYXIS**, then collect the key.
3. At the painting, place the five fragments (drag or tap a piece and then its target slot). Once complete, the axe appears underneath; click to collect.
4. At the exit, enter **1888**, select the key and use it on the keyhole, and select the axe and use it on the wooden plank. These three obstacles can be cleared **in any order**. Click the open door.
5. The moon video loops silently and `Clair de lune` plays separately, if you have provided the media files and enabled music.

Progress saves in `localStorage`. Clicking Restart erases puzzle progress.

## Legal / attribution

Before publishing, retain credit and license information for your third-party artwork and recordings. A public-domain musical *composition* does not guarantee a particular recorded performance is free to reuse.
