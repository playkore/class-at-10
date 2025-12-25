# Eve Hunter Adventure

Story-first pixel hunt prototype built with React and Vite. The goal is to let you
create multiple scene backdrops and wire hotspots inside each scene to branching
actions. The UI is mobile-friendly and ready to publish to GitHub Pages.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173/ and tap on the highlighted regions of the scene to
see the contextual actions.

## Folder structure

- `src/data/scenes.ts` — declarative scene catalogue (add new scenes here).
- `src/components/SceneView.tsx` — renders the background art and hotspot overlays.
- `src/types.ts` — shared interfaces for scenes, hotspots, and actions.
- `public/` — static files (sample SVG scene, icons, future ambient audio).
- `vite.config.ts` — Vite + GitHub Pages base path configuration.

## Adding scenes

1. Drop new background art into `public/` (PNG, JPG, or SVG) or host it remotely.
2. Add a new scene object inside `src/data/scenes.ts` including a unique `id`,
   `name`, `imageSrc`, `narrative`, and `hotspots`.
3. Hotspots are defined as percentage-based rectangles so the layout stays responsive.
4. Each hotspot may expose several `actions`. Optionally set `nextSceneId` to jump
   to another scene after an action resolves.

The `SceneView` component automatically renders hotspots and their available actions.
You can customize the per-action UI by editing `src/components/SceneView.tsx`.

## Deploying to GitHub Pages

This repository now ships with `.github/workflows/deploy.yml`, which automatically
builds the site on pushes to `main` (and on manual dispatches) and publishes the
`dist/` folder through the official GitHub Pages deployment pipeline.

1. Push the repository to GitHub (ensure the repo name matches the project folder).
2. In GitHub, go to **Settings → Pages** and choose **GitHub Actions** as the source
   (if it is not already selected). The workflow will take care of subsequent deploys.
3. Every push to `main` will run `npm ci`, `npm run build`, and deploy the build
   artifact to the Pages environment.
4. If you still need a manual deploy (for example, from a fork), run `npm run deploy`
   locally to publish via the `gh-pages` branch.

The Vite config automatically derives the correct `base` path from the repository
name when `GITHUB_REPOSITORY` is available (e.g., inside Actions), so links will
work both locally (`/`) and on Pages (`/eve-hunter-adventure/`).

## Next steps

- Replace the placeholder SVG and Unsplash image with your actual scene art.
- Wire additional game state or puzzle logic by expanding `SceneAction`.
- Add soundscapes or voice overs with the optional `ambientSound` field.
- Hook up a save system using `localStorage` if you want to resume progress on mobile.
