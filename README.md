# 🐷🎉 Peppa's Party Time!

A cheerful 3D browser party game for kids, built with [Three.js](https://threejs.org/).
Run around a sunny garden as a party pig in a red dress, collect all 10 party treats,
splash in muddy puddles, and hit the big DANCE button. Collect everything to trigger
**PARTY TIME** — fireworks, confetti rain, and a disco ball!

> ⚠️ **Unofficial fan game** made for personal, non-commercial use. All artwork is
> original and generated in code — no copyrighted images, music, or assets are used.
> "Peppa Pig" is a trademark of Hasbro / Entertainment One; this project is not
> affiliated with or endorsed by them.

## 🎮 How to play

| Action | Desktop | Touch |
|---|---|---|
| Move | Arrow keys or WASD | Pink joystick (bottom-left) |
| Dance | Spacebar or 💃 button | 💃 button |
| Music on/off | `M` or 🎵 button | 🎵 button |

- Collect all **10 treats** (cupcakes, presents, donuts) to start the party 🎆
- Run through **muddy puddles** for a splashy surprise 💦
- No losing, no timers — just party fun!

## 🚀 Run it

It's a fully static site — no build step.

**Play online (GitHub Pages):** https://appforgelabs.github.io/PeppaPartyTime/

**Run locally:**

```bash
cd PeppaPartyTime
python3 -m http.server 8000
# open http://localhost:8000
```

(A local server is needed because the game uses ES modules; opening `index.html`
directly via `file://` won't work.)

## ⚙️ Enabling GitHub Pages (one-time setup)

1. Go to **Settings → Pages** in this repo:
   https://github.com/Appforgelabs/PeppaPartyTime/settings/pages
2. Under **Build and deployment**, choose:
   - Source: **Deploy from a branch**
   - Branch: **main** · folder: **/ (root)** → **Save**
3. Wait ~1 minute, then visit https://appforgelabs.github.io/PeppaPartyTime/

## 🗂️ Files

| File | Purpose |
|---|---|
| `index.html` | Page shell, UI overlay (title, stars, buttons, joystick), import map |
| `main.js` | The whole game: 3D world, pig character, physics, particles, music & SFX |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |

## 🔧 Tech notes

- Three.js loaded from CDN via an import map (`three@0.160.0`)
- Pig, cake, trees, bunting, rainbow — all procedural Three.js geometry
- Music and sound effects synthesized live with the Web Audio API
  (an original melody — no copyrighted tunes)
- Works on desktop and mobile browsers (touch joystick included)
