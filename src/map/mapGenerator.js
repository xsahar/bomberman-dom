// Person 2: Map Generation & Power-ups
// TODO: Implement MapGenerator class for creating the game map

// Requirements:
// - Generate 15x13 grid map
// - Place walls in fixed positions  
// - Randomly generate destructible blocks
// - Ensure corner spawn areas are clear (3x3 safe zones)
// - Methods: generateMap(), placeWalls(), placeBlocks(), clearSpawnAreas(), getMapData()




import { store } from '../../framework/index.js';


export class MapGenerator {
    constructor(rows = 13, cols = 15) {
        this.rows = rows;
        this.cols = cols;
        this.map = [];
    }

    generateMap() {
        this.createEmptyMap(); // Fixed typo
        this.placeWalls();
        this.clearSpawnAreas(); // Clear BEFORE placing blocks
        this.placeBlocks();
        return this.map;
    }

    getMapData() {
        return this.map;
    }

    createEmptyMap() { // Fixed typo: was createEpmtyMap
        this.map = [];
        for (let row = 0; row < this.rows; row++) { // Fixed: was 'rows'
            const rowArr = [];
            for (let col = 0; col < this.cols; col++) { // Fixed: was 'cols'
                rowArr.push({ type: 'empty' }); // Fixed: removed extra space
            }
            this.map.push(rowArr);
        }
    }

    placeWalls() {
        for (let row = 0; row < this.rows; row++) { // Fixed: was 'rows'
            for (let col = 0; col < this.cols; col++) { // Fixed: was 'cols'
                // Checkerboard pattern: walls at ODD row AND ODD col
                const isInnerWall = row % 2 === 1 && col % 2 === 1; // Fixed: was row % 2 === 0

                if (isInnerWall) {
                    this.map[row][col].type = 'wall';
                }
            }
        }
    }

    isInSpawnArea(row, col) {
        const lastRow = this.rows - 1;
        const lastCol = this.cols - 1;

        const inTopLeft = row >= 0 && row <= 2 && col >= 0 && col <= 2;
        const inTopRight = row >= 0 && row <= 2 && col >= lastCol - 2 && col <= lastCol;
        const inBottomLeft = row >= lastRow - 2 && row <= lastRow && col >= 0 && col <= 2; // Fixed
        const inBottomRight = row >= lastRow - 2 && row <= lastRow && col >= lastCol - 2 && col <= lastCol;

        return inTopLeft || inTopRight || inBottomLeft || inBottomRight;
    }

    placeBlocks() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.map[row][col];

                if (cell.type !== 'empty') continue; // Skip walls
                if (this.isInSpawnArea(row, col)) continue; // Skip spawn areas

                if (Math.random() < 0.6) { // 60% chance
                    cell.type = 'block';
                }
            }
        }
    }

    clearSpawnAreas() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.isInSpawnArea(row, col)) {
                    this.map[row][col].type = 'empty';
                }
            }
        }
    }

    // ADD THIS: Get player spawn positions (corners)
    getSpawnPositions() {
        return [
            { row: 0, col: 0 },                    // Top-left corner
            { row: 0, col: this.cols - 1 },        // Top-right corner
            { row: this.rows - 1, col: 0 },        // Bottom-left corner
            { row: this.rows - 1, col: this.cols - 1 } // Bottom-right corner
        ];
    }
}


