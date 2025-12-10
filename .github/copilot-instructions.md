<!-- Project-specific instructions for AI coding agents working on bomberman-dom -->

# bomberman-dom — Copilot instructions

This file captures the concrete conventions, architecture and workflows an AI agent should follow to be immediately productive in this repository.

- Keep the output concise and actionable. Prefer small patches that edit one or two files.
- Match existing code style: ES modules, `const`/`let`, PascalCase for classes, camelCase for functions.

## Architecture (big picture)

- Custom lightweight DOM framework in `framework/` (single-entry `framework/index.js`). It exports `store`, `h`, `createApp`, `render`, event helpers, and utilities. Modify framework code only if necessary and low-risk.
- Client-side game code in `src/` with clear responsibilities:
  - `src/main.js` bootstraps the app: calls `MapGenerator`, sets initial `store` state, creates `Player`, and wires bomb/ explosion systems.
  - `src/map/` generates map and powerups (`mapGenerator.js`, `powerups.js`). Powerups are stored in `store.powerups`.
  - `src/player/player.js` contains Player class; it manages pixel and grid positions locally on the instance (important: avoid updating store every frame).
  - `src/ui/mapRenderer.js` renders the map using the framework `h` helpers and returns the `.map` container used by Player and Bomb systems.
  - `src/bombs/` contains bomb placement and explosion systems (work-in-progress). main.js uses these directly and expects Player.row/col to be authoritative.
- Server: `server/websocketServer.js` is currently a TODO — `npm start` runs this file but it is intentionally unimplemented. Tests and multi-client integration are manual via `npm run serve` + multiple browser tabs.

## State & dataflow rules (important golden rules)

- The global framework store (`framework/core/state.js`) holds serializable app state (map, players snapshot, powerups, bombs, explosions). Use `store.setState()` for non-frequent updates (map generation, powerup collection, bomb spawn/clear), but do NOT set state every frame.
- Player movement updates should remain local to the `Player` instance (see `src/player/player.js`) — the bomb and explosion systems read `player.row` and `player.col` directly.
- When mutating arrays in state, follow the repository's immutability pattern (create a new array and call `store.setState({ ... })`) — see `src/map/powerups.js` for examples.

## Developer workflows / commands

- Install deps: `npm install` (see `docs/SETUP.md`).
- Start WebSocket server (placeholder): `npm start` (runs `server/websocketServer.js`). Currently not implemented; don't rely on it for local development.
- Serve static files for the client: `npm run serve` (serves `public/` on http://localhost:8080). Open multiple tabs to test multiplayer-like behavior.

## Project-specific conventions & patterns

- DOM and rendering
  - UI components return framework `h` virtual DOM nodes. See `src/ui/mapRenderer.js` and `framework/core/dom.js`.
  - The `.map` element is created by `renderMap()` and is used as the absolute-positioned container for player/bomb DOM elements.

- Timing & performance
  - Aim for 60fps; use `requestAnimationFrame` for the game loop (`src/main.js` gameLoop). Avoid frequent `store.setState()` in hot paths to prevent framework re-renders.

- Naming
  - Classes: PascalCase (MapGenerator, PowerupManager, Player)
  - Functions: camelCase (spawnPowerup, renderMap)

## Integration points & TODOs that an agent may touch

- Bombs & explosions: `src/bombs/bombPlacement.js` and `src/bombs/explosion.js` — these are incomplete and must use Player.row/col for placement. main.js shows expected usage.
- WebSocket server: `server/websocketServer.js` — stub. If implementing multiplayer, follow messaging patterns in `src/multiplayer/websocket.js` (currently TODO) and keep server as a simple broadcast relay using `ws`.
- Store additions: initial `store` shape is in `framework/core/state.js`. When adding new state keys, update the initial state there to avoid undefined checks.

## Concrete code examples (copy-paste safe)

- Read player grid pos (do this, do not call store every frame):
  - const row = player.row; const col = player.col; // Player instance is authoritative

- Add a powerup to state (see `src/map/powerups.js`):
  - const state = store.getState();
  - store.setState({ powerups: [...(state.powerups||[]), newPowerup] });

## PR guidance for AI agents

- Keep changes minimal and self-contained per PR. Prefer adding tests or small example harnesses under `docs/` if behavior is unclear.
- When changing rendering or store patterns, run manual validation: `npm run serve` + open http://localhost:8080 and confirm console logs shown in `src/main.js` (page load, map initialization, game loop start).

## Files to reference when making edits

- Bootstrapping & wiring: `src/main.js`
- Player logic (movement & local state): `src/player/player.js`
- Map + powerups: `src/map/mapGenerator.js`, `src/map/powerups.js`
- Map rendering: `src/ui/mapRenderer.js`
- Framework entry: `framework/index.js` and `framework/core/state.js`

---

If anything here is unclear or you want this condensed further, tell me which section to expand or examples to add.
