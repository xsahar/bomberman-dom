// Pause Menu System with multiplayer sync
export class PauseMenu {
  constructor({ onResume, onRestart, onExit, wsManager } = {}) {
    this.onResume = onResume;
    this.onRestart = onRestart;
    this.onExit = onExit;
    this.wsManager = wsManager;
    this.isPaused = false;
    this.overlay = null;
    this.container = null;

    this.setupKeyListener();
  }

  setupKeyListener() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        if (this.isPaused) {
          this.resume();
        } else {
          this.pause();
        }
      }
    });
  }

  pause() {
    if (this.isPaused) return;
    this.isPaused = true;

    // Clear player keys to stop any ongoing movement
    if (window.player && window.player.keys) {
      window.player.keys = {};
    }

    // Broadcast pause to all players
    if (this.wsManager && this.wsManager.ws && this.wsManager.ws.readyState === 1) {
      this.wsManager.send({
        type: 'pause',
        payload: { action: 'pause', playerId: this.wsManager.id }
      });
    }

    this.showPauseMenu();
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;

    // Broadcast resume to all players
    if (this.wsManager && this.wsManager.ws && this.wsManager.ws.readyState === 1) {
      this.wsManager.send({
        type: 'pause',
        payload: { action: 'resume', playerId: this.wsManager.id }
      });
    }

    this.hidePauseMenu();
    if (this.onResume) this.onResume();
  }

  showPauseMenu() {
    // Remove existing overlay if any
    if (this.overlay) this.overlay.remove();

    this.overlay = document.createElement('div');
    this.overlay.className = 'pause-overlay active';
    this.overlay.innerHTML = `
      <div class="pause-menu-container">
        <div class="pause-menu">
          <div class="pause-header">PAUSE</div>
          <div class="pause-buttons">
            <button class="pause-btn resume-btn" id="pause-resume">RESUME</button>
            <button class="pause-btn restart-btn" id="pause-restart">RESTART</button>
            <button class="pause-btn exit-btn" id="pause-exit">EXIT</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    // Button event listeners
    const resumeBtn = this.overlay.querySelector('#pause-resume');
    const restartBtn = this.overlay.querySelector('#pause-restart');
    const exitBtn = this.overlay.querySelector('#pause-exit');

    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => this.resume());
    }

    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.isPaused = false;
        if (this.overlay) this.overlay.remove();
        if (this.onRestart) this.onRestart();
      });
    }

    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        this.isPaused = false;
        if (this.overlay) this.overlay.remove();
        if (this.onExit) this.onExit();
      });
    }
  }

  hidePauseMenu() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
      setTimeout(() => {
        if (this.overlay) this.overlay.remove();
        this.overlay = null;
      }, 300);
    }
  }

  // Called when receiving pause message from other players
  remotePause() {
    if (this.isPaused) return;
    this.isPaused = true;
    this.showPauseMenu();
  }

  // Called when receiving resume message from other players
  remoteResume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.hidePauseMenu();
    if (this.onResume) this.onResume();
  }
}
