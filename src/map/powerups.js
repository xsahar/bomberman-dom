// Person 2: Power-ups System
// PowerupManager class for managing power-ups

import { store } from '../../framework/index.js';

// Duration (ms) for temporary powerups (bombs/flames)
const POWERUP_DURATION_MS = 30000; // 30 seconds

export class PowerupManager {
  constructor() {
    this.powerupTypes = {
      bombs: { label: 'Bombs', effect: 'increaseBombs' },
      flames: { label: 'Flames', effect: 'increaseFlames' },
      speed: { label: 'Speed', effect: 'increaseSpeed' }
    };
  }

  // Called when a block is destroyed - random 30% chance
  spawnPowerup(row, col) {
    if (Math.random() > 0.3) return; // 30% spawn rate

    const types = Object.keys(this.powerupTypes);
    const randomType = types[Math.floor(Math.random() * types.length)];

    const state = store.getState();
    const powerups = state.powerups || [];

    store.setState({
      powerups: [
        ...powerups,
        {
          id: `powerup-${Date.now()}-${Math.random()}`,
          type: randomType,
          row: row,
          col: col
        }
      ]
    });
  }

  // Called when player collides with power-up
  collectPowerup(playerId, powerupId, playerInstance = null) {
    const state = store.getState();
    const powerup = state.powerups.find(p => p.id === powerupId);
    
    if (!powerup) return;

    // Apply effect to player (update store snapshot)
    const players = state.players.map(p => {
      if (p.id !== playerId) return p;

      switch (powerup.type) {
        case 'bombs':
          return { ...p, bombs: (p.bombs || 1) + 1 };
        case 'flames':
          return { ...p, flames: (p.flames || 1) + 1 };
        case 'speed':
          return { ...p, speed: (p.speed || 1) * 1.2 };
        default:
          return p;
      }
    });

    // If a live player instance was passed, update its runtime properties so
    // the effect is immediate. For bombs/flames we make the upgrade temporary
    // and schedule a timeout to remove it after POWERUP_DURATION_MS.
    if (playerInstance && powerup) {
      switch (powerup.type) {
        case 'bombs': {
          playerInstance.maxBombs = (playerInstance.maxBombs || 1) + 1;
          // ensure timer container exists
          playerInstance._powerupTimers = playerInstance._powerupTimers || { bombs: [], flames: [] };
          const timerId = setTimeout(() => {
            // expire one bomb boost
            playerInstance.maxBombs = Math.max(1, (playerInstance.maxBombs || 1) - 1);
            // update store snapshot
            try {
              const state2 = store.getState();
              const players2 = (state2.players || []).map(p => p.id === playerId ? { ...p, bombs: (playerInstance.maxBombs || 1) } : p);
              store.setState({ players: players2 });
            } catch (err) {
              console.error('Error updating store after bomb powerup expired:', err);
            }
            // remove this timer id from list
            const idx = playerInstance._powerupTimers.bombs.indexOf(timerId);
            if (idx !== -1) playerInstance._powerupTimers.bombs.splice(idx, 1);
          }, POWERUP_DURATION_MS);
          playerInstance._powerupTimers.bombs.push(timerId);
          break;
        }
        case 'flames': {
          playerInstance.bombRange = (playerInstance.bombRange || 1) + 1;
          playerInstance._powerupTimers = playerInstance._powerupTimers || { bombs: [], flames: [] };
          const timerId = setTimeout(() => {
            playerInstance.bombRange = Math.max(1, (playerInstance.bombRange || 1) - 1);
            try {
              const state2 = store.getState();
              const players2 = (state2.players || []).map(p => p.id === playerId ? { ...p, flames: (playerInstance.bombRange || 1) } : p);
              store.setState({ players: players2 });
            } catch (err) {
              console.error('Error updating store after flame powerup expired:', err);
            }
            const idx = playerInstance._powerupTimers.flames.indexOf(timerId);
            if (idx !== -1) playerInstance._powerupTimers.flames.splice(idx, 1);
          }, POWERUP_DURATION_MS);
          playerInstance._powerupTimers.flames.push(timerId);
          break;
        }
        case 'speed':
          // Ensure instance has a speed property and scale it (permanent)
          playerInstance.speed = (playerInstance.speed || 1) * 1.2;
          break;
        default:
          break;
      }
    }

    // Remove collected powerup
    const updatedPowerups = state.powerups.filter(p => p.id !== powerupId);

    store.setState({ 
      players, 
      powerups: updatedPowerups 
    });
  }

  // Render power-ups as special cells on the map
  renderPowerups(mapData, powerups) {
    const mapCopy = mapData.map(row => [...row]);
    
    powerups.forEach(powerup => {
      if (mapCopy[powerup.row] && mapCopy[powerup.row][powerup.col]) {
        mapCopy[powerup.row][powerup.col] = {
          type: 'powerup',
          powerupType: powerup.type,
          id: powerup.id
        };
      }
    });

    return mapCopy;
  }

  // Get all powerup types for reference
  getPowerupTypes() {
    return this.powerupTypes;
  }
}