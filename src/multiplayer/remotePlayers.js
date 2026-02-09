// RemotePlayersManager: render other players and remote bombs on the map
import { store } from '../../framework/index.js';
const TILE_SIZE = 40;
const PLAYER_SIZE = 32;
const OFFSET = (TILE_SIZE - PLAYER_SIZE) / 2; // Center player in tile

export class RemotePlayersManager {
  constructor({ wsManager, mapContainer = document.querySelector('.map') } = {}) {
    this.ws = wsManager;
    this.mapContainer = mapContainer;
    this.players = new Map(); // id => { element, nickname }
    this._localWinShown = false;
  }

  addPlayer({ id, nickname, clientId } = {}) {
    if (!id || !this.mapContainer) return;
    
    // Early return for duplicate check - prevent spam
    if (this.players.has(id)) {
      // Player already exists, just update nickname if changed
      const existingPlayer = this.players.get(id);
      if (existingPlayer.nickname !== nickname) {
        existingPlayer.nickname = nickname || id;
        existingPlayer.element.title = existingPlayer.nickname;
      }
      // Store clientId for future duplicate detection
      if (clientId && !existingPlayer.clientId) {
        existingPlayer.clientId = clientId;
      }
      return; // Don't log or process further - this is normal
    }
    
    // If this entry represents the local websocket id, skip rendering
    if (this.ws && this.ws.id === id) {
      return; // Skip silently to avoid spam
    }
    
    // If this entry's clientId matches our local stored client id, it's the same browser/tab identity — skip to avoid duplicates
    try {
      const localClientId = (typeof localStorage !== 'undefined') ? localStorage.getItem('mp_client_id') : null;
      if (clientId && localClientId && clientId === localClientId) {
        return;
      }
    } catch (err) {
      // ignore storage errors
    }
    
    // Remove any existing player with the same clientId (old connection)
    if (clientId) {
      for (const [existingId, playerData] of this.players.entries()) {
        if (existingId !== id && playerData.clientId === clientId) {
          this.removePlayer(existingId);
        }
      }
    }
    
    const el = document.createElement('div');
    el.className = 'player remote-player';
    el.dataset.playerId = id;
    el.title = nickname || id;
    
    // Clean up any existing DOM elements with same player ID to prevent duplicates
    const existingElements = this.mapContainer.querySelectorAll(`[data-player-id="${id}"]`);
    existingElements.forEach(elem => {
      elem.remove();
    });
    
    // avoid duplicates: if a player with same nickname already exists in DOM, skip adding
    try {
      const existingLabel = this.mapContainer.querySelector('.player .player-name, .player.remote-player .player-name');
      const localNick = (typeof localStorage !== 'undefined') ? localStorage.getItem('mp_nick') : null;
      if (nickname && localNick && nickname === localNick && existingLabel && existingLabel.textContent === nickname) {
        // A label with the same nickname is already present (likely local); skip remote rendering
        return;
      }
    } catch (err) {
      // ignore DOM/storage errors
    }

    // add visible name label above the player
    const nameLabel = document.createElement('div');
    nameLabel.className = 'player-name';
    nameLabel.textContent = nickname || id;
    el.appendChild(nameLabel);
    el.style.transform = 'translate(-1000px, -1000px)'; // Hide until positioned
    // Ensure full, non-cut frame before first update
    el.style.backgroundPosition = '0% 0%';
    this.mapContainer.appendChild(el);
    this.players.set(id, { element: el, nickname: nickname || id, clientId: clientId });
  }

  removePlayer(id) {
    const p = this.players.get(id);
    if (!p) return;
    if (p.element && p.element.parentNode) p.element.remove();
    this.players.delete(id);
    console.log(`🚪 Player ${id} removed. Remaining players:`, this.players.size);
    this._checkLocalWinOnSolo();
  }

