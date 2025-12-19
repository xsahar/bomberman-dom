// Handles lobby screen display and game state transitions

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
      <div class="lobby-container">
        <h1>🎮 Bomberman Lobby</h1>
        <div class="lobby-content">
          <div class="player-list">
            <h3>Players in Lobby</h3>
            <div id="lobby-players"></div>
          </div>
          <div class="lobby-status">
            <div id="lobby-message">Waiting for players...</div>
            <div id="lobby-countdown"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.lobbyElement);
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
    
    // Update player list
    if (playerListEl) {
      playerListEl.innerHTML = players.map(p => 
        `<div class="lobby-player">${p.nickname} ${p.id === this.ws.id ? '(You)' : ''}</div>`
      ).join('');
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
