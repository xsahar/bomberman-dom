
---

### 1. **Player Mechanics & Movement + Game Flow & UI (Person 1)**

* **Responsibilities:**

  * **Player Mechanics:** Handle player movement (up, down, left, right) and player states (alive or dead).
  * **Lives & Respawn:** Implement the 3 lives system, and ensure that players respawn or exit when they die.
  * **UI Elements:** Create the main game UI, such as:

    * Player’s nickname display.
    * A countdown timer for the game start.
    * Displaying player’s remaining lives.
  * **Game Flow:** Handle the start and end of the game:

    * Countdown timer to start the game after players join.
    * Game start and end logic (victory conditions, player dead, etc.).
* **Skills/Tools:** Basic DOM manipulation, input handling, game loop.

---

### 2. **Map Generation & Power-ups (Person 2)**

* **Responsibilities:**

  * **Map Creation:** Generate the game map with walls and destructible blocks.
  * **Player Spawn:** Ensure players spawn at designated safe positions (corners).
  * **Power-ups:** Implement random power-ups that appear when blocks are destroyed, and their effects (bombs, speed, flame range).
  * **Map Reset/Transition:** Handle resetting or adjusting the map as the game progresses.
* **Skills/Tools:** Procedural map generation, randomization, basic collision detection.

---

### 3. **Bomb Placement & Explosion Logic (Person 3)**

* **Responsibilities:**

  * **Bomb Placement:** Handle player bomb placement and timer-based explosions.
  * **Explosion Mechanics:** Implement bomb explosions and their effects on blocks, walls, and players.
  * **Chain Reactions:** Ensure explosions affect adjacent blocks and players in the correct manner.
  * **Power-up Drop:** When a block is destroyed, handle random power-up drops (like bombs, flames, etc.).
* **Skills/Tools:** Game physics, timers, event handling.

---

### 4. **Multiplayer Chat + WebSocket Integration (Person 4)**

* **Responsibilities:**

  * **WebSocket Setup:** Set up the WebSocket server and client to manage real-time multiplayer interactions.
  * **Chat System:** Implement a basic chat feature that allows players to talk to each other during the game.
  * **Synchronization:** Ensure the actions of all players (movement, bomb placement) are synchronized across clients.
* **Skills/Tools:** WebSockets API, real-time data handling.

---

### 5. **Performance, Sync, & Final Polish (Person 5)**

* **Responsibilities:**

  * **Performance Optimization:** Ensure the game runs smoothly at 60fps. This includes using `requestAnimationFrame` properly and managing game loops efficiently.
  * **Synchronization:** Work with Person 4 to ensure all player actions (movement, bomb placement) are synchronized across all clients in real-time.
  * **Debugging & Testing:** Test the game for bugs, frame rate drops, or performance issues.
  * **Final Polish:** Ensure the overall game is smooth, including UI elements, smooth transitions, and responsive controls.
* **Skills/Tools:** Performance profiling, testing, debugging, optimization techniques.

---

### **Summary of Task Distribution**

1. **Player Mechanics & Movement + Game Flow & UI** – Person 1
2. **Map Generation & Power-ups** – Person 2
3. **Bomb Placement & Explosion Logic** – Person 3
4. **Multiplayer Chat + WebSocket Integration** – Person 4
5. **Performance, Sync, & Final Polish** – Person 5 