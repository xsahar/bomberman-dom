
export class GameInstructions {
    constructor() {
        this.modal = null;
    }

    show() {
        return new Promise((resolve) => {
            this.modal = document.createElement('div');
            this.modal.className = 'instructions-overlay';
            this.modal.innerHTML = `
                <div class="instructions-modal">
                    <div class="instructions-header">
                        <h1>🎮 How to Play Bomberman</h1>
                        <button class="close-btn" aria-label="Close">×</button>
                    </div>
                    
                    <div class="instructions-content">
                        <section class="instruction-section">
                            <h2>🎯 Objective</h2>
                            <p>Defeat your opponents by placing bombs to destroy them. Avoid explosions and collect power-ups to increase your abilities!</p>
                        </section>

                        <section class="instruction-section">
                            <h2>⌨️ Controls</h2>
                            <div class="controls-grid">
                                <div class="control-item">
                                    <span class="control-key">↑ </span>
                                    <span class="control-desc">Move Up</span>
                                </div>
                                <div class="control-item">
                                    <span class="control-key"> ↓ </span>
                                    <span class="control-desc">Move Down</span>
                                </div>
                                <div class="control-item">
                                    <span class="control-key"> ← </span>
                                    <span class="control-desc">Move Left</span>
                                </div>
                                <div class="control-item">
                                    <span class="control-key"> → </span>
                                    <span class="control-desc">Move Right</span>
                                </div>
                                <div class="control-item">
                                    <span class="control-key">SPACE</span>
                                    <span class="control-desc">Place Bomb</span>
                                </div>
                                <div class="control-item">
                                    <span class="control-key">  Esc </span>
                                    <span class="control-desc">Pause / Resume</span>
                                </div>
                            </div>
                        </section>

                        <section class="instruction-section">
                            <h2>💣 Game Mechanics</h2>
                            <ul class="mechanics-list">
                                <li><strong>Bombs:</strong> Place bombs with SPACE. They explode after a few seconds, destroying walls and defeating enemies.</li>
                                <li><strong>Explosions:</strong> Avoid explosions or you lose a life. Cover your face or take shelter quickly!</li>
                                <li><strong>Power-ups:</strong> Collect power-ups from destroyed walls to boost your abilities:
                                    <ul>
                                        <li>🔥 Extra bomb range</li>
                                        <li>➕ Extra bombs to place</li>
                                        <li>👟 Increased speed</li>
                                    </ul>
                                </li>
                                <li><strong>Lives:</strong> You start with 3 lives. Get hit by explosions and lose one!</li>
                            </ul>
                        </section>

                        <section class="instruction-section">
                            <h2>⏰ Gameplay Rules</h2>
                            <ul class="rules-list">
                                <li>The round has a time limit. Defeat opponents before time runs out!</li>
                                <li>You can't move through walls or bombs.</li>
                                <li>Plan your bomb placements carefully to trap enemies.</li>
                                <li>The last player standing wins!</li>
                            </ul>
                        </section>

                        <section class="instruction-section">
                            <h2>💡 Tips & Tricks</h2>
                            <ul class="tips-list">
                                <li>Don't get trapped! Always plan an escape route before placing a bomb.</li>
                                <li>Use walls strategically to protect yourself from explosions.</li>
                                <li>Collect power-ups early to gain an advantage.</li>
                                <li>Watch your enemies' positions and anticipate their movements.</li>
                                <li>Remember: Speed and strategy win the game!</li>
                            </ul>
                        </section>
                    </div>

                    <div class="instructions-footer">
                        <button class="start-btn primary">Start Game</button>
                    </div>
                </div>
            `;

            document.body.appendChild(this.modal);

            // Add event listeners
            const closeBtn = this.modal.querySelector('.close-btn');
            const startBtn = this.modal.querySelector('.start-btn');

            const handleClose = () => {
                this.hide();
                resolve();
            };

            closeBtn.addEventListener('click', handleClose);
            startBtn.addEventListener('click', handleClose);

            // Also close on ESC key
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', handleEsc);
                    handleClose();
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
    }

    /**
     * Hide the instructions modal
     */
    hide() {
        if (this.modal) {
            this.modal.classList.add('fade-out');
            setTimeout(() => {
                if (this.modal && this.modal.parentNode) {
                    this.modal.parentNode.removeChild(this.modal);
                }
                this.modal = null;
            }, 300);
        }
    }
}