  _checkLocalWinOnSolo() {
    if (this._localWinShown) return;
    console.log('🔍 Checking win condition - players remaining:', this.players.size);
    try {
      // Only trigger win if there's an active local player who is alive
      if (!window.player || window.player.dead) {
        console.log('❌ No win - player not found or dead');
        return;
      }
      // Check if there are no remote players left
      if (this.players.size === 0) {
        console.log('✅ All remote players left - showing win!');
        if (typeof window.player.showEndGameMessage === 'function') {
          this._localWinShown = true;
          window.player.showEndGameMessage('🎉 You Won!');
        }
      }
    } catch (err) {
      console.error('Error in win check:', err);
    }
  }

  updatePlayerPosition(id, row, col, x, y) {
    if (this.ws && this.ws.id === id) return; // Don't update local player
    
    const p = this.players.get(id);
    if (!p || !p.element) {
      console.warn(`⚠️ Cannot update position - player ${id} not found in remote players map`);
      return;
    }
    
    // Use exact x,y coordinates if provided, otherwise calculate from row/col
    const posX = (x !== undefined) ? x : (col * TILE_SIZE + OFFSET);
    const posY = (y !== undefined) ? y : (row * TILE_SIZE + OFFSET);
    
    p.element.style.transform = `translate(${posX}px, ${posY}px)`;
    p.element.style.visibility = 'visible'; // Ensure player is visible
    // Only log significant position changes to avoid spam
    if (!p.lastLoggedPos || Math.abs(p.lastLoggedPos.x - posX) > 10 || Math.abs(p.lastLoggedPos.y - posY) > 10) {
        console.log(`📍 Updated player ${id} position to: ${posX}, ${posY} (row: ${row}, col: ${col})`);
        p.lastLoggedPos = { x: posX, y: posY };
    }
  }

  handleAction(payload) {
    if (!payload || !payload.playerId) return;
    const { playerId, type } = payload;
    if (this.ws && this.ws.id === playerId) return; // Don't process local player actions
    
    if (type === 'move') {
      // Update position and facing frame
      this.updatePlayerPosition(playerId, payload.row, payload.col, payload.x, payload.y);
      if (typeof payload.direction === 'number') {
        const directionMap = {
          0: { x: 0, y: 0 },     // down
          1: { x: 100, y: 0 },   // left
          2: { x: 100, y: 100 }, // right
          3: { x: 0, y: 100 }    // up
        };
        const pos = directionMap[payload.direction] || directionMap[0];
        const playerRec = this.players.get(playerId);
        if (playerRec && playerRec.element) {
          playerRec.element.style.backgroundPosition = `${pos.x}% ${pos.y}%`;
        }
      }
    } else if (type === 'placeBomb') {
      console.log(`💣 Remote player ${playerId} placed bomb at [${payload.row}, ${payload.col}]`);
      this.renderRemoteBomb(payload.row, payload.col);
    } else if (type === 'powerupSpawned') {
      console.log(`🔋 Remote powerup spawned: ${payload.powerupType} at [${payload.row}, ${payload.col}]`);
      // Add powerup to local state so it displays
      try {
        const state = store.getState();
        const powerups = state.powerups || [];
        const newPowerup = {
          id: `powerup-${Date.now()}-${Math.random()}`,
          type: payload.powerupType,
          row: payload.row,
          col: payload.col
        };
        store.setState({
          powerups: [
            ...powerups,
            newPowerup
          ]
        });
      } catch (err) {
        console.error('Error handling remote powerup spawn:', err);
      }
    } else if (type === 'powerupCollected') {
      console.log(`🔋 Remote player collected powerup at [${payload.row}, ${payload.col}]`);
      // Remove powerup from local state by row/col (same tile)
      try {
        const state = store.getState();
        const powerups = state.powerups || [];
        const filtered = powerups.filter(p => !(p.row === payload.row && p.col === payload.col));
        if (filtered.length < powerups.length) {
          console.log(`✅ Removed powerup at [${payload.row}, ${payload.col}] from local state`);
          store.setState({ powerups: filtered });
        }
      } catch (err) {
        console.error('Error handling remote powerup collection:', err);
      }
    } else if (type === 'died') {
      console.log(`☠️ Remote player ${playerId} died`);
      // remove remote player's visual
      this.removePlayer(playerId);
      // If local player exists and is alive, and no remote players remain, show local win
      try {
        if (window.player && !window.player.dead) {
          if (this.players.size === 0) {
            if (typeof window.player.showEndGameMessage === 'function') {
              window.player.showEndGameMessage('🎉 You Won!');
            }
          }
        }
      } catch (err) {
        console.warn('Error handling remote death', err);
      }
    } else if (type === 'explode') {
      console.log(`💥 Remote player ${playerId} explosion at [${payload.row}, ${payload.col}]`);
      this.handleRemoteExplosion(payload);

      // Determine affected tiles (prefer payload.affectedTiles if provided)
      let affectedTiles = [];
      if (Array.isArray(payload.affectedTiles) && payload.affectedTiles.length > 0) {
        affectedTiles = payload.affectedTiles;
      } else {
        // Fallback calculation using center + range
        const { row, col, range = 1 } = payload;
        affectedTiles.push({ row, col });
        const directions = [ { dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 } ];
        directions.forEach(({ dr, dc }) => {
          for (let i = 1; i <= range; i++) {
            const r = row + (dr * i);
            const c = col + (dc * i);
            if (r >= 0 && c >= 0 && r < 13 && c < 15) {
              affectedTiles.push({ row: r, col: c });
            }
          }
        });
      }

      // If local player exists and is on any affected tile, apply damage
      try {
        if (window.player && typeof window.player.applyDamage === 'function') {
          const localPlayer = window.player;
          if (affectedTiles.some(t => localPlayer.row === t.row && localPlayer.col === t.col)) {
            console.log('😵 Local player hit by remote explosion, applying damage');
            localPlayer.applyDamage(1);
          }
        }
      } catch (err) {
        console.warn('Error applying remote explosion damage to local player', err);
      }
    } else if (type === 'mapUpdate') {
      console.log(`🗺️ Map update from player ${playerId}`);
      this.handleMapUpdate(payload);
    }
  }

