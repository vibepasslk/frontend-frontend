# VibePass.lk Frontend

Static HTML, CSS, and JavaScript frontend for VibePass.lk.

## Deploy

1. Set `VITE_API_URL` in your frontend host environment.
2. Run `npm install`.
3. Run `npm run build`.
4. Publish the generated `dist` folder.
5. Add `vibepass.lk` and `www.vibepass.lk` in the frontend project domains.

The build fails if `VITE_API_URL` is missing. The generated `assets/js/env.js` file passes that value to the static frontend at runtime, and API calls are normalized to `/api/*`.

## Local Preview

Open `index.html` directly, or serve this folder with any static server.
