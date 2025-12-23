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
    player = new Player();

  

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

            const lobby = new LobbyUI({
                wsManager: ws,
                onGameStart: () => {
                    if (gameStarted) return;
                    gameStarted = true;
                    initPlayer();
                    startTimer();
                }
            });

            ws.connect(nickname);
            new ChatManager(ws);
            const rpm = new RemotePlayersManager({ wsManager: ws, mapContainer });

            ws.on('joined', () => {
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

            ws.on('playerJoined', p => p && rpm.addPlayer(p));
            ws.on('playerLeft', p => p && rpm.removePlayer(p.id));
            ws.on('action', a => rpm.handleAction(a));
            ws.on('stateSync', s => rpm.syncState(s));
            ws.on('lobbyState', s => s && s.players.forEach(p => rpm.addPlayer(p)));
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
                newBomb.timerId = setTimeout(() => {
                    const removed = bombPlacer.removeBomb(newBomb.id, newBomb.element);
                    explosionSystem.triggerExplosion(removed || newBomb, mapData, player);
                    if (player.isInExplosion(removed || newBomb)) {
                        onPlayerHit();
                    }
                }, bombPlacer.BOMB_TIMER);
            }
        }
    });

    // Expose reset helper
    window.resetRound = () => resetRound({ playersInstances: [player], bombPlacer });
});
