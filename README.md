# sports-training-ui
Trainers

## U8 Training App

A mobile-first React app for running the U8 basketball training session:

- **Setup** — pre-session equipment checklist, coach roles, coaching principles
- **Exercises** — the exercise library: filter by category (dribbling, passing, shooting, defense & movement, agility, team play, warm-up), rate how much the kids liked each one, and build a focused custom training or start the full 60-minute session
- **Session** — live timer that runs through whichever training you built, with bilingual coaching cues and quick jump/prev/next controls
- **Words** — searchable bilingual (Dutch/English) coaching vocabulary

### Run it

Use Node 22+ (`nvm use` if you use nvm). Start the sibling `sports-training-api`
first; its local port is 3002.

```bash
cp .env.example .env.local
npm install
npm run dev
```

The UI runs at `http://localhost:5174` and refuses to silently change ports if
5174 is occupied. `VITE_API_URL=http://localhost:3002` must point to this project's
API, whose `/health` returns `{"status":"ok"}`. On the API, set
`ALLOWED_ORIGINS=http://localhost:5174,http://127.0.0.1:5174` (plus any deployed UI
origins you use). `.env.local` overrides `.env`; restart after environment changes.
For a phone on your LAN, run `npm run dev -- --host`, use the computer's LAN IP in
`VITE_API_URL` instead of `localhost`, and add the phone's UI origin (e.g.
`http://192.168.1.20:5174`) to the API's `ALLOWED_ORIGINS`.

Open the printed local URL on your phone (same network) or in a mobile-width browser window.

### Build

```bash
npm run build
```

### Deploying

Deployed via Netlify, connected to this repo's GitHub App integration — every push to `main` builds and deploys automatically (see `netlify.toml`; the build runs the unit suite before `vite build`, so a failing test blocks a bad deploy). No GitHub Pages — this repo previously also deployed there, but that's been dropped in favor of Netlify only.

Exercise ratings and history are stored per-device in `localStorage`. Shared, dated training plans, club info, and the trainer passcode check go through [`sports-training-api`](https://github.com/BojanKocijan/sports-training-api) (`src/lib/apiClient.ts`) — the browser never talks to Supabase directly. Set `VITE_API_URL` (see `.env.example`) to point at your API deployment.
