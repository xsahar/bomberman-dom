// Shared Utility: Helper Functions
// Common utility functions used across the game

import { MapGenerator } from '../map/mapGenerator.js';
import { PowerupManager } from '../map/powerups.js';
import { store } from '../../framework/index.js';

/**
 * Reset the game map for a new round
 */
export function resetMap() {
  const generator = new MapGenerator();
  const newMapData = generator.generateMap();

  store.setState({
    map: {
      data: newMapData,
      rows: 13,
      cols: 15
    },
    powerups: [],
    bombs: []
  });

  console.log('✅ Map reset');
}

/**
 * Generate a unique ID for entities
 * @param {string} prefix - Prefix for ID
 * @returns {string} Unique ID
 */
export function generateId(prefix = 'entity') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Check if two positions are equal
 * @param {Object} pos1 - Position with row/col
 * @param {Object} pos2 - Position with row/col
 * @returns {boolean} True if positions are same
 */
export function positionsEqual(pos1, pos2) {
  return pos1.row === pos2.row && pos1.col === pos2.col;
}

/**
 * Get Manhattan distance between two positions
 * @param {Object} pos1 - Position with row/col
 * @param {Object} pos2 - Position with row/col
 * @returns {number} Manhattan distance
 */
export function getManhattanDistance(pos1, pos2) {
  return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
}

/**
 * Validate grid position is within bounds
 * @param {number} row - Row (0-12)
 * @param {number} col - Column (0-14)
 * @returns {boolean} True if in bounds
 */
export function isInBounds(row, col) {
  return row >= 0 && row <= 12 && col >= 0 && col <= 14;
}

/**
 * Get PowerupManager instance (singleton pattern)
 * @returns {PowerupManager} Singleton instance
 */
let powerupManagerInstance = null;

export function getPowerupManager() {
  if (!powerupManagerInstance) {
    powerupManagerInstance = new PowerupManager();
  }
  return powerupManagerInstance;
}