import { store } from '../../framework/index.js';
import { getPowerupManager } from '../utils/helpers.js';

export class ExplosionSystem {
    constructor(bombManager = null) {
        this.bombManager = bombManager; // used for chain reactions
    }
    
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

        const triggeredBombs = [];

        // 2. PROCESS DESTRUCTION & DAMAGE
        affectedTiles.forEach(tile => {
            // A0. CHAIN REACTION: If fire hits another bomb, detonate it immediately
            if (this.bombManager) {
                const hitBomb = this.bombManager.getBombAt(tile.row, tile.col);
                if (hitBomb && !hitBomb.exploded) {
                    const detonated = this.bombManager.detonateBomb(hitBomb);
                    if (detonated) {
                        triggeredBombs.push(detonated);
                    }
                }
            }

            // A. DESTROY SOFT BLOCKS
            if (mapData[tile.row][tile.col].type === 'block') {
                mapData[tile.row][tile.col].type = 'empty';

                // Try to spawn a powerup at the destroyed block's position.
                // `spawnPowerup` already handles the random chance (30%) and
                // updates the global store when it creates a powerup.
                try {
                    const pm = getPowerupManager();
                    const powerupSpawned = pm.spawnPowerup(tile.row, tile.col);
                    
                    // Broadcast powerup spawn to other players
                    if (powerupSpawned && window.mpWS?.ws?.readyState === 1) {
                        window.mpWS.send({
                            type: 'action',
                            payload: {
                                type: 'powerupSpawned',
                                row: tile.row,
                                col: tile.col,
                                powerupType: powerupSpawned.type
                            }
                        });
                        console.log(`📡 Broadcast powerup spawn: ${powerupSpawned.type} at [${tile.row}, ${tile.col}]`);
                    }
                } catch (err) {
                    console.error('Error spawning powerup:', err);
                }
            }

            // B. DAMAGE PLAYER if standing on fire tile
            if (player && player.row === tile.row && player.col === tile.col) {
                console.log(`😵 Player took damage!`);
                if (typeof player.applyDamage === 'function') {
                    player.applyDamage(1);
                } else {
                    player.lives = (player.lives || 3) - 1;
                    if (player.lives <= 0) {
                        console.log(`💀 Game Over! Player has no lives left.`);
                        player.dead = true;
                    }
                }
            }
        });

        // Chain trigger any bombs we just hit
        triggeredBombs.forEach(chainBomb => {
            this.triggerExplosion(chainBomb, mapData, player);
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

        // 5. SYNC MAP CHANGES WITH OTHER PLAYERS
        if (window.mpWS?.ws?.readyState === 1) {
            // Send the affected tiles and map changes to other players
            window.mpWS.send({
                type: 'action',
                payload: {
                    type: 'mapUpdate',
                    affectedTiles: affectedTiles,
                    mapData: mapData,
                    explosionCenter: { row: bomb.row, col: bomb.col, range: bomb.range || 1 },
                    timestamp: Date.now()
                }
            });
        }
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