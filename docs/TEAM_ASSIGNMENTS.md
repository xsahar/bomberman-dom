# Bomberman DOM - Team File Assignments

## Person 1: Player Mechanics & Movement + Game Flow & UI
**Focus:** Player systems, game flow management, and user interface

### Assigned Files:
- `src/player/player.js` - Player class with properties, movement, and keyboard input handling
- `src/player/lives.js` - Lives management and respawn system
- `src/ui/gameUI.js` - In-game UI elements (nickname, lives, timer)
- `src/ui/lobby.js` - Pre-game lobby and waiting room
- `src/game/gameFlow.js` - Overall game state and flow management

### Key Responsibilities:
- ✅ Player movement (Arrow keys with collision detection)
- ✅ Keyboard input handling (preventing default scroll behavior)
- ✅ 3 lives system and respawn logic
- ❌ Lobby with nickname input and player counter
- ❌ Game start countdown (20s wait + 10s countdown)
- ❌ Game flow management (start/end conditions)
- ❌ UI for player info, lives display, and timers

---

## Person 2: Map Generation & Power-ups
**Focus:** Game world creation and power-up systems

### Assigned Files:
- `src/map/mapGenerator.js` - Map generation with walls and blocks
- `src/map/powerups.js` - Power-up spawning and collection system

### Key Responsibilities:
- ✅ Generate 15x13 grid map with fixed walls
- ✅ Random destructible block placement
- ✅ Ensure corner spawn areas are safe (3x3 zones)
- ✅ Power-up generation (Bombs, Flames, Speed)
- ✅ Power-up collection and effects
- ✅ Map reset/transition handling

---

## Person 3: Bomb Placement & Explosion Logic
**Focus:** Bomb mechanics and explosion system

### Assigned Files:
- `src/bombs/bombPlacement.js` - Bomb placement and timing system
- `src/bombs/explosion.js` - Explosion mechanics and chain reactions

### Key Responsibilities:
- ✅ Bomb placement (spacebar) with capacity limits
- ✅ 3-second bomb timer system
- ✅ Explosion mechanics in 4 directions
- ✅ Block destruction and power-up drops
- ✅ Player damage from explosions
- ✅ Chain reaction explosions

---

## Person 4: Multiplayer Chat + WebSocket Integration
**Focus:** Real-time multiplayer and communication

### Assigned Files:
- `src/multiplayer/websocket.js` - WebSocket client integration
- `src/multiplayer/chat.js` - In-game chat system
- `server/websocketServer.js` - WebSocket server implementation

### Key Responsibilities:
- ✅ WebSocket server setup (Node.js)
- ❌ Real-time player synchronization
- ✅ Chat system with message broadcasting
- ✅ Player connect/disconnect handling
- ❌ Game state synchronization across clients
- ❌ Lobby management on server side

---

## Person 5: Performance, Sync, & Final Polish
**Focus:** Optimization and final integration

### Assigned Files:
- `src/game/performance.js` - Performance monitoring and optimization
- Assist with `src/main.js` - Main game coordination
- Review and optimize all other files

### Key Responsibilities:
- ❌ 60fps optimization using requestAnimationFrame
- ❌ Performance monitoring and measurement
- ❌ Frame rate stability and no frame drops
- ❌ Memory management and optimization
- ❌ Final debugging and testing
- ❌ Integration testing of all systems
- ❌ Cross-browser compatibility

---

## Shared Utility Files:
These files can be worked on by anyone as needed:
- `src/utils/collision.js` - Collision detection utilities
- `src/utils/helpers.js` - Common helper functions
- `public/index.html` - Main HTML structure (already set up)
- `public/styles.css` - CSS styling (basic structure provided)

## Dependencies Between Teams:
- **Person 1 & 4:** Game flow needs WebSocket integration
- **Person 2 & 3:** Map generation needs bomb explosion integration  
- **Person 3 & 5:** Explosion system needs performance optimization
- **Person 1 & 5:** UI updates need performance consideration
- **All teams:** Need to use the provided framework consistently