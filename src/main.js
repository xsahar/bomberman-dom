import { createApp, h, store } from '../framework/index.js';
// WebSocket integration and multiplayer UI are handled in `src/multiplayer/`.
// Keep `main.js` focused on game initialization and rendering to avoid cross-team conflicts.
import { MapGenerator } from './map/mapGenerator.js';
import { renderMap } from './ui/mapRenderer.js';
import { Player } from './player/player.js'; 
import { BombPlacement } from './bombs/bombPlacement.js';
import { ExplosionSystem } from './bombs/explosion.js';
import { resetRound } from './game/gameFlow.js';

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
    
        // Multiplayer chat integration (Person 4):
        (async () => {
            try {
                const { default: WebSocketManager } = await import('./multiplayer/websocket.js');
                const { ChatManager } = await import('./multiplayer/chat.js');
                const { default: RemotePlayersManager } = await import('./multiplayer/remotePlayers.js');
                const { default: LobbyUI } = await import('./multiplayer/lobby.js');
                
                // Use nickname from prompt or fallback
                let nickname = localStorage.getItem('mp_nick') || '';
                if (!nickname) {
                    nickname = prompt('Enter your nickname for chat:', 'Player_' + Math.floor(Math.random()*9999)) || 'Player_' + Math.floor(Math.random()*9999);
                    localStorage.setItem('mp_nick', nickname);
                }
                const ws = new WebSocketManager({ host: location.hostname + ':8081' });
                
                let gameStarted = false;
                const lobby = new LobbyUI({ 
                    wsManager: ws, 
                    onGameStart: () => {
                        if (gameStarted) return;
                        gameStarted = true;
                        // Initialize player and game when game starts
                        setTimeout(() => initPlayer(), 100);
                    }
                });
                
                ws.connect(nickname);
                new ChatManager(ws);
                const rpm = new RemotePlayersManager({ wsManager: ws, mapContainer });
                
                // Send our generated map to server for sharing
                ws.on('joined', () => {
                    const state = store.getState();
                    if (state.map && state.map.data) {
                        ws.send({ type: 'mapSync', payload: { data: state.map.data, rows: state.map.rows, cols: state.map.cols } });
                    }
                });
                
                // Receive shared map from server (for 2nd+ players)
                ws.on('mapSync', (payload) => {
                    if (payload && payload.data) {
                        console.log('📍 Received shared map from server');
                        store.setState({ map: { data: payload.data, rows: payload.rows || 13, cols: payload.cols || 15 } });
                        // Re-render with the new map
                        app.render();
                    }
                });
                
                // Wire server events
                ws.on('playerJoined', (p) => p && rpm.addPlayer(p));
                ws.on('playerLeft', (p) => p && rpm.removePlayer(p.id));
                ws.on('action', (a) => rpm.handleAction(a));
                ws.on('stateSync', (s) => rpm.syncState(s));
                // Initial lobbyState may contain players
                ws.on('lobbyState', (s) => { if (s && s.players) s.players.forEach(p => rpm.addPlayer(p)); });
                window.mpWS = ws;
                window.mpRPM = rpm;
            } catch (err) { console.warn('Multiplayer chat/players failed to load', err); }
        })();

    // 3. Create Player & Bomb Systems (Wait 100ms to ensure DOM is painted)
    setTimeout(() => {
        console.log('🕹️ Spawning Player...');
        
        // We instantiate the player. Inside its constructor, 
        // it will attach itself to the .map div we just rendered.
        const player = new Player();

        // --- NEW: Initialize Bomb Logic ---
        const bombPlacer = new BombPlacement();
    const explosionSystem = new ExplosionSystem(bombPlacer);

    // Expose reset helper for manual testing (call from browser console)
    window.resetRound = () => resetRound({ playersInstances: [player], bombPlacer });

        // 4. Input Listener for Bombs (Spacebar)
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault(); // Stop page scrolling
                
                // Get mapData for bomb placement validation
                const state = store.getState();
                const mapData = state.map.data;
                
                // Get player's current grid position directly from player object
                // (Don't use store - causes rendering issues)
                // Pass the player instance so the bomb placer can consult
                // runtime properties (maxBombs, bombRange) which may have
                // changed from powerups.
                const newBomb = bombPlacer.placeBomb(player, mapData);

                // B. If successful, set the fuse!
                if (newBomb) {
                    newBomb.timerId = setTimeout(() => {
                        // C. Trigger Explosion after 3 seconds
                        const state = store.getState();
                        const mapData = state.map.data;
                        console.log(`💥 Explosion triggered for bomb ${newBomb.id}`);
                        const removed = bombPlacer.removeBomb(newBomb.id, newBomb.element); // Remove bomb from DOM
                        explosionSystem.triggerExplosion(removed || newBomb, mapData, player); // Pass bomb, map, and player
                    }, bombPlacer.BOMB_TIMER); 
                // Bomb placement handled locally and by bomb system; network sync belongs to multiplayer module.
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

    // No multiplayer wiring here to avoid altering game flow code — use the /src/multiplayer modules instead.
});