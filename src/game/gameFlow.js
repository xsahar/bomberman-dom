import { MapGenerator } from '../map/mapGenerator.js';
import { store } from '../../framework/index.js';

/**
 * Reset the round: regenerate map, clear powerups/bombs/explosions, and respawn players.
 * @param {Object} opts
 * @param {Array} opts.playersInstances - array of Player instances to respawn
 * @param {Object} opts.bombPlacer - BombPlacement instance (optional) to clear active bombs
 */
export function resetRound({ playersInstances = [], bombPlacer = null } = {}) {
  // 1. Regenerate map
  const generator = new MapGenerator();
  const mapData = generator.generateMap();

  // 2. Clear central store arrays and set gameState to 'lobby' (or 'playing' after countdown)
  store.setState({
    map: { data: mapData, rows: generator.rows, cols: generator.cols },
    powerups: [],
    bombs: [],
    explosions: [],
    gameState: 'lobby'
  });

  // 3. Clear bombs tracked by BombPlacement (remove DOM and clear list)
  if (bombPlacer && Array.isArray(bombPlacer.activeBombs)) {
    bombPlacer.activeBombs.forEach(b => {
      try { if (b.element) b.element.remove(); } catch (e) { /* ignore */ }
    });
    bombPlacer.activeBombs = [];
  }

  // 4. Remove any lingering explosion visuals from DOM
  try {
    document.querySelectorAll('.explosion').forEach(el => el.remove());
  } catch (e) { /* DOM not available in non-browser env */ }

  // 5. Respawn players into safe spawn positions and reset their runtime powerups
  const spawnPositions = generator.getSpawnPositions();
  playersInstances.forEach((player, idx) => {
    const spawn = spawnPositions[idx] || spawnPositions[0];
    // update spawn coordinates and force respawn
    player.spawnRow = spawn.row;
    player.spawnCol = spawn.col;
    if (typeof player.resetPowerups === 'function') player.resetPowerups();
    if (typeof player.respawnAtSpawn === 'function') player.respawnAtSpawn();
  });

  // return new map data for convenience
  return mapData;
}
// Person 1: Game Flow Management
// TODO: Implement GameFlow class for overall game management

// Requirements:
// - Game state management (lobby, countdown, playing, ended)
// - Game start/end logic
// - Victory condition checking
// - Game loop coordination
// - Integration of all game systems
// - Methods: initGame(), startGame(), endGame(), checkVictory(), updateGameState(), gameLoop()