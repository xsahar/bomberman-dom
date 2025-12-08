import { createApp, h, store } from '../framework/index.js';
import { MapGenerator } from './map/mapGenerator.js';
import { renderMap } from './ui/mapRenderer.js';
import { Player } from './player/player.js'; 

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
    
    // 3. Create Player (Wait 100ms to ensure DOM is painted)
    setTimeout(() => {
        console.log('🕹️ Spawning Player...');
        
        // We instantiate the player. Inside its constructor, 
        // it will attach itself to the .map div we just rendered.
        const player = new Player();

        // 4. Start Game Loop (Movement & Physics)
        function gameLoop() {
            player.update();
            requestAnimationFrame(gameLoop);
        }
        
        gameLoop();
        console.log("✅ Game Loop Started");
    }, 100);
});