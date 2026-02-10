// WebSocketManager: a small wrapper around WebSocket for multiplayer
export class WebSocketManager {
  constructor({ host = 'localhost:8081', path = '/ws' } = {}) {
    const protocol = (location && location.protocol === 'https:') ? 'wss://' : 'ws://';
    this.url = protocol + host + (path.startsWith('/') ? path : '/' + path);
    this.ws = null;
    this.nickname = null;
    this.id = null;
    this.handlers = new Map(); // type => [fn]
    this._reconnectAttempts = 0;
    this._maxReconnects = 5;
  }

  on(type, handler) {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type).push(handler);
  }

  off(type, handler) {
    const arr = this.handlers.get(type) || [];
    this.handlers.set(type, arr.filter(fn => fn !== handler));
  }

  _dispatch(type, payload) {
    (this.handlers.get(type) || []).forEach(fn => {
      try { fn(payload); } catch (err) { console.warn('handler error', err); }
    });
  }

  connect(nickname) {
    this.nickname = nickname || 'Player';
    this.ws = new WebSocket(this.url);

    this.ws.addEventListener('open', () => {
      this._reconnectAttempts = 0;
      this._dispatch('connected');
      // ensure a persistent client id so multiple tabs from same browser reuse identity
      let clientId = localStorage.getItem('mp_client_id');
      if (!clientId) {
        clientId = Math.random().toString(36).slice(2, 10);
        try { localStorage.setItem('mp_client_id', clientId); } catch (e) { /* ignore */ }
      }
      // send join message with persistent client id
      this.send({ type: 'join', payload: { nickname: this.nickname, clientId } });
    });

    this.ws.addEventListener('message', (e) => {
      let data;
      try { data = JSON.parse(e.data); } catch (err) { return; }
      if (!data || !data.type) return;
      switch (data.type) {
        case 'joined':
          this.id = data.payload && data.payload.id;
          this._dispatch('joined', data.payload);
          break;
        case 'chat':
          this._dispatch('chat', data.payload);
          break;
        case 'chatHistory':
          this._dispatch('chatHistory', data.payload);
          break;
        case 'playerJoined':
          this._dispatch('playerJoined', data.payload);
          break;
        case 'playerLeft':
          this._dispatch('playerLeft', data.payload);
          break;
        case 'lobbyState':
          this._dispatch('lobbyState', data.payload);
          break;
        case 'action':
          this._dispatch('action', data.payload);
          break;
        case 'stateSync':
          this._dispatch('stateSync', data.payload);
          break;
        case 'mapSync':
          this._dispatch('mapSync', data.payload);
          break;
        case 'pause':
          this._dispatch('pause', data.payload);
          break;
        default:
          this._dispatch('message', data);
      }
    });

    this.ws.addEventListener('close', () => {
      this._dispatch('disconnected');
      // try to reconnect
      if (this._reconnectAttempts < this._maxReconnects) {
        setTimeout(() => { this._reconnectAttempts++; this.connect(this.nickname); }, 1000 * Math.min(5, this._reconnectAttempts + 1));
      }
    });

    this.ws.addEventListener('error', (err) => {
      console.warn('WebSocket error', err);
      this._dispatch('error', err);
    });
  }

  disconnect() {
    try { if (this.ws) this.ws.close(); } catch (err) { /* ignore */ }
    this.ws = null;
  }

  send(obj) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    try { this.ws.send(JSON.stringify(obj)); return true; } catch (err) { console.warn('send error', err); return false; }
  }

  sendAction(action) { return this.send({ type: 'action', payload: action }); }
  sendChat(text) { return this.send({ type: 'chat', payload: { author: this.nickname, text, ts: Date.now() } }); }
  sendState(state) { return this.send({ type: 'stateSync', payload: state }); }
}

export default WebSocketManager;
// Person 4: WebSocket Integration
// TODO: Implement WebSocketManager class for multiplayer communication

// Requirements:
// - WebSocket connection setup
// - Send/receive player actions (movement, bomb placement)
// - Game state synchronization between clients
// - Handle player connect/disconnect
// - Real-time game updates
// - Methods: connect(), sendAction(), receiveUpdate(), handlePlayerJoin(), handlePlayerLeave(), syncGameState()