  renderRemoteBomb(row, col) {
    if (!this.mapContainer) return;
    const bombEl = document.createElement('div');
    bombEl.className = 'bomb remote-bomb';
    bombEl.style.left = (col * TILE_SIZE) + 'px';
    bombEl.style.top = (row * TILE_SIZE) + 'px';
    this.mapContainer.appendChild(bombEl);
    setTimeout(() => {
      if (bombEl.parentNode) bombEl.remove();
    }, 3500);
  }

  handleRemoteExplosion(payload) {
    if (!this.mapContainer) return;
    const { row, col, range = 1 } = payload;
    
    console.log(`💥 Remote explosion at [${row}, ${col}] with range ${range}`);
    
    // Remove any bomb at this position
    const bombs = this.mapContainer.querySelectorAll('.remote-bomb, .bomb');
    bombs.forEach(bomb => {
      const bombRow = Math.floor(parseInt(bomb.style.top) / TILE_SIZE);
      const bombCol = Math.floor(parseInt(bomb.style.left) / TILE_SIZE);
      if (bombRow === row && bombCol === col) {
        bomb.remove();
        console.log(`🗑️ Removed bomb at [${bombRow}, ${bombCol}]`);
      }
    });
    
    // Create explosion visual effects
    this.createExplosionEffect(row, col, range);
  }

  handleMapUpdate(payload) {
    if (!payload.affectedTiles || !payload.explosionCenter) return;
    
    // Update local map state with remote changes
    if (payload.mapData) {
      try {
        store.setState({
          map: { ...store.getState().map, data: payload.mapData }
        });
        console.log('🔄 Updated local map state from remote');
        
        // Force re-render of the map to show destroyed blocks
        if (window.app && typeof window.app.render === 'function') {
          window.app.render();
        }
      } catch (err) {
        console.warn('Failed to update map state:', err);
      }
    }
    
    // Create explosion visuals for the affected tiles
    this.createExplosionEffect(
      payload.explosionCenter.row, 
      payload.explosionCenter.col, 
      payload.explosionCenter.range,
      payload.affectedTiles
    );
    
    // Remove any bombs at explosion center
    this.removeBombsAt(payload.explosionCenter.row, payload.explosionCenter.col);
  }

