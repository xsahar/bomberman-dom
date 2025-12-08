// Person 1: Player Mechanics & Movement
// Player class and basic player functionality
// TODO: Implement Player class with properties and methods for player management

// Requirements:
// - Player constructor with id, nickname, position, color
// - Lives management (3 lives)
// - Movement properties (speed, position)
// - Power-up properties (bombs, flames, speed)
// - Methods: move(), takeDamage(), die(), respawn(), addPowerup(), render()

import { store } from '../../framework/index.js';

// CONFIG: UPDATED TO 40px TO MATCH CSS
const TILE_SIZE = 40;       
const PLAYER_SIZE = 32;     
const OFFSET = (TILE_SIZE - PLAYER_SIZE) / 2; // = 4px
const SPEED = 4;

export class Player {
    constructor() {
        console.log("🤖 Player Constructor Started...");

        // 1. POSITION: Start at Tile (1,1)
        this.x = TILE_SIZE + OFFSET; 
        this.y = TILE_SIZE + OFFSET;
        console.log(`📍 Initial Position calculated: x=${this.x}, y=${this.y}`);
        
        // 2. VISUALS: Create the HTML element
        this.element = document.createElement('div');
        this.element.className = 'player'; 
        
        // Safety Check: Find the map
        const mapContainer = document.querySelector('.map');
        if (!mapContainer) {
            console.error("❌ CRITICAL ERROR: .map container missing!");
            return;
        }
        mapContainer.appendChild(this.element);
        console.log("✅ Player element added to DOM");

        // 3. INPUT: Listen for keys
        this.keys = {};
        window.addEventListener('keydown', e => {
            this.keys[e.key] = true;
            // Prevent default scrolling for arrow keys and space
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
            // console.log(`Key Down: ${e.key}`); // Uncomment to test keys
        });
        window.addEventListener('keyup', e => {
            this.keys[e.key] = false;
            // Prevent default scrolling for arrow keys and space
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });

        // 4. SYNC & RENDER
        // We wrap this in try-catch to prevent crashes from stopping the render
       this.render(); 
       console.log("✅ Player Rendered Successfully");
       
       try {
            this.updateStore();    
        } catch (err) {
           console.warn("⚠️ Framework Error (ignoring for now):", err);
        }
    }

    update() {
        let dx = 0;
        let dy = 0;

        if (this.keys['ArrowUp']) dy = -SPEED;
        if (this.keys['ArrowDown']) dy = SPEED;
        if (this.keys['ArrowLeft']) dx = -SPEED;
        if (this.keys['ArrowRight']) dx = SPEED;

        if (dx !== 0 || dy !== 0) {
            this.move(dx, dy);
        }
    }

    move(dx, dy) {
        const nextX = this.x + dx;
        const nextY = this.y + dy;

        if (!this.checkCollision(nextX, nextY)) {
            this.x = nextX;
            this.y = nextY;
            this.render();
            // this.updateStore();
        }
    }

    checkCollision(newX, newY) {
        const state = store.getState();
        const mapData = state.map?.data;
        
        if (!mapData) return true; // Stop if map isn't loaded

        const points = [
            { x: newX, y: newY },
            { x: newX + PLAYER_SIZE, y: newY },
            { x: newX, y: newY + PLAYER_SIZE },
            { x: newX + PLAYER_SIZE, y: newY + PLAYER_SIZE }
        ];

        for (const p of points) {
            const col = Math.floor(p.x / TILE_SIZE);
            const row = Math.floor(p.y / TILE_SIZE);

            if (row < 0 || col < 0 || row >= 13 || col >= 15) return true;

            const tile = mapData[row][col];
            if (tile && (tile.type === 'wall' || tile.type === 'block')) {
                return true; 
            }
        }
        return false; 
    }

    render() {
        // Force the move using Transform
        this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
    }

    updateStore() {
        const gridX = Math.floor((this.x + PLAYER_SIZE/2) / TILE_SIZE);
        const gridY = Math.floor((this.y + PLAYER_SIZE/2) / TILE_SIZE);

        store.setState({
            activePlayer: {
                id: 'local',
                x: gridX,
                y: gridY,
                range: 1,
                maxAmmo: 1
            }
        });
    }
}