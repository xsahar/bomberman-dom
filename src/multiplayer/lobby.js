// Handles lobby screen display and game state transitions

// Simple HTML escape to avoid injection when injecting nicknames
function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export class LobbyUI {
  constructor({ wsManager, onGameStart }) {
    this.ws = wsManager;
    this.onGameStart = onGameStart;
    this.lobbyElement = null;
    this.currentState = 'lobby';
    this.init();
    this.wireEvents();
  }

  init() {
    // Create lobby overlay
    this.lobbyElement = document.createElement('div');
    this.lobbyElement.id = 'lobby-overlay';
    this.lobbyElement.innerHTML = `
      <div class="lobby-overlay-inner">
        <div class="lobby-card">
          <div class="lobby-logo">BOMBERMAN</div>
          <div class="lobby-sub">READY UP & WAIT FOR OTHERS</div>

          <div class="lobby-players-grid" id="lobby-players">
            <div class="lobby-slot" data-slot="0">Empty</div>
            <div class="lobby-slot" data-slot="1">Empty</div>
            <div class="lobby-slot" data-slot="2">Empty</div>
            <div class="lobby-slot" data-slot="3">Empty</div>
          </div>

          <div class="lobby-controls">
            <div class="lobby-status">
              <div id="lobby-message">Waiting for players...</div>
              <div id="lobby-countdown" class="lobby-countdown"></div>
            </div>
            <div class="lobby-actions">
              <button id="lobby-ready" class="lobby-button">READY</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.lobbyElement);

    // Wire basic button events
    const readyBtn = this.lobbyElement.querySelector('#lobby-ready');
    if (readyBtn) readyBtn.addEventListener('click', () => this._onReady());
  }

  _onReady() {
    try {
      if (this.ws && typeof this.ws.send === 'function') {
        this.ws.send({ type: 'action', payload: { type: 'ready' } });
      }
    } catch (e) { /* ignore */ }
  }

  _onLeave() {
    try { if (this.ws && this.ws.disconnect) this.ws.disconnect(); } catch (e) {}
    this.destroy();
  }

  wireEvents() {
    this.ws.on('lobbyState', (state) => this.updateLobby(state));
  }

  updateLobby(state) {
    if (!state) return;
    
    const { players = [], gameState = {} } = state;
    const playerListEl = document.getElementById('lobby-players');
    const messageEl = document.getElementById('lobby-message');
    const countdownEl = document.getElementById('lobby-countdown');
    
    // Update player slots (keep consistent 4 slots)
    if (playerListEl) {
      const slots = playerListEl.querySelectorAll('.lobby-slot');
      for (let i = 0; i < slots.length; i++) {
        const slotEl = slots[i];
        const p = players[i];
        if (p) {
          // show numbered slot and player name
          const num = i + 1;
          if (p.id === this.ws.id) {
            slotEl.innerHTML = `<span class="lobby-slot-num">${num}.</span> <span class="lobby-player-you">${escapeHtml(p.nickname)}</span>`;
          } else {
            slotEl.innerHTML = `<span class="lobby-slot-num">${num}.</span> <span class="lobby-player-name">${escapeHtml(p.nickname)}</span>`;
          }
          slotEl.style.display = '';
        } else {
          // hide empty slots
          slotEl.style.display = 'none';
          slotEl.innerHTML = '';
        }
      }
    }

    // Update status message
    const count = players.length;
    if (gameState.state === 'lobby') {
      this.currentState = 'lobby';
      if (messageEl) messageEl.textContent = `Waiting for players... (${count}/4)`;
      if (countdownEl) countdownEl.textContent = '';
    } else if (gameState.state === 'waiting') {
      this.currentState = 'waiting';
      if (messageEl) messageEl.textContent = `${count} players ready! Starting soon...`;
      if (countdownEl) countdownEl.textContent = '';
    } else if (gameState.state === 'starting') {
      this.currentState = 'starting';
      if (messageEl) messageEl.textContent = 'Game starting in...';
      if (countdownEl) countdownEl.textContent = gameState.countdown || '10';
    } else if (gameState.state === 'playing') {
      this.currentState = 'playing';
      this.hide();
      if (this.onGameStart) this.onGameStart();
    }
  }

  hide() {
    if (this.lobbyElement) {
      this.lobbyElement.style.display = 'none';
    }
  }

  show() {
    if (this.lobbyElement) {
      this.lobbyElement.style.display = 'flex';
    }
  }

  destroy() {
    if (this.lobbyElement) {
      this.lobbyElement.remove();
      this.lobbyElement = null;
    }
  }
}

export default LobbyUI;
