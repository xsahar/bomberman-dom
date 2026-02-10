// Import the global state manager from the framework
import { store } from '../../framework/index.js';
import { getPowerupManager } from '../utils/helpers.js';

// --- Player visual and movement configuration ---
const TILE_SIZE = 40;       // Size of each map tile in pixels
const PLAYER_SIZE = 32;     // Size of the player sprite in pixels
const OFFSET = (TILE_SIZE - PLAYER_SIZE) / 2; // Center player in tile
const SPEED = 4;            // Movement speed (pixels per frame)

export class Player {
    constructor(playerOptions = {}) {
        console.log("🤖 Player Constructor Started...");

        // --- 1. Initialize Player Data ---
        this.id = playerOptions.id || 'p1';         
        this.lives = 3;         
        this.maxBombs = 1;      
        this.bombRange = 1;     
        this.speed = SPEED; 
        this.dead = false;      

        // Spawn position - use provided coordinates or default to top-left
        this.spawnRow = playerOptions.spawnRow || 1;
        this.spawnCol = playerOptions.spawnCol || 1;
        this.row = this.spawnRow;
        this.col = this.spawnCol;
        this.x = (this.col * TILE_SIZE) + OFFSET;
        this.y = (this.row * TILE_SIZE) + OFFSET;

        console.log(`📍 Player ${this.id} spawn position: row=${this.spawnRow}, col=${this.spawnCol}`);
        console.log(`📍 Initial Position calculated: x=${this.x}, y=${this.y}`);

        // --- 2. Create player DOM element ---
        this.element = document.createElement('div');
        this.element.className = 'player';
        // Add a label above the local player showing their nickname
        const nick = (typeof localStorage !== 'undefined' && localStorage.getItem('mp_nick')) ? localStorage.getItem('mp_nick') : this.id;
        const nameLabel = document.createElement('div');
        nameLabel.className = 'player-name';
        nameLabel.textContent = nick;
        this.element.appendChild(nameLabel);
        const mapContainer = document.querySelector('.map');
        if (!mapContainer) {
            console.error("❌ CRITICAL ERROR: .map container missing!");
            return;
        }
        mapContainer.appendChild(this.element);
        console.log("✅ Player element added to DOM");

        // Lives UI is provided by `LivesUI` (created by main), not here.

        // --- 4. Keyboard input handling ---
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

        // --- 5. Animation state ---
        this.direction = 0;    
        this.isMoving = false; 

        // --- 6. Initial render ---
        this.render(); 
        console.log("✅ Player Rendered Successfully");
    }

    // --- Movement Update ---
    update() {
        if (this.dead) return;

        let dx = 0, dy = 0;
        if (this.keys['ArrowUp']) { dy = -this.speed; this.direction = 3; }
        if (this.keys['ArrowDown']) { dy = this.speed; this.direction = 0; }
        if (this.keys['ArrowLeft']) { dx = -this.speed; this.direction = 1; }
        if (this.keys['ArrowRight']) { dx = this.speed; this.direction = 2; }

        if (dx !== 0 || dy !== 0) this.move(dx, dy);
    }

    move(dx, dy) {
        const nextX = this.x + dx;
        const nextY = this.y + dy;
        
        // Try full movement first
        if (!this.checkCollision(nextX, nextY)) {
            this.x = nextX;
            this.y = nextY;
        } else {
            // If diagonal movement fails, try sliding along one axis
            // Try horizontal movement only
            if (dx !== 0 && !this.checkCollision(nextX, this.y)) {
                this.x = nextX;
            }
            // Try vertical movement only
            if (dy !== 0 && !this.checkCollision(this.x, nextY)) {
                this.y = nextY;
            }
        }

        // Update grid position
        const centerX = this.x + PLAYER_SIZE / 2;
        const centerY = this.y + PLAYER_SIZE / 2;
        this.col = Math.floor(centerX / TILE_SIZE);
        this.row = Math.floor(centerY / TILE_SIZE);

        this.render();

        // Multiplayer sync
        if (window.mpWS?.ws?.readyState === 1) {
            window.mpWS.send({
                type: 'action',
                payload: {
                    type: 'move',
                    row: this.row,
                    col: this.col,
                    x: this.x,
                    y: this.y,
                    direction: this.direction
                }
            });
        }

        // Check for powerups
        try {
            const state = store.getState();
            const powerups = state.powerups || [];
            const found = powerups.find(p => p.row === this.row && p.col === this.col);
            if (found) {
                const pm = getPowerupManager();
                pm.collectPowerup(this.id, found.id, this);
                console.log(`🔋 Powerup collected: ${found.type} at [${this.row},${this.col}]`);
                
                // Broadcast powerup collection to other players (use row/col as identifier)
                if (window.mpWS?.ws?.readyState === 1) {
                    window.mpWS.send({
                        type: 'action',
                        payload: {
                            type: 'powerupCollected',
                            row: this.row,
                            col: this.col,
                            powerupType: found.type
                        }
                    });
                    console.log(`📡 Broadcast powerup collected at [${this.row}, ${this.col}]`);
                }
            }
        } catch (err) {
            console.error('Error checking/collecting powerup:', err);
        }
    }

    // --- Collision Detection ---
    checkCollision(newX, newY) {
        const mapData = store.getState().map?.data;
        if (!mapData) return true;

        const points = [
            {x:newX, y:newY}, {x:newX+PLAYER_SIZE, y:newY},
            {x:newX, y:newY+PLAYER_SIZE}, {x:newX+PLAYER_SIZE, y:newY+PLAYER_SIZE}
        ];

        for (const p of points) {
            const col = Math.floor(p.x / TILE_SIZE);
            const row = Math.floor(p.y / TILE_SIZE);
            if (row < 0 || col < 0 || row >= 13 || col >= 15) return true;
            const tile = mapData[row][col];
            if (tile && (tile.type==='wall'||tile.type==='block')) return true;
        }
        return false;
    }

