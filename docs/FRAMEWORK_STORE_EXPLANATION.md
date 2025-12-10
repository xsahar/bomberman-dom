# Framework Store Explanation

This document explains what the `store` from your framework does, how it works, and why it's important for your Bomberman game.

---

## What is the Framework Store?

The `store` is a **global state manager**. It is imported from your framework:
```js
import { store } from '../../framework/index.js';
```

It acts like a central database for your game. Any part of your code can read or update the game state using the store.

---

## What Does the Store Hold?

The store keeps track of all important game data, such as:
- The map (walls, blocks, empty spaces)
- Player positions and stats
- Bombs and explosions
- Powerups
- Game state (lobby, running, ended)

Example structure:
```js
store.setState({
    map: { data: [...] },
    activePlayer: { id: 'local', x: 5, y: 7 },
    bombs: [...],
    powerups: [...],
    gameState: 'running'
});
```

---

## How Do You Use the Store?

### 1. **Reading Data**
You can get the current game state with:
```js
const state = store.getState();
const mapData = state.map?.data;
```
This lets you see the map, player positions, bombs, etc.

### 2. **Updating Data**
You can update the game state with:
```js
store.setState({ activePlayer: { id: 'local', x: 5, y: 7 } });
```
This changes the player's position in the global state. Other parts of your game can react to this change.

---

## Why is the Store Useful?

- **Centralized:** All game data is in one place. Easy to manage and debug.
- **Communication:** Different modules (player, bombs, UI, multiplayer) can share data and stay in sync.
- **Reactivity:** When the state changes, you can re-render the UI, update the map, or send data to other players.
- **Modularity:** You can add new features (like powerups or multiplayer) without rewriting everything. Just update the store!

---

## Example: How Player Uses the Store

In your `player.js`:
- You read the map from the store to check for walls/blocks:
  ```js
  const state = store.getState();
  const mapData = state.map?.data;
  ```
- You update the player's position in the store:
  ```js
  store.setState({
      activePlayer: {
          id: 'local',
          x: gridX,
          y: gridY,
          range: 1,
          maxAmmo: 1
      }
  });
  ```

---

## Will You Need to Connect It With Other Things?

**Yes!**
- Bombs: When a player drops a bomb, update the store so the bomb logic and rendering can use the new data.
- Multiplayer: Sync player positions, bombs, and game state across clients by reading/writing to the store.
- UI: Display player stats, lives, and game info by reading from the store.
- Powerups: When a player collects a powerup, update the store so the effect is applied and the UI updates.

---

## Summary Table
| Feature      | Reads from Store | Writes to Store |
|--------------|------------------|-----------------|
| Player       | Yes              | Yes             |
| Bombs        | Yes              | Yes             |
| Powerups     | Yes              | Yes             |
| UI           | Yes              | Maybe           |
| Multiplayer  | Yes              | Yes             |

---

## Key Takeaways
- The framework store is the backbone for sharing and synchronizing game data.
- You will connect it with all major game features to keep everything in sync and interactive.
- It does **not** handle game logic (like movement or collision)—your code does that!
- It just stores and provides the data for your logic to use.

Use this file whenever you need to remember how the store works or how to connect new features to it!
