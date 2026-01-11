import { createApp, h, store } from '../framework/index.js';
// WebSocket integration and multiplayer UI are handled in `src/multiplayer/`.
import { MapGenerator } from './map/mapGenerator.js';
import { renderMap } from './ui/mapRenderer.js';
import { Player } from './player/player.js'; 
import { BombPlacement } from './bombs/bombPlacement.js';
import { ExplosionSystem } from './bombs/explosion.js';
import { resetRound } from './game/gameFlow.js';
import { LivesUI } from './player/lives.js';

let player; // Global reference for player
let bombPlacer;
let explosionSystem;
let timerInterval;

// Initialize map and global game state
function initializeGame() {
    console.log('🎮 Initializing Data...');
    
    const generator = new MapGenerator();
    const mapData = generator.generateMap();

    store.setState({ 
        map: { data: mapData, rows: 13, cols: 15 },
        powerups: [],
        bombs: [],
        explosions: [],
        gameState: 'lobby',
        playerLives: 3,
        gameTime: 120
    });
    
    return mapData;
}

// Root component for the framework
function RootComponent() {
    const state = store.getState();
    const mapData = state.map?.data || [];
    
    return h.div({ className: 'game-root' }, [
        h.h1({}, 'Bomberman Game'),
        h.div({ className: 'timer', id: 'game-timer' }, formatTime(state.gameTime || 120)),
        mapData.length > 0 ? renderMap(mapData) : h.div({}, 'Loading map...')
    ]);
}

// Timer formatting
function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// Countdown timer
function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const state = store.getState();
        if (state.gameTime <= 0) {
            clearInterval(timerInterval);
            alert('⏱️ Time is up!');
            return;
        }
        store.setState({ gameTime: state.gameTime - 1 });
        document.getElementById('game-timer').textContent = formatTime(store.getState().gameTime);
    }, 1000);
}

// Handle player hit and lose lives
function onPlayerHit() {
    if (!player || !player.livesUI) return;

    const dead = player.livesUI.loseLife();
    store.setState({ playerLives: player.livesUI.currentLives });

    if (dead) {
        alert('💀 You Lost!');
        player.element.style.opacity = 0.5;
    }
}

// Initialize player, bombs, explosions, and lives
function initPlayer() {
    console.log('🕹️ Spawning Player...');
    
    // Get spawn positions from map generator
    const generator = new MapGenerator();
    const spawnPositions = generator.getSpawnPositions();
    
    // Use playerIndex if available from multiplayer, otherwise default to 0
    const currentPlayerIndex = (window.mpWS && window.mpWS.playerIndex !== undefined) ? window.mpWS.playerIndex : 0;
    const spawn = spawnPositions[currentPlayerIndex] || spawnPositions[0];
    
    console.log(`🎯 Using player index ${currentPlayerIndex} for spawn position: row=${spawn.row}, col=${spawn.col}`);
    console.log(`🗺️ Available spawn positions:`, spawnPositions);
    
    player = new Player({
        id: 'local_player',
        spawnRow: spawn.row,
        spawnCol: spawn.col
    });

    // Expose player globally so remote handlers can access and apply damage
    window.player = player;

    // Attach a LivesUI for the main player so onPlayerHit and other parts work
    try {
        player.livesUI = new LivesUI({ parentElement: document.body, maxLives: player.lives });
        store.setState({ playerLives: player.lives });
    } catch (err) {
        console.warn('Failed to create LivesUI for player', err);
    }

  

    bombPlacer = new BombPlacement();
    explosionSystem = new ExplosionSystem(bombPlacer);

    // Start game loop
    function gameLoop() {
        player.update();

        // Check for explosions hitting the player
        const explosions = store.getState().explosions || [];
        explosions.forEach(explosion => {
            if (player.isInExplosion(explosion)) {
                onPlayerHit();
            }
        });

        requestAnimationFrame(gameLoop);
    }
    gameLoop();
}