    // --- Render Player ---
    render() {
        const directionMap = {
            0: {x:0,y:0}, 1:{x:100,y:0}, 2:{x:100,y:100}, 3:{x:0,y:100}
        };
        const pos = directionMap[this.direction] || directionMap[0];
        this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
        this.element.style.backgroundPosition = `${pos.x}% ${pos.y}%`;
    }

    // --- Lives UI ---
    createLivesUI() {
        // legacy: removed in favor of centralized `LivesUI` component
        return;
    }

    updateLivesUI() {
        // keep API but delegate to LivesUI when available
        if (this.livesUI && typeof this.livesUI.renderHearts === 'function') {
            this.livesUI.currentLives = this.lives;
            this.livesUI.renderHearts();
        }
    }

    // --- Apply Damage ---
    applyDamage(amount=1) {
        if (this.dead) return;
        this.lives = Math.max(0, this.lives - amount);
        this.flashHit();
        this.updateLivesUI();
        this.resetPowerups();

        if (this.lives <= 0) {
            this.die();
            this.showEndGameMessage('💀 You Lost!');
            // Notify server/other clients that this player died so others can react
            try {
                if (window.mpWS?.ws?.readyState === 1) {
                    window.mpWS.send({
                        type: 'action',
                        payload: { type: 'died' }
                    });
                }
            } catch (err) {
                console.warn('Failed to send died action', err);
            }
        } else {
            this.respawnAtSpawn();
        }
    }

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

    die() {
        this.dead = true;
        this.keys = {};
        if (this.element) {
            this.element.classList.add('player-dead');
            this.element.style.opacity='0.35';
            this.element.remove();
        }
    }

    respawnAtSpawn() {
        this.row = this.spawnRow;
        this.col = this.spawnCol;
        this.x = (this.col * TILE_SIZE) + OFFSET;
        this.y = (this.row * TILE_SIZE) + OFFSET;
        if (this.element && !document.body.contains(this.element)) {
            const mapContainer = document.querySelector('.map');
            if (mapContainer) mapContainer.appendChild(this.element);
        }
        this.render();
        
        // Broadcast respawn position to other players
        if (window.mpWS?.ws?.readyState === 1) {
            window.mpWS.send({
                type: 'action',
                payload: {
                    type: 'move',
                    row: this.row,
                    col: this.col,
                    x: this.x,
                    y: this.y,
                    direction: this.direction
                }
            });
            console.log(`📡 Broadcast respawn position: row=${this.row}, col=${this.col}`);
        }
        this.render();
    }

    resetPowerups() {
        this.maxBombs = 1;
        this.bombRange = 1;
        this.speed = SPEED;
        if (this._powerupTimers) {
            (this._powerupTimers.bombs || []).forEach(t => clearTimeout(t));
            (this._powerupTimers.flames || []).forEach(t => clearTimeout(t));
            (this._powerupTimers.speed || []).forEach(t => clearTimeout(t));
            this._powerupTimers = { bombs: [], flames: [], speed: [] };
        }
        try {
            const pm = getPowerupManager();
            pm.clearActiveForPlayer(this.id);
        } catch (err) {
            // ignore if powerup manager not available
        }
    }

    // Check if player is in explosion range
    isInExplosion(explosion) {
        if (!explosion) return false;
        
        // Check if player's current position matches explosion position
        return this.row === explosion.row && this.col === explosion.col;
    }

    // --- End Game Overlay ---
    showEndGameMessage(msg) {
        let overlay = document.querySelector('.endgame-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'endgame-overlay';
            
            // Determine if it's a win or loss based on the message
            const isWin = msg.includes('Won');
            const emoji = isWin ? '🎉' : '💀';
            const title = isWin ? 'Victory!' : 'Defeat!';
            
            overlay.innerHTML = `
                <div class="endgame-modal">
                    <div class="endgame-header">
                        <h1>${title}</h1>
                    </div>
                    
                    <div class="endgame-content">
                        <div class="endgame-emoji">${emoji}</div>
                        <p class="endgame-message">${msg}</p>
                    </div>
                    
                    <div class="endgame-footer">
                        <button class="endgame-btn primary" id="restart-btn">Play Again</button>
                        <button class="endgame-btn secondary" id="exit-btn">Exit to Lobby</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            
            // Add event listeners
            const restartBtn = overlay.querySelector('#restart-btn');
            const exitBtn = overlay.querySelector('#exit-btn');
            
            restartBtn.addEventListener('click', () => {
                location.reload();
            });
            
            exitBtn.addEventListener('click', () => {
                location.reload();
            });
        } else {
            overlay.querySelector('p').textContent = msg;
        }
        overlay.classList.add('active');
        try {
            if (window.mpWS && typeof window.mpWS.send === 'function') {
                window.mpWS.send({ type: 'presence', payload: { inLobby: false } });
            }
        } catch (e) { /* ignore */ }
        try { if (window.stopGame) window.stopGame('ended'); } catch (e) { /* ignore */ }
    }

    // --- Win Check (call after moves/bombs) ---
    checkWinCondition() {
        const state = store.getState();
        const alivePlayers = (state.players||[]).filter(p => !p.dead);
        if (alivePlayers.length === 1 && alivePlayers[0].id === this.id) {
            this.showEndGameMessage('🎉 You Won!');
            return true;
        }
        return false;
    }
}
