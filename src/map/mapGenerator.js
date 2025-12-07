// Person 2: Map Generation & Power-ups
// Requirements: 15x13 grid, Fixed Walls, Random Blocks, Safe Spawns.

import { store } from '../../framework/index.js';

export class MapGenerator {
    // Default to 13 Rows x 15 Cols (Standard Bomberman Size)
    constructor(rows = 13, cols = 15) {
        this.rows = rows;
        this.cols = cols;
        this.map = [];
    }

    generateMap() {
        this.createEmptyMap(); 
        this.placeWalls();
        
        // Clear spawn areas BEFORE placing blocks to mark them safe
        this.clearSpawnAreas(); 
        
        this.placeBlocks();

        // ---------------------------------------------------------
        // FRAMEWORK INTEGRATION: Save to Global Store
        // ---------------------------------------------------------
        // This makes the map visible to the Renderer and Bomb Logic
        store.setState({
            map: {
                data: this.map,        
                rows: this.rows,
                cols: this.cols
            }
        });
        console.log("✅ Map generated and saved to Global Store!");

        return this.map;
    }

    getMapData() {
        return this.map;
    }

    createEmptyMap() {
        this.map = [];
        for (let row = 0; row < this.rows; row++) {
            const rowArr = [];
            for (let col = 0; col < this.cols; col++) {
                // Initialize every cell as an object
                rowArr.push({ type: 'empty' }); 
            }
            this.map.push(rowArr);
        }
    }

    placeWalls() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                
                // 1. BORDER WALLS (Edges)
                // Players cannot walk off the map
                const isBorder = row === 0 || col === 0 || row === this.rows - 1 || col === this.cols - 1;

                // 2. INNER WALLS (Pillars)
                // Standard Bomberman Pattern: Even x Even coordinates
                const isInnerWall = (row % 2 === 0 && col % 2 === 0);

                if (isBorder || isInnerWall) {
                    this.map[row][col].type = 'wall';
                }
            }
        }
    }

    isInSpawnArea(row, col) {
        const lastRow = this.rows - 1;
        const lastCol = this.cols - 1;

        // Define 3x3 Safe Zones at each corner
        // We check "<= 2" because indices 0, 1, 2 are the first 3 tiles
        const inTopLeft = row <= 2 && col <= 2;
        const inTopRight = row <= 2 && col >= lastCol - 2;
        const inBottomLeft = row >= lastRow - 2 && col <= 2;
        const inBottomRight = row >= lastRow - 2 && col >= lastCol - 2;

        return inTopLeft || inTopRight || inBottomLeft || inBottomRight;
    }

    placeBlocks() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.map[row][col];

                // Safety Checks
                if (cell.type === 'wall') continue; // Don't overwrite walls
                if (this.isInSpawnArea(row, col)) continue; // Double check spawn areas

                // Random Chance (e.g., 60% chance for a soft block)
                if (Math.random() < 0.6) { 
                    cell.type = 'block';
                }
            }
        }
    }

    clearSpawnAreas() {
        // Force reset the corners to 'empty' just in case logic slipped
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                // CRITICAL: Do NOT clear the Hard Walls (borders), only potential block spots
                if (this.map[row][col].type === 'wall') continue;

                if (this.isInSpawnArea(row, col)) {
                    this.map[row][col].type = 'empty';
                }
            }
        }
    }

    getSpawnPositions() {
        // Return SAFE coordinates for players to start.
        // We use (1,1) instead of (0,0) because (0,0) is a Wall Border.
        return [
            { row: 1, col: 1 },                         // Top-left (Player 1)
            { row: 1, col: this.cols - 2 },             // Top-right (Player 2)
            { row: this.rows - 2, col: 1 },             // Bottom-left (Player 3)
            { row: this.rows - 2, col: this.cols - 2 }  // Bottom-right (Player 4)
        ];
    }
}