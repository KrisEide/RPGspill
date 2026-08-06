# Pact & Peril

A two-player turn-based roguelike RPG built with React, TypeScript, Socket.IO,
and a shared deterministic combat engine.

## Local development

Run the multiplayer server:

```bash
npm run dev:server
```

Run the Vite client in a second terminal:

```bash
npm run dev
```

The client runs on `http://localhost:5173` and connects to the game server on
`http://localhost:3001`.

## Production build

```bash
npm run build
npm start
```

The production Node process serves both the built React client and Socket.IO
from the same port. Set `PORT` to override the local default of `3001`.

## Render

The included `render.yaml` defines one Node web service. In Render, create a
new Blueprint from the repository. No database, persistent disk, or custom
environment variables are required for the first multiplayer prototype.
