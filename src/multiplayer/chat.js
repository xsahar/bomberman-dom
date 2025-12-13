// Escape HTML - small helper
function escapeHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

// ChatManager: simple chat UI and integration with WebSocketManager
export class ChatManager {
  constructor(wsManager, container = document.getElementById('app'), opts = {}) {
    this.wsManager = wsManager;
    this.container = container;
    this.containerClasses = ['chat-container'];
    this.collapsed = !!opts.collapsed;
    this.unread = 0;
    this._initUI();
    this._setupHandlers();
  }

  _initUI() {
    // create chat markup
    this.chatEl = document.createElement('div');
    this.chatEl.className = 'chat-container';
    this.chatEl.innerHTML = `
      <div class="chat-header">
        <div class="chat-title">Chat</div>
        <div class="chat-controls">
          <button class="chat-toggle">_</button>
        </div>
      </div>
      <div class="chat-messages"></div>
      <div class="chat-input-row">
        <input class="chat-input" placeholder="Type a message..." />
        <button class="chat-send">Send</button>
      </div>
    `;
    this.container.appendChild(this.chatEl);
    this.messagesEl = this.chatEl.querySelector('.chat-messages');
    this.inputEl = this.chatEl.querySelector('.chat-input');
    this.sendBtn = this.chatEl.querySelector('.chat-send');
    this.toggleBtn = this.chatEl.querySelector('.chat-toggle');
    this.titleEl = this.chatEl.querySelector('.chat-title');
    if (this.collapsed) this.chatEl.classList.add('collapsed');
    this.inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') this._onSend(); });
    this.sendBtn.addEventListener('click', () => this._onSend());
    this.toggleBtn.addEventListener('click', () => this._toggle());
  }

  _setupHandlers() {
    // When a chat received from ws
    this.wsManager.on('chat', (payload) => this.displayMessage(payload.author, payload.text, payload.ts, payload.id));
    this.wsManager.on('chatHistory', (arr) => { arr.forEach(m => this.displayMessage(m.author, m.text, m.ts, m.id)); });
    this.wsManager.on('joined', (payload) => { this.meId = payload && payload.id; });
    this.wsManager.on('disconnected', () => { this.meId = null; });
    // Show join/leave events as system messages
    this.wsManager.on('playerJoined', (payload) => {
      if (payload && payload.nickname) {
        this.displaySystemMessage(`${escapeHtml(payload.nickname)} joined the lobby.`);
      }
    });
    this.wsManager.on('playerLeft', (payload) => {
      if (payload && payload.id) {
        // Try to show nickname if possible
        const leftPlayer = (this.wsManager._playersList || []).find(p => p.id === payload.id);
        const name = leftPlayer ? leftPlayer.nickname : payload.id;
        this.displaySystemMessage(`${escapeHtml(name)} left the lobby.`);
      }
    });
    // Optionally, keep a local player list for better left messages
    this.wsManager.on('lobbyState', (payload) => {
      if (payload && payload.players) this.wsManager._playersList = payload.players;
    });
  }
  displaySystemMessage(text) {
    const el = document.createElement('div');
    el.className = 'msg system-msg';
    el.innerHTML = `<span class="system">${text}</span>`;
    this.messagesEl.appendChild(el);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  _onSend() {
    const text = this.inputEl.value.trim();
    if (!text) return;
    this.wsManager.sendChat(text);
    this.inputEl.value = '';
  }

  displayMessage(author, text, ts, id) {
    const a = escapeHtml(author || 'unknown');
    const t = escapeHtml(text || '');
    const d = new Date(ts || Date.now());
    const el = document.createElement('div');
    el.className = 'msg';
    if (id && this.meId && id === this.meId) el.classList.add('me');
    el.innerHTML = `<span class="author">${a}</span> <span class="text">${t}</span> <span class="ts">${d.toLocaleTimeString()}</span>`;
    this.messagesEl.appendChild(el);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    if (this.chatEl.classList.contains('collapsed')) {
      this.unread++;
      this._updateUnread();
    }
  }

  _updateUnread() {
    if (!this.unread) {
      this.titleEl.textContent = 'Chat';
      this.toggleBtn.title = 'Toggle chat';
      return;
    }
    this.titleEl.textContent = `Chat (${this.unread})`;
    this.toggleBtn.title = `Toggle chat — ${this.unread} unread`;
  }

  _toggle() {
    const collapsed = this.chatEl.classList.toggle('collapsed');
    if (!collapsed) { this.unread = 0; this._updateUnread(); }
  }
}

export default ChatManager;
// Person 4: Chat System
// TODO: Implement ChatManager class for in-game chat

// Requirements:
// - Real-time chat functionality using WebSockets
// - Message sending and receiving
// - Chat UI integration
// - Message history display
// - Player nickname display in messages
// - Methods: sendMessage(), receiveMessage(), displayMessage(), clearChat(), renderChatUI()