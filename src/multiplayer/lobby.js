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
    this._presence = null;
    this.chatContainer = null;
    this.init();
    this.wireEvents();
  }

  init() {
    // Create lobby using instructions-modal markup so styles match
    this.lobbyElement = document.createElement('div');
    this.lobbyElement.id = 'lobby-overlay';
    this.lobbyElement.className = 'instructions-overlay';
    this.lobbyElement.innerHTML = `
      <div class="instructions-modal">
        <div class="instructions-header">
          <h1>BOMBERMAN</h1>
        </div>
        <div class="instructions-content">
          <div class="player-list">
            <h3>Players</h3>
            <div id="lobby-players" class="lobby-players-grid">
              <div class="lobby-slot" data-slot="0">Empty</div>
              <div class="lobby-slot" data-slot="1">Empty</div>
              <div class="lobby-slot" data-slot="2">Empty</div>
              <div class="lobby-slot" data-slot="3">Empty</div>
            </div>
          </div>

          <div class="lobby-status">
            <div id="lobby-message">Waiting for players...</div>
            <div id="lobby-countdown" class="lobby-countdown"></div>
          </div>

          <div id="lobby-chat-container" class="lobby-chat-container"></div>
        </div>
        <div class="instructions-footer">
        </div>
      </div>
    `;
    document.body.appendChild(this.lobbyElement);

    // Store reference to chat container
    this.chatContainer = this.lobbyElement.querySelector('#lobby-chat-container');

    // Mark this client as being in the lobby
    this.setPresence(true);
  }

  // _onReady removed: lobby no longer exposes a ready button

  _onLeave() {
    try { if (this.ws && this.ws.disconnect) this.ws.disconnect(); } catch (e) {}
    this.destroy();
  }

  wireEvents() {
    this.ws.on('lobbyState', (state) => this.updateLobby(state));
  }

  setPresence(inLobby) {
    if (!this.ws || typeof this.ws.send !== 'function') return;
    if (this._presence === inLobby) return;
    this._presence = inLobby;
    this.ws.send({ type: 'presence', payload: { inLobby: !!inLobby } });
  }

  updateLobby(state) {
    if (!state) return;
    
    const { players = [], gameState = {} } = state;
    const visiblePlayers = players.filter(p => p && p.inLobby !== false);
    const playerListEl = document.getElementById('lobby-players');
    const messageEl = document.getElementById('lobby-message');
    const countdownEl = document.getElementById('lobby-countdown');
    
    // Update player slots (keep consistent 4 slots)
    if (playerListEl) {
      const slots = playerListEl.querySelectorAll('.lobby-slot');
      for (let i = 0; i < slots.length; i++) {
        const slotEl = slots[i];
        const p = visiblePlayers[i];
        if (p) {
          // show numbered slot and player name
          const num = i + 1;
          if (p.id === this.ws.id) {
            slotEl.innerHTML = `<span class="lobby-slot-num">${num}.</span> <span class="lobby-player-you">${escapeHtml(p.nickname)}</span>`;
          } else {
            slotEl.innerHTML = `<span class="lobby-slot-num">${num}.</span> <span class="lobby-player-name">${escapeHtml(p.nickname)}</span>`;
          }
          slotEl.style.display = '';
          slotEl.classList.add('occupied');
          slotEl.classList.remove('empty');
        } else {
          // hide empty slots
          slotEl.style.display = 'none';
          slotEl.classList.remove('occupied');
          slotEl.classList.add('empty');
        }
      }
    }

    // Update status message
    const count = visiblePlayers.length;
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
      this.setPresence(false);
      this.hide();
      if (this.onGameStart) this.onGameStart(state);
    }
  }

  hide() {
    if (this.lobbyElement) {
      // use fade-out class to match instructions modal
      this.lobbyElement.classList.add('fade-out');
      setTimeout(() => {
        try { this.lobbyElement.style.display = 'none'; } catch (e) {}
      }, 300);
    }
  }

  show() {
    if (this.lobbyElement) {
      this.lobbyElement.style.display = '';
      this.lobbyElement.classList.remove('fade-out');
    }
    this.setPresence(true);
  }

  destroy() {
    if (this.lobbyElement) {
      this.lobbyElement.remove();
      this.lobbyElement = null;
    }
  }
}

export default LobbyUI;
