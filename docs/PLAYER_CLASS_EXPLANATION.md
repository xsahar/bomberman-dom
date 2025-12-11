# Player Class Explanation (`player.js`)

This document explains the structure and logic of the `Player` class in your Bomberman game. Use it as a reference for understanding, debugging, or extending player functionality.

---

## Overview
The `Player` class manages:
- Player position and movement
- DOM creation and rendering
- Keyboard input handling
- Collision detection
- Synchronization with the global store

---

## Configuration
```js
const TILE_SIZE = 40;       // Size of each map tile in pixels
const PLAYER_SIZE = 32;     // Size of the player sprite in pixels
const OFFSET = (TILE_SIZE - PLAYER_SIZE) / 2; // Center player in tile
const SPEED = 4;            // Movement speed (pixels per frame)
```
- **TILE_SIZE**: Matches the map grid cell size.
- **PLAYER_SIZE**: Player's visual size (smaller than tile for centering).
- **OFFSET**: Used to center the player in a tile.
- **SPEED**: How many pixels the player moves per frame.

---

## Constructor
```js
constructor() {
    // Set initial position (top-left safe zone)
    this.x = TILE_SIZE + OFFSET;
    this.y = TILE_SIZE + OFFSET;

    // Create player DOM element
    this.element = document.createElement('div');
    this.element.className = 'player';

    // Attach player to the map container
    const mapContainer = document.querySelector('.map');
    if (!mapContainer) return;
    mapContainer.appendChild(this.element);

    // Keyboard input handling
    this.keys = {};
    window.addEventListener('keydown', ...);
    window.addEventListener('keyup', ...);

    // Initial render and sync with store
    this.render();
    this.updateStore();
}
```
- **Position**: Starts at tile (1,1), centered.
- **DOM**: Creates and attaches the player element to the map.
- **Input**: Sets up listeners for keyboard events.
- **Render/Sync**: Draws player and updates global state.

---

## Keyboard Input Handling
```js
window.addEventListener('keydown', e => {
    this.keys[e.key] = true;
    if ([...].includes(e.key)) e.preventDefault();
});
window.addEventListener('keyup', e => {
    this.keys[e.key] = false;
    if ([...].includes(e.key)) e.preventDefault();
});
```
- Tracks which keys are pressed.
- Prevents default browser scrolling for movement keys.

---

## Movement Logic
### `update()`
Called every frame to process movement:
```js
update() {
    let dx = 0, dy = 0;
    if (this.keys['ArrowUp']) dy = -SPEED;
    if (this.keys['ArrowDown']) dy = SPEED;
    if (this.keys['ArrowLeft']) dx = -SPEED;
    if (this.keys['ArrowRight']) dx = SPEED;
    if (dx !== 0 || dy !== 0) this.move(dx, dy);
}
```
- Checks which direction keys are pressed.
- Calls `move(dx, dy)` if any movement is requested.

### `move(dx, dy)`
Attempts to move the player:
```js
move(dx, dy) {
    const nextX = this.x + dx;
    const nextY = this.y + dy;
    if (!this.checkCollision(nextX, nextY)) {
        this.x = nextX;
        this.y = nextY;
        this.render();
    }
}
```
- Calculates new position.
- Checks for collision before moving.
- Updates position and re-renders if movement is allowed.

---

## Collision Detection
### `checkCollision(newX, newY)`
Prevents movement through walls/blocks:
```js
checkCollision(newX, newY) {
    const state = store.getState();
    const mapData = state.map?.data;
    if (!mapData) return true;
    const points = [ ... ]; // 4 corners of player
    for (const p of points) {
        const col = Math.floor(p.x / TILE_SIZE);
        const row = Math.floor(p.y / TILE_SIZE);
        if (row < 0 || col < 0 || row >= 13 || col >= 15) return true;
        const tile = mapData[row][col];
        if (tile && (tile.type === 'wall' || tile.type === 'block')) return true;
    }
    return false;
}
```
- Checks all 4 corners of the player's bounding box.
- Converts pixel position to grid coordinates.
- Blocks movement if out of bounds or into a wall/block.

---

## Rendering
### `render()`
Updates the player's position visually:
```js
render() {
    this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
}
```
- Uses CSS transform for smooth movement.

---

## Store Synchronization
### `updateStore()`
Updates the player's grid position in the global store:
```js
updateStore() {
    const gridX = Math.floor((this.x + PLAYER_SIZE/2) / TILE_SIZE);
    const gridY = Math.floor((this.y + PLAYER_SIZE/2) / TILE_SIZE);
    store.setState({
        activePlayer: {
            id: 'local',
            x: gridX,
            y: gridY,
            range: 1,
            maxAmmo: 1
        }
    });
}
```
- Converts pixel position to grid coordinates.
- Updates the store for bomb logic, multiplayer, etc.

---

## Summary Table
| Method         | Purpose                                 |
|---------------|-----------------------------------------|
| constructor   | Initialize player, DOM, input, position |
| update        | Handle movement per frame               |
| move          | Attempt movement, check collision       |
| checkCollision| Prevent moving into walls/blocks        |
| render        | Update visual position                  |
| updateStore   | Sync position with global state         |

---

## Key Takeaways
- The Player class manages everything about the player entity.
- Movement and collision are handled in your code, not the framework.
- Keyboard input is tracked and browser scroll is prevented.
- Player position is always kept in sync with the game state.

Use this file to quickly remember how your player logic works and where to find each feature!
