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
    // track active powerups per player: { playerId: [ { id, type, expiresAt, disabled, timerId, removeTimer } ] }
    this.activePowerups = {};
    this._panelTicker = null;
  }

  // Called when a block is destroyed - random 30% chance
  spawnPowerup(row, col) {
    if (Math.random() > 0.3) return null; // 30% spawn rate

    const types = Object.keys(this.powerupTypes);
    const randomType = types[Math.floor(Math.random() * types.length)];

    const newPowerup = {
      id: `powerup-${Date.now()}-${Math.random()}`,
      type: randomType,
      row: row,
      col: col
    };

    const state = store.getState();
    const powerups = state.powerups || [];

    store.setState({
      powerups: [
        ...powerups,
        newPowerup
      ]
    });
    
    return newPowerup;
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
          // ensure timer container exists with ALL timer arrays
          playerInstance._powerupTimers = playerInstance._powerupTimers || { bombs: [], flames: [], speed: [] };
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
            // mark UI as expired for this player's powerup and schedule removal
            try { this._markPowerupExpired(playerId, powerup.type); } catch (e) { /* ignore */ }
          }, POWERUP_DURATION_MS);
          playerInstance._powerupTimers.bombs.push(timerId);
          // register active powerup for UI
          this._addActivePowerup(playerId, powerup.type, Date.now() + POWERUP_DURATION_MS, timerId);
          break;
        }
        case 'flames': {
          playerInstance.bombRange = (playerInstance.bombRange || 1) + 1;
          // ensure timer container exists with ALL timer arrays
          playerInstance._powerupTimers = playerInstance._powerupTimers || { bombs: [], flames: [], speed: [] };
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
            try { this._markPowerupExpired(playerId, powerup.type); } catch (e) { /* ignore */ }
          }, POWERUP_DURATION_MS);
          playerInstance._powerupTimers.flames.push(timerId);
          this._addActivePowerup(playerId, powerup.type, Date.now() + POWERUP_DURATION_MS, timerId);
          break;
        }
        case 'speed':
          // Ensure instance has a speed property and scale it temporarily
          playerInstance.speed = (playerInstance.speed || 1) * 1.2;
          playerInstance._powerupTimers = playerInstance._powerupTimers || { bombs: [], flames: [], speed: [] };
          const speedTimer = setTimeout(() => {
            // revert speed
            playerInstance.speed = Math.max(1, (playerInstance.speed || 1) / 1.2);
            try {
              const state2 = store.getState();
              const players2 = (state2.players || []).map(p => p.id === playerId ? { ...p, speed: (playerInstance.speed || 1) } : p);
              store.setState({ players: players2 });
            } catch (err) {
              console.error('Error updating store after speed powerup expired:', err);
            }
            const idx = playerInstance._powerupTimers.speed.indexOf(speedTimer);
            if (idx !== -1) playerInstance._powerupTimers.speed.splice(idx, 1);
            try { this._markPowerupExpired(playerId, powerup.type); } catch (e) { /* ignore */ }
          }, POWERUP_DURATION_MS);
          playerInstance._powerupTimers.speed.push(speedTimer);
          this._addActivePowerup(playerId, powerup.type, Date.now() + POWERUP_DURATION_MS, speedTimer);
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
    // Render powerup UI for local player
    try { this._renderPowerupPanel(); } catch (e) { /* ignore */ }
  }

  // --- Active powerup UI management -------------------------------------
  _addActivePowerup(playerId, type, expiresAt = null, timerId = null) {
    if (!playerId || !type) return;
    this.activePowerups[playerId] = this.activePowerups[playerId] || [];
    const entry = { id: `active-${type}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, type, expiresAt, disabled: false, timerId };
    this.activePowerups[playerId].push(entry);
    this._renderPowerupPanel();
    return entry;
  }

  _markPowerupExpired(playerId, type) {
    const list = this.activePowerups[playerId] || [];
    // mark oldest matching active powerup as expired (disabled)
    for (let i = 0; i < list.length; i++) {
      if (list[i].type === type && !list[i].disabled) {
        list[i].disabled = true;
        // keep visible briefly then remove
        this._renderPowerupPanel();
        setTimeout(() => {
          const idx = (this.activePowerups[playerId] || []).indexOf(list[i]);
          if (idx !== -1) this.activePowerups[playerId].splice(idx, 1);
          this._renderPowerupPanel();
        }, 3000);
        break;
      }
    }
  }

  clearActiveForPlayer(playerId) {
    if (!playerId) return;
    this.activePowerups[playerId] = [];
    this._renderPowerupPanel();
  }

  _renderPowerupPanel() {
    // show only local player's active powerups
    const localId = (window.player && window.player.id) ? window.player.id : 'local_player';
    const entries = this.activePowerups[localId] || [];
    // If there are no active entries, remove/hide the panel and stop ticker
    let panel = document.getElementById('powerup-panel');
    if (!entries || entries.length === 0) {
      if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
      if (this._panelTicker) { clearInterval(this._panelTicker); this._panelTicker = null; }
      return;
    }

    // create panel if missing (only when entries exist)
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'powerup-panel';
      panel.className = 'powerup-panel';
      // position left of map
      panel.style.position = 'fixed';
      panel.style.left = '20px';
      panel.style.top = '120px';
      panel.style.zIndex = '1200';
      document.body.appendChild(panel);
    }
    panel.innerHTML = '<h3>Powerups</h3>';
    const iconMap = { bombs: '💣', flames: '🔥', speed: '⚡' };
    entries.forEach(e => {
      const row = document.createElement('div');
      row.className = 'powerup-row' + (e.disabled ? ' disabled' : '');
      const icon = document.createElement('span');
      icon.className = 'powerup-icon';
      icon.textContent = iconMap[e.type] || '⭐';
      const label = document.createElement('span');
      label.className = 'powerup-label';
      label.textContent = this.powerupTypes[e.type] ? this.powerupTypes[e.type].label : e.type;
      row.appendChild(icon);
      row.appendChild(label);
      // add remaining time if available
      if (e.expiresAt && !e.disabled) {
        const remaining = Math.max(0, Math.ceil((e.expiresAt - Date.now()) / 1000));
        const rem = document.createElement('span');
        rem.className = 'powerup-remaining';
        rem.textContent = ` ${remaining}s`;
        row.appendChild(rem);
      }
      panel.appendChild(row);
    });
    // start a 1s ticker to refresh remaining time if not already running
    if (!this._panelTicker) {
      this._panelTicker = setInterval(() => {
        // if panel has no entries anymore, stop ticker
        const localId = (window.player && window.player.id) ? window.player.id : 'local_player';
        const list = this.activePowerups[localId] || [];
        if (!list || list.length === 0) { clearInterval(this._panelTicker); this._panelTicker = null; this._renderPowerupPanel(); return; }
        // re-render to update remaining seconds
        this._renderPowerupPanel();
      }, 1000);
    }
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