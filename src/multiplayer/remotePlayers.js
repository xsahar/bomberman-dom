// RemotePlayersManager: render other players and remote bombs on the map
const TILE_SIZE = 40;

export class RemotePlayersManager {
  constructor({ wsManager, mapContainer = document.querySelector('.map') } = {}) {
    this.ws = wsManager;
    this.mapContainer = mapContainer;
    this.players = new Map(); // id => { element, nickname }
  }

  addPlayer({ id, nickname }) {
    if (!id || !this.mapContainer) return;
    if (this.ws && this.ws.id === id) return; // Don't render local player
    if (this.players.has(id)) return;
    const el = document.createElement('div');
    el.className = 'player remote-player';
    el.dataset.playerId = id;
    el.title = nickname || id;
    el.style.transform = 'translate(-1000px, -1000px)';
    this.mapContainer.appendChild(el);
    this.players.set(id, { element: el, nickname: nickname || id });
  }

  removePlayer(id) {
    const p = this.players.get(id);
    if (!p) return;
    if (p.element && p.element.parentNode) p.element.remove();
    this.players.delete(id);
  }

  updatePlayerPosition(id, row, col) {
    if (this.ws && this.ws.id === id) return; // Don't update local player
    const p = this.players.get(id);
    if (!p || !p.element) return;
    const x = col * TILE_SIZE;
    const y = row * TILE_SIZE;
    p.element.style.transform = `translate(${x}px, ${y}px)`;
  }

  handleAction(payload) {
    if (!payload || !payload.playerId) return;
    const { playerId, type } = payload;
    if (this.ws && this.ws.id === playerId) return; // Don't process local player actions
    if (type === 'move') {
      this.updatePlayerPosition(playerId, payload.row, payload.col);
    } else if (type === 'placeBomb') {
      this.renderRemoteBomb(payload.row, payload.col);
    }
  }

  renderRemoteBomb(row, col) {
    if (!this.mapContainer) return;
    const bombEl = document.createElement('div');
    bombEl.className = 'bomb remote-bomb';
    bombEl.style.left = (col * TILE_SIZE) + 'px';
    bombEl.style.top = (row * TILE_SIZE) + 'px';
    this.mapContainer.appendChild(bombEl);
    setTimeout(() => bombEl.remove(), 3500);
  }

  syncState(state) {
    if (!state) return;
    const playersObj = state.players || {};
    const ids = Object.keys(playersObj);
    // ensure players exist
    ids.forEach(id => {
      if (this.ws && this.ws.id === id) return; // Skip local player
      const meta = playersObj[id];
      this.addPlayer({ id, nickname: meta && meta.nickname });
      if (meta && typeof meta.row === 'number' && typeof meta.col === 'number') {
        this.updatePlayerPosition(id, meta.row, meta.col);
      }
    });
    // remove players not present
    Array.from(this.players.keys()).forEach(id => {
      if (!playersObj[id]) this.removePlayer(id);
    });
  }
}

export default RemotePlayersManager;
