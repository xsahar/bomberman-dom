// Requirements:
// - Handle bomb placement by players (spacebar key)
// - Bomb timer system (3 second countdown)
// - Bomb capacity limits per player
// - Bomb collision detection
// - Methods: placeBomb(), updateBombs(), canPlaceBomb(), removeBomb(), renderBombs()

export class BombPlacement {
    constructor() {
        this.BOMB_TIMER = 3000; // 3 Seconds standard fuse
        this.activeBombs = []; // Track bombs locally to avoid store calls
    }

    /**
     * Attempts to place a bomb at the player's location.
     * @param {Object} player - The player object containing row, col, id, maxBombs, etc.
     * @param {Array} mapData - The game map data for collision checking.
     * @returns {Object|null} - Returns the new bomb if successful, or null if failed.
     */
    placeBomb(player, mapData) {
        // 1. AMMO CHECK (The "Slots" Logic)
        // Count how many bombs this specific player currently has on the board.
        const playerActiveBombs = this.activeBombs.filter(b => b.ownerId === player.id).length;
        
        // If active bombs >= max limit (default 1), deny placement.
        if (playerActiveBombs >= (player.maxBombs || 1)) {
            console.log("🚫 Limit reached! Wait for a bomb to explode.");
            return null;
        }

        // 2. GRID SNAP
        // We trust the player's internal grid coordinates (calculated in Player.js)
        const row = player.row;
        const col = player.col;

        // 3. DUPLICATE CHECK
        // Prevent stacking two bombs on the exact same tile.
        const bombExists = this.activeBombs.some(b => b.row === row && b.col === col);
        if (bombExists) return null;

        // 4. WALL CHECK
        // Safety check to ensure we aren't clipping inside a Hard Wall.
        if (mapData[row][col].type === 'wall') return null;

        // 5. CREATE THE BOMB OBJECT
        const newBomb = {
            id: Date.now() + Math.random(), // Unique ID for tracking
            ownerId: player.id,             // To track who gets points/kills
            row: row,
            col: col,
            range: player.bombRange || 1,   // Default range is 1 (upgradable later)
            timer: this.BOMB_TIMER,
            element: null                   // Will hold the DOM element
        };

        // 6. CREATE DOM ELEMENT FOR BOMB
        const TILE_SIZE = 40;
        const bombElement = document.createElement('div');
        bombElement.className = 'bomb';
        bombElement.style.left = (col * TILE_SIZE) + 'px';
        bombElement.style.top = (row * TILE_SIZE) + 'px';
        
        // Add to map container
        const mapContainer = document.querySelector('.map');
        if (mapContainer) {
            mapContainer.appendChild(bombElement);
            newBomb.element = bombElement;
        }

        // 7. TRACK BOMB LOCALLY
        this.activeBombs.push(newBomb);

        console.log(`💣 Bomb dropped at [${row}, ${col}]`);
        return newBomb; // Return it so main.js knows to start the timer
    }

    // Remove bomb from DOM and local tracking
    removeBomb(bombId, bombElement) {
        if (bombElement) {
            bombElement.remove(); // Remove from DOM
        }
        // Remove from local tracking
        this.activeBombs = this.activeBombs.filter(b => b.id !== bombId);
        console.log(`💥 Bomb ${bombId} removed`);
    }
}