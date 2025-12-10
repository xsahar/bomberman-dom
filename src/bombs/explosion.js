import { store } from '../../framework/index.js';

export class ExplosionSystem {
    
    /**
     * Triggered when the timer runs out. Handles destruction and damage.
     * @param {Object} bomb - The bomb object with row, col, range properties.
     * @param {Object} mapData - The game map data.
     * @param {Object} player - The player object for damage handling.
     */
    triggerExplosion(bomb, mapData, player) {
        if (!bomb) return;

        console.log(`💥 BOOM! Bomb at [${bomb.row}, ${bomb.col}] exploded.`);

        // 1. CALCULATE FIRE PATH (The "+" Shape)
        const affectedTiles = this.calculateExplosionRange(bomb, mapData);

        // 2. PROCESS DESTRUCTION & DAMAGE
        affectedTiles.forEach(tile => {
            // A. DESTROY SOFT BLOCKS
            if (mapData[tile.row][tile.col].type === 'block') {
                mapData[tile.row][tile.col].type = 'empty';
            }

            // B. DAMAGE PLAYER if standing on fire tile
            if (player && player.row === tile.row && player.col === tile.col) {
                console.log(`😵 Player took damage!`);
                player.lives = (player.lives || 3) - 1;
                
                if (player.lives <= 0) {
                    console.log(`💀 Game Over! Player has no lives left.`);
                    player.dead = true;
                }
            }
        });

        // 3. CREATE EXPLOSION VISUALS
        affectedTiles.forEach(tile => {
            const TILE_SIZE = 40;
            const explosionDiv = document.createElement('div');
            explosionDiv.className = 'explosion';
            explosionDiv.style.left = (tile.col * TILE_SIZE) + 'px';
            explosionDiv.style.top = (tile.row * TILE_SIZE) + 'px';
            
            const mapContainer = document.querySelector('.map');
            if (mapContainer) {
                mapContainer.appendChild(explosionDiv);
            }
            
            // Remove explosion visual after 500ms
            setTimeout(() => explosionDiv.remove(), 500);
        });

        // 4. UPDATE STORE (only after explosion, not during frequent updates)
        // This will trigger the map renderer to update and show destroyed blocks
        const state = store.getState();
        store.setState({
            map: { ...state.map, data: mapData }
        });
    }

    // Math helper to find which tiles are safe vs hit
    calculateExplosionRange(bomb, mapData) {
        const tiles = [];
        
        // Always hit the center tile
        tiles.push({ row: bomb.row, col: bomb.col });
        
        // Directions: Up, Down, Left, Right
        const directions = [
            { r: -1, c: 0 }, // Up
            { r: 1, c: 0 },  // Down
            { r: 0, c: -1 }, // Left
            { r: 0, c: 1 }   // Right
        ];

        // Spread fire in each direction up to bomb range
        directions.forEach(dir => {
            for (let i = 1; i <= (bomb.range || 1); i++) {
                const r = bomb.row + (dir.r * i);
                const c = bomb.col + (dir.c * i);
                
                // Stop if out of map bounds
                if (r < 0 || r >= mapData.length || c < 0 || c >= mapData[0].length) break;

                const cellType = mapData[r][c].type;

                // Stop at Hard Walls (Fire cannot pass)
                if (cellType === 'wall') break;

                // Add to hit list
                tiles.push({ row: r, col: c });

                // Stop at Soft Blocks (Block destroys, but stops fire spreading further)
                if (cellType === 'block') break;
            }
        });
        return tiles;
    }
}