# Bomberman DOM - Project Structure

```
bomberman-dom/
│
├── 📄 ReadMe.md                          # Project overview and objectives
├── 📄 package.json                       # Dependencies and scripts
├── 📄 package-lock.json                  # Locked dependency versions
│
├── 📁 docs/                              # Documentation
│   ├── FRAMEWORK_INTEGRATION.md
│   ├── FRAMEWORK_NECESSITY_EXPLANATION.md
│   ├── FRAMEWORK_STORE_EXPLANATION.md
│   ├── NESTED_LOOPS_EXPLANATION.md
│   ├── PLAYER_CLASS_EXPLANATION.md
│   ├── SETUP.md
│   ├── Task.md
│   └── TEAM_ASSIGNMENTS.md
│
├── 📁 framework/                         # Custom framework (state management, DOM, events)
│   ├── index.js                          # Main entry point - exports all framework modules
│   ├── types.js                          # Utility functions and types
│   └── core/
│       ├── state.js                      # Global state store (store.getState, store.setState)
│       ├── dom.js                        # DOM helpers (h, createApp, render)
│       ├── events.js                     # Event management system
│       └── router.js                     # Routing system (for game screens)
│
├── 📁 public/                            # Served files
│   ├── index.html                        # Main HTML file
│   ├── styles.css                        # Game styling
│   └── assets/                           # Images, sprites (player.png, etc.)
│
├── 📁 server/                            # Backend server
│   └── websocketServer.js                # WebSocket server for multiplayer chat
│
└── 📁 src/                               # Game source code
    ├── main.js                           # Entry point - initializes game
    │
    ├── 📁 player/                        # Player mechanics (Person 1)
    │   ├── player.js                     # ✅ Player class (movement, collision, rendering)
    │   └── lives.js                      # Lives management (TODO)
    │
    ├── 📁 bombs/                         # Bomb mechanics (Person 3)
    │   ├── bombPlacement.js              # Place bombs, track ammo
    │   └── explosion.js                  # Explosion logic, damage
    │
    ├── 📁 map/                           # Map generation (Person 2)
    │   ├── mapGenerator.js               # ✅ Generate map with walls & blocks
    │   └── powerups.js                   # ✅ PowerupManager (spawn, collect)
    │
    ├── 📁 ui/                            # UI components (Person 1)
    │   ├── gameUI.js                     # In-game UI (lives, score, timer)
    │   ├── lobby.js                      # Lobby screen (nickname, player counter)
    │   └── mapRenderer.js                # ✅ Render map to DOM
    │
    ├── 📁 game/                          # Game flow (Person 1)
    │   ├── gameFlow.js                   # Game state management (lobby → playing → end)
    │   └── performance.js                # FPS counter, performance monitoring
    │
    ├── 📁 multiplayer/                   # Multiplayer (Person 4)
    │   ├── websocket.js                  # WebSocket client for syncing
    │   └── chat.js                       # Chat functionality
    │
    └── 📁 utils/                         # Utilities
        ├── collision.js                  # Collision utilities
        └── helpers.js                    # General helper functions
```

---

## Key Files Status

### ✅ Completed
- `src/player/player.js` - Full player movement with collision detection
- `src/map/mapGenerator.js` - Map generation with walls/blocks
- `src/map/powerups.js` - PowerupManager class
- `src/ui/mapRenderer.js` - Map rendering to DOM
- `framework/` - Complete custom framework

### 🔄 In Progress / TODO
- `src/bombs/bombPlacement.js` - Bomb placement logic
- `src/bombs/explosion.js` - Explosion mechanics
- `src/player/lives.js` - Lives system (3 lives per player)
- `src/ui/gameUI.js` - UI elements (lives display, timer)
- `src/ui/lobby.js` - Lobby screen
- `src/game/gameFlow.js` - Game state transitions
- `src/multiplayer/websocket.js` - Multiplayer sync
- `src/multiplayer/chat.js` - Chat system

---

## File Dependencies

```
main.js
├── imports: MapGenerator, Player, renderMap, store
├── calls: initializeGame()
└── creates: app, gameLoop

player.js
├── imports: store
├── uses: TILE_SIZE, PLAYER_SIZE, SPEED
├── methods: update(), move(), checkCollision(), render(), updateStore()
└── updates: store.activePlayer

mapGenerator.js
├── imports: store
├── methods: generateMap(), placeWalls(), placeBlocks(), clearSpawnAreas()
└── updates: store.map

mapRenderer.js
├── imports: h (framework)
├── function: renderMap(mapData)
└── returns: virtual DOM for map

powerups.js
├── methods: spawnPowerup(), collectPowerup(), renderPowerups()
└── manages: powerup placement and collection

framework/index.js
├── exports: store, eventManager, router, h, createApp, etc.
└── used by: all game modules
```

---

## Game Flow

```
1. Load index.html
2. main.js executes
3. initializeGame()
   - MapGenerator.generateMap()
   - Update store with map
   - Render map to DOM
4. Player instance created
   - Listen for keyboard input
   - Start game loop
5. Game Loop (60fps)
   - player.update()
   - Check collisions
   - Update bombs (TODO)
   - Check explosions (TODO)
   - Check powerup collection (TODO)
   - Render changes
6. Player presses Space (TODO)
   - Bomb placed
   - Bomb timer countdown
   - Explosion triggers (TODO)
```

---

## Next Steps to Implement

1. **Bombs** (`src/bombs/bombPlacement.js` + `explosion.js`)
   - Place bomb on Space press
   - Timer countdown
   - Explosion in 4 directions
   - Destroy blocks
   - Spawn powerups

2. **Lives** (`src/player/lives.js`)
   - Start with 3 lives
   - Lose life on explosion
   - Respawn logic

3. **UI** (`src/ui/gameUI.js` + `lobby.js`)
   - Lobby screen (nickname input)
   - Lives display
   - Timer display
   - Game over screen

4. **Multiplayer** (`src/multiplayer/`)
   - WebSocket connection
   - Sync player positions
   - Sync bombs
   - Chat system

---

## Naming Conventions

- **Classes**: `PascalCase` (Player, MapGenerator, PowerupManager)
- **Functions**: `camelCase` (placeBomb, checkCollision, spawnPowerup)
- **Constants**: `UPPER_CASE` (TILE_SIZE, SPEED, PLAYER_SIZE)
- **CSS Classes**: `kebab-case` (.player, .bomb, .explosion, .map-cell)

---

## Coding Standards

- Use `const` by default, `let` if needed
- Import at top of file
- Comment complex logic
- Use arrow functions for callbacks
- Keep functions small and focused
- Update store for all state changes
