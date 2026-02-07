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
let gameLoopId;
let gameRunning = false;

function stopGame(reason = 'ended') {
    if (!gameRunning) return;
    gameRunning = false;
    try { if (gameLoopId) cancelAnimationFrame(gameLoopId); } catch (e) { /* ignore */ }
    clearInterval(timerInterval);
    store.setState({ gameState: reason });
    if (player) {
        player.keys = {};
    }
}

// Expose to other modules (player, remote events)
window.stopGame = stopGame;

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

// Countdown timer — accepts optional server `startedAt` timestamp to sync
function startTimer(startedAt = null, durationSeconds = 120) {
    clearInterval(timerInterval);

    function tick() {
        let remaining = durationSeconds;
        if (startedAt) {
            const elapsed = Math.floor((Date.now() - startedAt) / 1000);
            remaining = Math.max(0, durationSeconds - elapsed);
        } else {
            const state = store.getState();
            remaining = Math.max(0, (typeof state.gameTime === 'number' ? state.gameTime : durationSeconds));
            // decrement for local-only timer
            remaining = Math.max(0, remaining - 1);
            store.setState({ gameTime: remaining });
        }

        const el = document.getElementById('game-timer');
        if (el) el.textContent = formatTime(remaining);

        if (remaining <= 0) {
            clearInterval(timerInterval);
            showTimeUpOverlay();
        }
    }

    // initial tick and interval
    tick();
    timerInterval = setInterval(tick, 1000);
}

// Show a full-screen overlay when time is up
function showTimeUpOverlay() {
    stopGame('timeup');
        let overlay = document.querySelector('.timeup-overlay');
        if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'timeup-overlay';
                overlay.innerHTML = `
                    <div class="timeup-card">
                        <div class="timeup-emoji">⏱️</div>
                        <div class="timeup-title">Time is up!</div>
                        <div class="timeup-sub">The round has ended.</div>
                        <div class="timeup-actions"><button id="timeup-restart">Restart</button></div>
                    </div>`;
                document.body.appendChild(overlay);
                const btn = overlay.querySelector('#timeup-restart');
                if (btn) btn.addEventListener('click', () => location.reload());
        }
        overlay.classList.add('active');
}

// Handle player hit and lose lives
function onPlayerHit() {
    if (!player || !player.livesUI) return;

    const dead = player.livesUI.loseLife();
    store.setState({ playerLives: player.livesUI.currentLives });

    if (dead) {
        alert('💀 You Lost!');
        player.element.style.opacity = 0.5;
        stopGame('lost');
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

    // Broadcast initial position to other players
    if (window.mpWS?.ws?.readyState === 1) {
        window.mpWS.send({
            type: 'action',
            payload: {
                type: 'move',
                row: player.row,
                col: player.col,
                x: player.x,
                y: player.y,
                direction: player.direction
            }
        });
        console.log(`📡 Broadcast initial position: row=${player.row}, col=${player.col}, x=${player.x}, y=${player.y}`);
    }

  

    bombPlacer = new BombPlacement();
    explosionSystem = new ExplosionSystem(bombPlacer);

    // Start game loop
    function gameLoop() {
        if (!gameRunning) return;
        player.update();

        // Check for explosions hitting the player
        const explosions = store.getState().explosions || [];
        explosions.forEach(explosion => {
            if (player.isInExplosion(explosion)) {
                onPlayerHit();
            }
        });

        gameLoopId = requestAnimationFrame(gameLoop);
    }
    gameRunning = true;
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

            // Show the custom nickname modal instead of using prompt()
            let nickname = localStorage.getItem('mp_nick') || '';
            if (!nickname) {
                nickname = await showNicknameModal();
                if (!nickname) nickname = 'Player_' + Math.floor(Math.random()*9999);
                localStorage.setItem('mp_nick', nickname);
            }

            const ws = new WebSocketManager({ host: location.hostname + ':8081' });
            let gameStarted = false;
            let playerIndex = 0; // Track which player this is for spawn positioning

            const lobby = new LobbyUI({
                wsManager: ws,
                onGameStart: (state) => {
                    if (gameStarted) return;
                    gameStarted = true;
                    gameRunning = true;
                    // Determine this client's playerIndex from the lobby state (server authoritative)
                    try {
                        const players = (state && state.players) ? state.players : [];
                        const localId = ws.id;
                        let assignedIndex = players.findIndex(p => p.id === localId);
                        if (assignedIndex === -1) {
                            // fallback: try to match nickname
                            const nick = localStorage.getItem('mp_nick') || '';
                            assignedIndex = players.findIndex(p => p.nickname === nick);
                        }
                        if (assignedIndex >= 0) {
                            ws.playerIndex = players[assignedIndex].playerIndex !== undefined ? players[assignedIndex].playerIndex : assignedIndex;
                        }
                    } catch (err) { /* ignore */ }

                    // Now spawn the player at the correct corner
                    initPlayer();

                    const startedAt = state && state.gameState && state.gameState.startedAt ? state.gameState.startedAt : null;
                    const duration = store.getState().gameTime || 120;
                    startTimer(startedAt, duration);
                }
            });

            ws.connect(nickname);
            
            // Create lobby chat
            if (lobby.chatContainer) {
                new ChatManager(ws, lobby.chatContainer);
            }
            
            // Create in-game chat (collapsed by default)
            new ChatManager(ws, document.getElementById('app'), { collapsed: false });
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
                            // If this entry corresponds to the local client, store the playerIndex on the ws
                            try {
                                if (ws && ((p.id && ws.id && p.id === ws.id) || (p.nickname && p.nickname === nickname))) {
                                    ws.playerIndex = playerIndex;
                                    playerIndex = playerIndex; // keep for positioning
                                }
                            } catch (err) { /* ignore */ }
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

    // --- Nickname modal helper -------------------------------------------------
    function showNicknameModal() {
        return new Promise((resolve) => {
            const existing = document.querySelector('.title-overlay');
            if (existing) { existing.remove(); }

            const overlay = document.createElement('div');
            overlay.className = 'title-overlay show';

            const card = document.createElement('div');
            card.className = 'title-card';

            const logo = document.createElement('div');
            logo.className = 'title-logo';
            logo.textContent = 'BOMBERMAN';

            const sub = document.createElement('div');
            sub.className = 'title-sub';
            sub.textContent = 'ENTER YOUR NICKNAME';

            const controls = document.createElement('div');
            controls.className = 'title-controls';

            const input = document.createElement('input');
            input.className = 'nickname-input';
            input.placeholder = 'Player_1234';
            input.value = '';

            const btn = document.createElement('button');
            btn.className = 'title-button';
            btn.textContent = 'START';

            controls.appendChild(input);
            controls.appendChild(btn);

            card.appendChild(logo);
            card.appendChild(sub);
            card.appendChild(controls);
            overlay.appendChild(card);
            document.body.appendChild(overlay);

            input.focus();

            function close(v) {
                overlay.classList.remove('show');
                overlay.remove();
                resolve((typeof v === 'string') ? v.trim() : v);
            }

            btn.addEventListener('click', () => {
                const val = input.value.trim();
                if (val.length === 0) return; // ignore empty
                close(val);
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const val = input.value.trim();
                    if (val.length === 0) return;
                    close(val);
                }
            });

            // Allow clicking overlay to focus input
            overlay.addEventListener('click', (e) => { if (e.target === overlay) input.focus(); });
        });
    }

    // (no global exposure of modal helper)

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
