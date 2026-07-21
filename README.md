# 🐷🎉 Peppa's Party Time!

A pastel, Apple-Arcade-style 3D birthday party game with learning mini-games,
built with **React**, **React Three Fiber**, **Three.js**, **Zustand** and the
**Web Audio API**. Made for a 6-year-old — no losing, no timers, just party fun.

> ⚠️ **Unofficial fan game** for personal, non-commercial use. All 3D art is
> procedural geometry and all sound is synthesized in code — no copyrighted
> assets. "Peppa Pig" is a trademark of Hasbro / Entertainment One; this
> project is not affiliated with or endorsed by them.

## 🎮 Mini-games

| Mini-game | What happens | Learning |
|---|---|---|
| 🎈 **Balloon Pop** | Tap floating balloons — elastic pop, confetti burst, ascending chime | Counting (big splash numbers + counter) |
| 🎁 **Present Unboxing** | Tap a gift — lid springs off, a 3D toy floats out | Phonics card (P-I-G 🐷, D-U-C-K 🦆, B-A-L-L ⚽) |
| 🍰 **Cake Decorating** | Tap Star / Heart / Candy to place spinning toppers | Creativity & fine motor |
| 🕯️ **Candle Blowing** | Room dims, flames flicker — tap each flame out | Counting down, cause & effect, victory melody |
| 🎉 **Celebration** | Screen-wide balloon cascade, 3D confetti rain, fanfare | Pure joy |

## 🚀 Run locally

```bash
npm install
npm run dev        # http://localhost:5173/PeppaPartyTime/
```

Build & preview production:

```bash
npm run build
npm run preview
```

## 🌐 Deploy to GitHub Pages (one-time setup)

This repo ships with a GitHub Actions workflow (`.github/workflows/deploy.yml`)
that builds the Vite app and publishes it on every push to `main`.

1. Go to **Settings → Pages**:
   https://github.com/Appforgelabs/PeppaPartyTime/settings/pages
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main` (or run the workflow manually) — the game goes live at
   **https://appforgelabs.github.io/PeppaPartyTime/**

> The `base: '/PeppaPartyTime/'` in `vite.config.js` must match the repo name.

## 🗂️ Project structure

```
├── index.html
├── vite.config.js
├── .github/workflows/deploy.yml   # auto-deploy to GitHub Pages
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles.css                 # glassmorphic pastel HUD
    ├── audio/soundEngine.js       # Web Audio API synth (no audio files)
    ├── store/useGameStore.js      # zustand game state
    └── components/
        ├── CanvasContainer.jsx    # Canvas, lights, shadows, camera
        ├── PartyScene.jsx         # garden, hills, cake, gift tables
        ├── Balloons.jsx           # pop physics + <Burst/> particles
        ├── PresentBox.jsx         # unboxing + procedural 3D toys
        ├── CakeDecorations.jsx    # toppers + candle-blowing
        └── UIOverlay.jsx          # glassmorphic HUD
```
