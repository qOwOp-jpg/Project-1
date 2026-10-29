# THE WHITE ROOM — playable starter

This is a **vanilla HTML/CSS/JavaScript** point-and-click escape-room starter (no npm, no framework, no build step).

## Launch

1. Unzip the project.
2. Copy your original PNG/JPG files from Illustrator into `assets/images/`.
3. Open `index.html` in a browser. If your browser restricts local files, run a local server from this folder: `python -m http.server 8000` and open http://localhost:8000/.
4. Later, add `assets/media/Moon.mp4`, `assets/audio/Gnossienne No. 1.mp3`, and `assets/audio/Clair de lune.mp3` (or edit `MEDIA` in `game.js` to use different paths).
5. The game begins with music disabled; click **Music: Off** to play it. The ending video is always muted and music plays separately.

The source you shared was a **screenshot of the files**, not the original collection. I was able to include `Room.png` and `Door.png` from your earlier uploads. All other asset references are prepared but must be supplied by you. The game shows basic placeholders for any images still missing, so you can test functionality first.

## Copy these files into `assets/images/`

```text
Room.png                    [INCLUDED]
Door.png                    [INCLUDED]
Door-open.png
Table-closed.png
Table-open.png
Letter-1.png
Letter-2.png
Sun.png
Moon.png
Star.png
Tarot-back.png             [optional: digits drawn in CSS]
Clock-closed.png
Clock-open.png
Short hand.png             [optional: functional hands drawn in CSS]
Long-hand.png              [optional: functional hands drawn in CSS]
Password.png               [optional: 1888 shown in HTML]
Window.png
Constellation.png
PYXIS.png
Box-1.png
Box-2.png                 [optional: five letters are HTML]
Box-3.png
Woodcutter.jpg
Frame.png
Frame-2.png
Frame-3.png
Paint-1.png
Paint-2.png
Paint-3.png
Paint-4.png
Paint-5.png
ax.png
Key.png
Lock-1.png
Lock-2.png
Woken pank-L.png
Wooden plank-R.png
```

**Critical:** Files on GitHub Pages are case sensitive. Your screenshots contain some inconsistent spellings (e.g., `Woken pank-L.png` versus `Wooden plank-R.png`). In `game.js`, edit the `ASSETS` object to exactly match your actual filenames. You can keep spaces in filenames if paths match.

## Gameplay and test solutions

- **Start facing Wall 1**. Read the letter, open the cabinet drawer, flip three tarot cards. The seals `I / II / III` correspond to `4 / 2 / 7`, or **4:27**.
- Click the clock and set **4:27**. The clock compartment opens and reveals the main door combination **1888**.
- **Wall 2**: view Pyxis through the window, compare the constellation chart, rotate the five letters to **PYXIS**, open the box, collect the key.
- **Wall 3**: drag the five fragments into their slots, or **tap fragment → tap matching slot**. A correct drop snaps into place. The axe falls from the completed painting; close the modal and pick it up.
- **Wall 4**: enter **1888** into the number lock; select the key and click the keyhole; select the axe and click the wooden plank. They can be done **in any order**. Click the open door to see the moon ending.
- Game state is stored in `localStorage`, so refreshing preserves progress. Restart erases it.

## What you need to customize

1. **Object positions:** `renderCabinet`, `renderWindow`, `renderPainting`, and `renderExit` use percent-based `sprite()` positioning. Tweak the `left/top/width/height` values until your objects match the room backgrounds.
2. **Clock hands:** The clock currently uses an HTML/CSS analog face for reliable rotation and supports 1- and 5-minute clicks. Your clock image is displayed in the main room; you can also incorporate your individual hand PNGs into the close-up once you know their exact transparent bounds and pivot coordinates.
3. **Painting target shapes:** The drag-and-drop proof of concept currently uses 5 simple target regions in a 3-over-2 grid rather than pixel-perfect irregular jigsaw slots. The logic is implemented; adjust `modalPainting()` and `.paint-board/.paint-slot` in `style.css` to line up with your final cut shapes.
4. **Door planks:** The first exported wooden-plank image is used as the visual layer; positioning is a CSS placeholder. You may wish to composite the two halves to create an unbroken plank and add a two-half falling animation.
5. **Art assets:** Only Room and Door are included. All other assets use placeholders until you copy them in.
6. **Music permissions:** Check the license of the particular recordings (not just compositions) and credit any external art or recordings you use. The endings can loop independently.
7. **Ending media:** The moon fallback works even without the MP4. Replace by adding the MP4 and audio files to the paths above.

## File structure

```text
white-room-starter/
├── index.html
├── style.css
├── game.js
├── README.md
└── assets/
    ├── images/    # room/door included; copy your other images here
    ├── audio/     # add the two MP3s later
    └── media/     # add Moon.mp4 later
```

## Hosting

Upload everything to a public GitHub repository and enable GitHub Pages from the main branch, root (`/`). Test the live URL, especially image filename capitalization, before submission. The ZIP and live website URL are separate assignment deliverables.
