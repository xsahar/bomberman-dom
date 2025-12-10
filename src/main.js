import { createApp, h, store } from '../framework/index.js';
import { MapGenerator } from './map/mapGenerator.js';
import { renderMap } from './ui/mapRenderer.js';
import { Player } from './player/player.js'; 
import { BombPlacement } from './bombs/bombPlacement.js';
import { ExplosionSystem } from './bombs/explosion.js';

function initializeGame() {
    console.log('🎮 Initializing Data...');
    
    // 1. Generate the Grid (Walls & Blocks)
    const generator = new MapGenerator();
    const mapData = generator.generateMap();

    // 2. Save Everything to Global Store
    store.setState({ 
        map: { data: mapData, rows: 13, cols: 15 },
        powerups: [], // Powerups spawn dynamically when blocks are destroyed
        bombs: [],
        explosions: [], // Needed for the renderer to draw fire
        gameState: 'lobby'
    });
    
    return mapData;
}

function RootComponent() {
    const state = store.getState();
    const mapData = state.map?.data || [];
    
    return h.div({ className: 'game-root' }, [
        h.h1({}, 'Bomberman Game'),
        // Draw the map container. If map is empty, show loading text.
        mapData.length > 0 ? renderMap(mapData) : h.div({}, 'Loading map...')
    ]);
}

window.addEventListener('load', () => {
    console.log('✅ Page loaded');
    const container = document.getElementById('app');
    
    if (!container) {
        console.error("❌ Error: Container #app not found!");
        return;
    }

    // 1. Setup Data (Map & Powerups)
    initializeGame();
    
    // 2. Render the Map to the DOM
    const app = createApp(RootComponent, container);
    app.connectToStore(store);
    app.render();
    
    // Get the map container for adding bombs later
    const mapContainer = document.querySelector('.map'); 
    
    // 3. Create Player & Bomb Systems (Wait 100ms to ensure DOM is painted)
    setTimeout(() => {
        console.log('🕹️ Spawning Player...');
        
        // We instantiate the player. Inside its constructor, 
        // it will attach itself to the .map div we just rendered.
        const player = new Player();

        // --- NEW: Initialize Bomb Logic ---
        const bombPlacer = new BombPlacement();
        const explosionSystem = new ExplosionSystem();

        // 4. Input Listener for Bombs (Spacebar)
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault(); // Stop page scrolling
                
                // Get mapData for bomb placement validation
                const state = store.getState();
                const mapData = state.map.data;
                
                // Get player's current grid position directly from player object
                // (Don't use store - causes rendering issues)
                const newBomb = bombPlacer.placeBomb({
                    id: 'local-player',
                    row: player.row,           // Grid row (updated in move())
                    col: player.col,           // Grid col (updated in move())
                    maxBombs: 1,               // Default 1 bomb
                    bombRange: 1               // Default 1 range
                }, mapData);

                // B. If successful, set the fuse!
                if (newBomb) {
                    setTimeout(() => {
                        // C. Trigger Explosion after 3 seconds
                        const state = store.getState();
                        const mapData = state.map.data;
                        console.log(`💥 Explosion triggered for bomb ${newBomb.id}`);
                        bombPlacer.removeBomb(newBomb.id, newBomb.element); // Remove bomb from DOM
                        explosionSystem.triggerExplosion(newBomb, mapData, player); // Pass bomb, map, and player
                    }, 3000); 
                }
            }
        });

        // 5. Start Game Loop (Movement & Physics)
        function gameLoop() {
            player.update();
            requestAnimationFrame(gameLoop);
        }
        
        gameLoop();
        console.log("✅ Game Loop Started");
    }, 100);
});