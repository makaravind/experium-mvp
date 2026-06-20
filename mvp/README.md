# AI Nature Tour — Demo

Sales demo for Experium Park. Visitors scan QR → hear audio about a plant → track discoveries.

## Setup

```bash
cd mvp
npm install
npm run dev
```

Open [localhost:3000/s/NM01](http://localhost:3000/s/NM01) to see the Neem page.

## Plant Pages

| URL | Plant |
|-----|-------|
| `/s/NM01` | Neem |
| `/s/BN02` | Banyan |
| `/s/GM03` | Gulmohar |

## Replace Placeholder Assets

1. **Photos**: Drop your real plant photos into `public/images/` as `neem.svg`, `banyan.svg`, `gulmohar.svg` (or change extensions in `src/data/plants.ts`)
2. **Audio**: Generate TTS from scripts in `scripts/narration-scripts.md`, save as `public/audio/neem.mp3`, `banyan.mp3`, `gulmohar.mp3`

## Deploy to Vercel

```bash
npm run build   # static export to out/
npx vercel      # deploy
```

## Generate QR Codes

After deploying, generate QR codes pointing to:
- `https://your-app.vercel.app/s/NM01`
- `https://your-app.vercel.app/s/BN02`
- `https://your-app.vercel.app/s/GM03`

Use any QR generator (e.g., qr.io, goqr.me).
