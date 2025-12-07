// Person 2: Power-ups System
// PowerupManager class for managing power-ups

import { store } from '../../framework/index.js';

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
  collectPowerup(playerId, powerupId) {
    const state = store.getState();
    const powerup = state.powerups.find(p => p.id === powerupId);
    
    if (!powerup) return;

    // Apply effect to player
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