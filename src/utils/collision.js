// Shared Utility: Collision Detection
// Utility functions for collision detection and pathfinding

/**
 * Check if a cell position is walkable (empty)
 * @param {Array} mapData - 2D array of map cells
 * @param {number} row - Row position (0-12)
 * @param {number} col - Column position (0-14)
 * @returns {boolean} True if walkable
 */
export function isWalkable(mapData, row, col) {
  if (row < 0 || row >= 13 || col < 0 || col >= 15) return false;
  const cell = mapData[row][col];
  return cell && cell.type === 'empty';
}

/**
 * Check if a cell is a wall (immovable)
 * @param {Array} mapData - 2D array of map cells
 * @param {number} row - Row position
 * @param {number} col - Column position
 * @returns {boolean} True if wall
 */
export function isWall(mapData, row, col) {
  if (row < 0 || row >= 13 || col < 0 || col >= 15) return true;
  const cell = mapData[row][col];
  return cell && cell.type === 'wall';
}

/**
 * Get cell at position
 * @param {Array} mapData - 2D array of map cells
 * @param {number} row - Row position
 * @param {number} col - Column position
 * @returns {Object|null} Cell object or null if out of bounds
 */
export function getCell(mapData, row, col) {
  if (row < 0 || row >= 13 || col < 0 || col >= 15) return null;
  return mapData[row][col];
}

/**
 * Check if position is blocked by blocks (destructible)
 * @param {Array} mapData - 2D array of map cells
 * @param {number} row - Row position
 * @param {number} col - Column position
 * @returns {boolean} True if blocked by destructible block
 */
export function isBlockedByDestructible(mapData, row, col) {
  if (row < 0 || row >= 13 || col < 0 || col >= 15) return false;
  const cell = mapData[row][col];
  return cell && cell.type === 'block';
}

/**
 * Check if position is occupied by a bomb
 * @param {Array} bombs - Array of bomb objects with row/col
 * @param {number} row - Row position
 * @param {number} col - Column position
 * @returns {boolean} True if bomb at position
 */
export function hasBomb(bombs, row, col) {
  return bombs.some(bomb => bomb.row === row && bomb.col === col);
}

/**
 * Check if position is occupied by a player
 * @param {Array} players - Array of player objects with row/col
 * @param {number} row - Row position
 * @param {number} col - Column position
 * @param {string} excludePlayerId - Optional player ID to exclude from check
 * @returns {boolean} True if player at position
 */
export function hasPlayer(players, row, col, excludePlayerId = null) {
  return players.some(player => 
    player.row === row && 
    player.col === col && 
    (!excludePlayerId || player.id !== excludePlayerId) &&
    player.alive !== false
  );
}

/**
 * Check if position can be moved to (combines all collision checks)
 * @param {Object} params - Object with mapData, row, col, bombs, players
 * @returns {boolean} True if position is passable
 */
export function canMoveTo(params) {
  const { mapData, row, col, bombs = [], players = [] } = params;
  
  // Check bounds
  if (row < 0 || row >= 13 || col < 0 || col >= 15) return false;
  
  // Check walkable
  if (!isWalkable(mapData, row, col)) return false;
  
  // Check bomb collision
  if (hasBomb(bombs, row, col)) return false;
  
  // Check player collision (optional, for now allow it)
  // Players can occupy same cell
  
  return true;
}

/**
 * Get all cells in explosion range from starting position
 * @param {Array} mapData - 2D array of map cells
 * @param {number} startRow - Starting row
 * @param {number} startCol - Starting column
 * @param {number} range - Explosion range (number of cells)
 * @returns {Array} Array of {row, col} positions affected by explosion
 */
export function getExplosionCells(mapData, startRow, startCol, range = 3) {
  const cells = [{ row: startRow, col: startCol }];
  const directions = [
    { dr: -1, dc: 0 }, // up
    { dr: 1, dc: 0 },  // down
    { dr: 0, dc: -1 }, // left
    { dr: 0, dc: 1 }   // right
  ];

  directions.forEach(({ dr, dc }) => {
    for (let i = 1; i <= range; i++) {
      const row = startRow + dr * i;
      const col = startCol + dc * i;

      // Check bounds
      if (row < 0 || row >= 13 || col < 0 || col >= 15) break;

      // Stop at walls
      if (isWall(mapData, row, col)) break;

      cells.push({ row, col });

      // Stop at blocks
      if (isBlockedByDestructible(mapData, row, col)) break;
    }
  });

  return cells;
}