  removeBombsAt(row, col) {
    const bombs = this.mapContainer.querySelectorAll('.remote-bomb, .bomb');
    bombs.forEach(bomb => {
      const bombRow = Math.floor(parseInt(bomb.style.top) / TILE_SIZE);
      const bombCol = Math.floor(parseInt(bomb.style.left) / TILE_SIZE);
      if (bombRow === row && bombCol === col) {
        bomb.remove();
        console.log(`💣 Removed bomb at explosion center [${row}, ${col}]`);
      }
    });
  }

  createExplosionEffect(centerRow, centerCol, range, affectedTiles = null) {
    let explosionPositions = [];
    
    // Use exact affected tiles if provided, otherwise calculate
    if (affectedTiles && Array.isArray(affectedTiles)) {
      explosionPositions = affectedTiles;
    } else {
      // Fallback to calculated positions
      explosionPositions.push({ row: centerRow, col: centerCol });
      
      const directions = [
        { dr: -1, dc: 0 }, // up
        { dr: 1, dc: 0 },  // down  
        { dr: 0, dc: -1 }, // left
        { dr: 0, dc: 1 }   // right
      ];
      
      directions.forEach(({ dr, dc }) => {
        for (let i = 1; i <= range; i++) {
          const r = centerRow + (dr * i);
          const c = centerCol + (dc * i);
          if (r >= 0 && c >= 0 && r < 13 && c < 15) {
            explosionPositions.push({ row: r, col: c });
          }
        }
      });
    }
    
    console.log(`🔥 Creating ${explosionPositions.length} explosion effects for remote explosion`);
    
    // Create explosion visual elements
    explosionPositions.forEach(({ row, col }) => {
      const explosionEl = document.createElement('div');
      explosionEl.className = 'explosion remote-explosion';
      explosionEl.style.position = 'absolute';
      explosionEl.style.left = (col * TILE_SIZE) + 'px';
      explosionEl.style.top = (row * TILE_SIZE) + 'px';
      explosionEl.style.width = TILE_SIZE + 'px';
      explosionEl.style.height = TILE_SIZE + 'px';
      explosionEl.style.zIndex = '10';
      this.mapContainer.appendChild(explosionEl);
      
      // Remove explosion after animation
      setTimeout(() => {
        if (explosionEl.parentNode) {
          explosionEl.remove();
        }
      }, 500); // Match the local explosion duration
    });
  }



  syncState(state) {
    if (!state) return;
    const playersList = state.players || [];
    // support both array and object forms for players
    if (Array.isArray(playersList)) {
      playersList.forEach(meta => {
        if (!meta) return;
        const id = meta.id;
        if (this.ws && this.ws.id === id) return; // Skip local player
        this.addPlayer({ id, nickname: meta.nickname, clientId: meta.clientId });
        if (meta && typeof meta.row === 'number' && typeof meta.col === 'number') {
          // Use exact x,y coordinates if available for better positioning
          this.updatePlayerPosition(id, meta.row, meta.col, meta.x, meta.y);
        }
      });
      return;
    }

    const playersObj = playersList;
    const ids = Object.keys(playersObj);
    // ensure players exist
    ids.forEach(id => {
      if (this.ws && this.ws.id === id) return; // Skip local player
      const meta = playersObj[id];
      this.addPlayer({ id, nickname: meta && meta.nickname, clientId: meta && meta.clientId });
      if (meta && typeof meta.row === 'number' && typeof meta.col === 'number') {
        // Use exact x,y coordinates if available for better positioning
        this.updatePlayerPosition(id, meta.row, meta.col, meta.x, meta.y);
        // Apply facing direction if present
        if (typeof meta.direction === 'number') {
          const directionMap = {
            0: { x: 0, y: 0 }, 1: { x: 100, y: 0 }, 2: { x: 100, y: 100 }, 3: { x: 0, y: 100 }
          };
          const pos = directionMap[meta.direction] || directionMap[0];
          const rec = this.players.get(id);
          if (rec && rec.element) rec.element.style.backgroundPosition = `${pos.x}% ${pos.y}%`;
        }
      }
    });
    
    // Do not remove players based on stateSync alone.
    // Removals are handled via explicit 'playerLeft' events.
  }
}

export default RemotePlayersManager;
