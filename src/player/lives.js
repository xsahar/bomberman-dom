// LivesUI.js
// This handles the hearts display for a player

export class LivesUI {
    constructor({ parentElement, maxLives = 3 }) {
        this.parentElement = parentElement;
        this.maxLives = maxLives;
        this.currentLives = maxLives;
        this.container = null;

        this.createUI();
    }

    createUI() {
        // Create a container for hearts
        this.container = document.createElement('div');
        // use the existing `player-lives` styles
        this.container.className = 'player-lives';
        this.parentElement.appendChild(this.container);

        // Create heart elements
        this.renderHearts();
    }

    renderHearts() {
        // Clear existing
        this.container.innerHTML = '';

        for (let i = 0; i < this.currentLives; i++) {
            const heart = document.createElement('span');
            heart.innerHTML = '❤️';
            heart.className = 'heart';
            this.container.appendChild(heart);
        }
    }

    loseLife() {
        if (this.currentLives <= 0) return true; // Already dead
        this.currentLives--;
        this.renderHearts();
        return this.currentLives <= 0; // Return true if dead
    }

    gainLife() {
        if (this.currentLives >= this.maxLives) return false;
        this.currentLives++;
        this.renderHearts();
        return true;
    }

    resetLives() {
        this.currentLives = this.maxLives;
        this.renderHearts();
    }
}
