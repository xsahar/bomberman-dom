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
        // (This is now a fail-safe, as placeWalls handles the hard walls)
        this.clearSpawnAreas(); 
        
        this.placeBlocks();

        // ---------------------------------------------------------
        // FRAMEWORK INTEGRATION: Save to Global Store
        // ---------------------------------------------------------
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
    this.map = [];  // Start with empty array
    
    // Outer Loop: Go through each ROW (0 to 12)
    for (let row = 0; row < this.rows; row++) {
        const rowArr = [];  // Create a new row
        
        // Inner Loop: Go through each COLUMN in this row (0 to 14)
        for (let col = 0; col < this.cols; col++) {
            rowArr.push({ type: 'empty' });  // Add empty cell
        }
        
        this.map.push(rowArr);  // Add completed row to map
    }
}

    placeWalls() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                
                // 1. BORDER WALLS (Edges) - KEEP THESE
                // Players cannot walk off the map. This check MUST be first.
                const isBorder = row === 0 || col === 0 || row === this.rows - 1 || col === this.cols - 1;

                if (isBorder) {
                    this.map[row][col].type = 'wall';
                    continue; // Done with this tile, move to next
                }

                // --------------------- UPDATED SECTION ---------------------
                // 2. SAFE ZONE CHECK 
                // If we are in the 3x3 corner, we force it EMPTY.
                // We do this BEFORE placing "Inner Walls" to prevent the [2][2] wall.
                if (this.isInSpawnArea(row, col)) {
                    this.map[row][col].type = 'empty';
                    continue; // Skip the rest, ensuring no wall is placed here
                }
                // -----------------------------------------------------------

                // 3. INNER WALLS (Pillars)
                // Standard Bomberman Pattern: Even x Even coordinates
                const isInnerWall = (row % 2 === 0 && col % 2 === 0);

                if (isInnerWall) {
                    this.map[row][col].type = 'wall';
                }
            }
        }
    }

    isInSpawnArea(row, col) {
        const lastRow = this.rows - 1;
        const lastCol = this.cols - 1;

        const safeDist = 3; 

        const inTopLeft = row <= safeDist && col <= safeDist;
        const inTopRight = row <= safeDist && col >= lastCol - safeDist;
        const inBottomLeft = row >= lastRow - safeDist && col <= safeDist;
        const inBottomRight = row >= lastRow - safeDist && col >= lastCol - safeDist;

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
                
                // CRITICAL: Do NOT clear the Hard Walls (borders)
                // Note: We no longer skip Inner Walls here because placeWalls() 
                // already excluded them from the Safe Zone.
                if (row === 0 || col === 0 || row === this.rows - 1 || col === this.cols - 1) continue;

                if (this.isInSpawnArea(row, col)) {
                    this.map[row][col].type = 'empty';
                }
            }
        }
    }

    getSpawnPositions() {
        // Return SAFE coordinates for players to start.
        return [
            { row: 1, col: 1 },                     // Top-left (Player 1)
            { row: 1, col: this.cols - 2 },         // Top-right (Player 2)
            { row: this.rows - 2, col: 1 },         // Bottom-left (Player 3)
            { row: this.rows - 2, col: this.cols - 2 }  // Bottom-right (Player 4)
        ];
    }
}