// Person 1: Game UI System  
// Implements GameUI class for in-game interface

export class GameUI {
    constructor() {
        this.container = this.createOverlayContainer();
    }

    createOverlayContainer() {
        let container = document.getElementById('game-ui-overlay');
        if (!container) {
            container = document.createElement('div');
            container.id = 'game-ui-overlay';
            container.className = 'game-ui-overlay';
            document.body.appendChild(container);
        }
        return container;
    }

    renderPlayerInfo(playerName, lives, score) {
        const info = document.getElementById('player-info');
        if (info) {
            info.innerHTML = `
                <div class="info-item">Nickname: ${playerName}</div>
                <div class="info-item">Lives: ${lives}</div>
                <div class="info-item">Score: ${score}</div>
            `;
        }
    }

    updateLives(livesCount) {
        const livesEl = document.querySelector('.info-item:contains("Lives")');
        if (livesEl) {
            livesEl.textContent = `Lives: ${livesCount}`;
        }
    }

    updateTimer(timeRemaining) {
        const timerEl = document.getElementById('game-timer');
        if (timerEl) {
            timerEl.textContent = `Time: ${timeRemaining}s`;
        }
    }

    showGameStatus(status) {
        const statusEl = document.getElementById('game-status');
        if (statusEl) {
            statusEl.textContent = status;
        }
    }

    renderUI() {
        // Main UI rendering
        const uiHTML = `
            <div id="player-info" class="player-info"></div>
            <div id="game-timer" class="game-timer">Time: 0s</div>
            <div id="game-status" class="game-status"></div>
        `;
        this.container.innerHTML = uiHTML;
    }

    showEndGame(reason, title, message) {
        const modal = document.createElement('div');
        modal.className = 'end-game-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>${title}</h2>
                <p>${message}</p>
                <button id="restart-btn" class="btn-primary">Play Again</button>
            </div>
        `;
        this.container.appendChild(modal);

        document.getElementById('restart-btn')?.addEventListener('click', () => {
            location.reload();
        });
    }
}