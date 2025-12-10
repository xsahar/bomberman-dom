// Import the global state manager from the framework
import { store } from '../../framework/index.js';

// --- Player visual and movement configuration ---
const TILE_SIZE = 40;       // Size of each map tile in pixels
const PLAYER_SIZE = 32;     // Size of the player sprite in pixels
const OFFSET = (TILE_SIZE - PLAYER_SIZE) / 2; // Center player in tile
const SPEED = 4;            // Movement speed (pixels per frame)

export class Player {
    constructor() {
        console.log("🤖 Player Constructor Started...");

        // --- 1. Initialize Player Data (REQUIRED FOR BOMBS) ---
        this.id = 'p1';          // ID to track who owns the bomb
        this.lives = 3;          // Audit Requirement: Start with 3 lives
        this.maxBombs = 1;       // Max bombs allowed at once
        this.bombRange = 1;      // Explosion range
        this.dead = false;       // Track death state

        // Remember starting spawn for respawns
        this.spawnRow = 1;
        this.spawnCol = 1;

        // --- 2. Set initial position (top-left safe zone) ---
        // Start at tile (1,1)
        this.row = this.spawnRow; 
        this.col = this.spawnCol;
        
        // Convert Grid (1,1) to Pixels for the visual position
        this.x = (this.col * TILE_SIZE) + OFFSET; 
        this.y = (this.row * TILE_SIZE) + OFFSET;

        console.log(`📍 Initial Position calculated: x=${this.x}, y=${this.y}`);

        // --- 3. Create player DOM element ---
        this.element = document.createElement('div'); // Create a div for the player
        this.element.className = 'player';            // Assign CSS class for styling

        // --- 4. Attach player to the map container ---
        const mapContainer = document.querySelector('.map');
        if (!mapContainer) {
            console.error("❌ CRITICAL ERROR: .map container missing!");
            return;
        }
        mapContainer.appendChild(this.element);
        console.log("✅ Player element added to DOM");

        // --- 5. Keyboard input handling ---
        this.keys = {};
        window.addEventListener('keydown', e => {
            this.keys[e.key] = true;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });
        window.addEventListener('keyup', e => {
            this.keys[e.key] = false;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });

        // --- 6. Initial render ---
        this.render(); 
        console.log("✅ Player Rendered Successfully");
    }

    // Called every frame to update player movement
    update() {
        if (this.dead) return; // No movement when dead

        let dx = 0;
        let dy = 0;

        // Check which movement keys are pressed
        if (this.keys['ArrowUp']) dy = -SPEED;
        if (this.keys['ArrowDown']) dy = SPEED;
        if (this.keys['ArrowLeft']) dx = -SPEED;
        if (this.keys['ArrowRight']) dx = SPEED;

        // Only move if a direction key is pressed
        if (dx !== 0 || dy !== 0) {
            this.move(dx, dy);
        }
    }

    // Attempt to move the player by dx, dy
    move(dx, dy) {
        const nextX = this.x + dx;
        const nextY = this.y + dy;

        // Check for collision before moving
        if (!this.checkCollision(nextX, nextY)) {
            // 1. Update Visual Position (Pixels)
            this.x = nextX;
            this.y = nextY;

            // 2. Update Grid Position (Logic)
            // This allows the Bomb System to know EXACTLY which tile we are on
            // We use the center of the player to decide the tile
            const centerX = this.x + PLAYER_SIZE / 2;
            const centerY = this.y + PLAYER_SIZE / 2;
            
            this.col = Math.floor(centerX / TILE_SIZE);
            this.row = Math.floor(centerY / TILE_SIZE);

            // 3. Render the change
            this.render(); 

            // ⚠️ Don't update store every frame - causes framework rendering issues
            // The bomb system will use this.row and this.col directly from the player object
            // No need to sync with store on every move 
        }
    }

    // Collision detection: returns true if movement is blocked
    checkCollision(newX, newY) {
        const state = store.getState();
        const mapData = state.map?.data;
        
        if (!mapData) return true; // Block movement if map isn't loaded

        // Check all 4 corners of the player's bounding box
        const points = [
            { x: newX, y: newY },                              // Top-left
            { x: newX + PLAYER_SIZE, y: newY },                // Top-right
            { x: newX, y: newY + PLAYER_SIZE },                // Bottom-left
            { x: newX + PLAYER_SIZE, y: newY + PLAYER_SIZE }   // Bottom-right
        ];

        for (const p of points) {
            // Convert pixel position to grid coordinates
            const col = Math.floor(p.x / TILE_SIZE);
            const row = Math.floor(p.y / TILE_SIZE);

            // Block movement if out of bounds
            if (row < 0 || col < 0 || row >= 13 || col >= 15) return true;

            // Block movement if cell is a wall or block
            const tile = mapData[row][col];
            if (tile && (tile.type === 'wall' || tile.type === 'block')) {
                return true; 
            }
        }
        return false; // No collision detected
    }

    // Update the player's position visually using CSS transform
    render() {
        this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
    }

    // Apply incoming damage (used by explosions)
    applyDamage(amount = 1) {
        if (this.dead) return;

        this.lives = Math.max(0, (this.lives || 0) - amount);
        this.flashHit();

        if (this.lives <= 0) {
            this.die();
        } else {
            this.respawnAtSpawn();
        }
    }

    // Brief visual feedback for damage
    flashHit() {
        if (!this.element) return;
        const originalOpacity = this.element.style.opacity || '1';
        this.element.classList.add('player-hit');
        this.element.style.opacity = '0.5';
        setTimeout(() => {
            if (this.element) {
                this.element.classList.remove('player-hit');
                this.element.style.opacity = originalOpacity;
            }
        }, 250);
    }

    // Handle death: mark dead, stop input, remove from DOM
    die() {
        this.dead = true;
        this.keys = {};
        if (this.element) {
            this.element.classList.add('player-dead');
            this.element.style.opacity = '0.35';
            this.element.remove();
        }
    }

    // Move the player back to the starting corner when hit but still alive
    respawnAtSpawn() {
        // Reset grid position
        this.row = this.spawnRow;
        this.col = this.spawnCol;

        // Reset pixel position
        this.x = (this.col * TILE_SIZE) + OFFSET;
        this.y = (this.row * TILE_SIZE) + OFFSET;

        // Ensure the element is in the DOM (in case it was removed externally)
        if (this.element && !document.body.contains(this.element)) {
            const mapContainer = document.querySelector('.map');
            if (mapContainer) {
                mapContainer.appendChild(this.element);
            }
        }

        this.render();
    }

    // Sync the player's grid position with the global store
    // (Currently unused to prevent Framework Crash)
    updateStore() {
        store.setState({
            activePlayer: {
                id: this.id,
                col: this.col,   // Corrected variable name
                row: this.row,   // Corrected variable name
                lives: this.lives,
                range: this.bombRange,
                maxAmmo: this.maxBombs
            }
        });
    }
}