window.addEventListener('load', () => {
    console.log('✅ Page loaded');
    const container = document.getElementById('app');
    if (!container) {
        console.error("❌ Error: Container #app not found!");
        return;
    }

    initializeGame();

    const app = createApp(RootComponent, container);
    app.connectToStore(store);
    app.render();
    
    // Expose app globally for re-rendering after remote map updates
    window.app = app;

    const mapContainer = document.querySelector('.map'); 

    // Multiplayer integration
    (async () => {
        try {
            const { default: WebSocketManager } = await import('./multiplayer/websocket.js');
            const { ChatManager } = await import('./multiplayer/chat.js');
            const { default: RemotePlayersManager } = await import('./multiplayer/remotePlayers.js');
            const { default: LobbyUI } = await import('./multiplayer/lobby.js');
            
            let nickname = localStorage.getItem('mp_nick') || '';
            if (!nickname) {
                nickname = prompt('Enter your nickname:', 'Player_' + Math.floor(Math.random()*9999));
                localStorage.setItem('mp_nick', nickname);
            }

            const ws = new WebSocketManager({ host: location.hostname + ':8081' });
            let gameStarted = false;
            let playerIndex = 0; // Track which player this is for spawn positioning

            const lobby = new LobbyUI({
                wsManager: ws,
                onGameStart: () => {
                    if (gameStarted) return;
                    gameStarted = true;
                    // Store playerIndex on ws object for access in initPlayer
                    ws.playerIndex = playerIndex;
                    initPlayer();
                    startTimer();
                }
            });

            ws.connect(nickname);
            new ChatManager(ws);
            const rpm = new RemotePlayersManager({ wsManager: ws, mapContainer });

            ws.on('joined', (data) => {
                // Get player index from server response to determine spawn position
                if (data && typeof data.playerIndex !== 'undefined') {
                    playerIndex = data.playerIndex;
                    ws.playerIndex = playerIndex;
                }
                const state = store.getState();
                if (state.map && state.map.data) {
                    ws.send({ type: 'mapSync', payload: { data: state.map.data, rows: state.map.rows, cols: state.map.cols } });
                }
            });

            ws.on('mapSync', payload => {
                if (payload && payload.data) {
                    store.setState({ map: { data: payload.data, rows: payload.rows, cols: payload.cols } });
                    app.render();
                }
            });

            ws.on('playerJoined', p => {
                if (p) {
                    rpm.addPlayer(p);
                    // Assign spawn position to newly joined player using their playerIndex
                    if (p.playerIndex !== undefined) {
                        const generator = new MapGenerator();
                        const spawnPositions = generator.getSpawnPositions();
                        const spawn = spawnPositions[p.playerIndex] || spawnPositions[0];
                        const spawnX = spawn.col * 40 + 4; // TILE_SIZE * col + OFFSET
                        const spawnY = spawn.row * 40 + 4; // TILE_SIZE * row + OFFSET
                        console.log(`🎯 New player ${p.id} joined at index ${p.playerIndex}: row=${spawn.row}, col=${spawn.col}, x=${spawnX}, y=${spawnY}`);
                        rpm.updatePlayerPosition(p.id, spawn.row, spawn.col, spawnX, spawnY);
                    }
                }
            });
            ws.on('playerLeft', p => p && rpm.removePlayer(p.id));
            ws.on('action', a => rpm.handleAction(a));
            ws.on('stateSync', s => rpm.syncState(s));
            ws.on('lobbyState', s => {
                if (s && s.players) {
                    const generator = new MapGenerator();
                    const spawnPositions = generator.getSpawnPositions();
                    s.players.forEach((p, index) => {
                        // Only add player if not already added
                        if (!rpm.players.has(p.id)) {
                            rpm.addPlayer(p);
                            // Position new players at their spawn points
                            const playerIndex = p.playerIndex !== undefined ? p.playerIndex : index;
                            const spawn = spawnPositions[playerIndex] || spawnPositions[0];
                            const spawnX = spawn.col * 40 + 4; // TILE_SIZE * col + OFFSET
                            const spawnY = spawn.row * 40 + 4; // TILE_SIZE * row + OFFSET
                            console.log(`🎯 Positioning new player ${p.id} at index ${playerIndex}: row=${spawn.row}, col=${spawn.col}, x=${spawnX}, y=${spawnY}`);
                            rpm.updatePlayerPosition(p.id, spawn.row, spawn.col, spawnX, spawnY);
                        }
                    });
                }
            });
            window.mpWS = ws;
            window.mpRPM = rpm;
        } catch (err) {
            console.warn('Multiplayer failed to load', err);
        }
    })();

    // Keyboard input for bombs
    window.addEventListener('keydown', (e) => {
        if (!player) return;
        if (e.code === 'Space' || e.key === ' ') {
            e.preventDefault();
            const mapData = store.getState().map.data;
            const newBomb = bombPlacer.placeBomb(player, mapData);
            if (newBomb) {
                // Sync bomb placement with other players
                if (window.mpWS?.ws?.readyState === 1) {
                    window.mpWS.send({
                        type: 'action',
                        payload: {
                            playerId: window.mpWS.id,
                            type: 'placeBomb',
                            row: newBomb.row,
                            col: newBomb.col,
                            timestamp: Date.now()
                        }
                    });
                }
                
                newBomb.timerId = setTimeout(() => {
                    const removed = bombPlacer.removeBomb(newBomb.id, newBomb.element);
                    const bomb = removed || newBomb;

                    // Calculate affected tiles so we can notify other clients
                    const affectedTiles = explosionSystem.calculateExplosionRange(bomb, mapData);

                    // Local explosion processing
                    explosionSystem.triggerExplosion(bomb, mapData, player);

                    // Sync explosion with other players (include affected tiles)
                    if (window.mpWS?.ws?.readyState === 1) {
                        window.mpWS.send({
                            type: 'action',
                            payload: {
                                playerId: window.mpWS.id,
                                type: 'explode',
                                row: bomb.row,
                                col: bomb.col,
                                range: player.bombRange,
                                affectedTiles: affectedTiles,
                                timestamp: Date.now()
                            }
                        });
                    }

                    // If local player stands on any affected tile, register hit
                    if (Array.isArray(affectedTiles) && affectedTiles.some(t => player.row === t.row && player.col === t.col)) {
                        onPlayerHit();
                    }
                }, bombPlacer.BOMB_TIMER);
            }
        }
    });

    // Expose reset helper
    window.resetRound = () => resetRound({ playersInstances: [player], bombPlacer });
});
