// Person 4: WebSocket Server
// TODO: Implement Node.js WebSocket server for multiplayer

// Requirements:
// - WebSocket server setup
// - Handle multiple client connections
// - Broadcast game state updates
// - Handle chat messages
// - Room/lobby management
// - Player synchronization
const WebSocket = require('ws');

const PORT = process.env.WS_PORT || 8081;

const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`WebSocket server listening on ws://localhost:${PORT}`);
});

// Lobby management
const lobbies = new Map();

function ensureLobby(name = 'main') {
  if (!lobbies.has(name)) {
    lobbies.set(name, {
      players: new Map(), // id => { id, nickname }
      chatHistory: [],
      gameState: { state: 'lobby' },
      // Lobby timing & configuration
      _waitTimer: null,
      _countdownInterval: null,
      _countdownTimer: null,
      minPlayers: 2,
      maxPlayers: 4,
      waitDurationMs: 20 * 1000, // 20 seconds before countdown
      countdownMs: 10 * 1000 // 10 seconds to start
    });
  }
  return lobbies.get(name);
}

// Helper: broadcast to players in the same lobby
function broadcastToLobby(lobbyName, msgObj) {
  const data = JSON.stringify(msgObj);
  const lobby = lobbies.get(lobbyName);
  if (!lobby) return;
  lobby.players.forEach((playerMeta, id) => {
    const ws = playerMeta.ws;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(data);
  });
}

// Helper: cleanup timers for a lobby
function cleanupLobbyTimers(lobby) {
  if (!lobby) return;
  if (lobby._waitTimer) { clearTimeout(lobby._waitTimer); lobby._waitTimer = null; }
  if (lobby._countdownTimer) { clearTimeout(lobby._countdownTimer); lobby._countdownTimer = null; }
  if (lobby._countdownInterval) { clearInterval(lobby._countdownInterval); lobby._countdownInterval = null; }
}

// Start the 10s countdown and broadcast periodic updates
function startLobbyCountdown(lobbyName) {
  const lobby = lobbies.get(lobbyName);
  if (!lobby) return;
  cleanupLobbyTimers(lobby);
  let remaining = Math.floor(lobby.countdownMs / 1000);
  lobby.gameState = { state: 'starting', countdown: remaining };
  broadcastToLobby(lobbyName, { type: 'lobbyState', payload: { players: Array.from(lobby.players.values()).map(p => ({ id: p.id, nickname: p.nickname })), gameState: lobby.gameState } });
  lobby._countdownInterval = setInterval(() => {
    remaining -= 1;
    lobby.gameState.countdown = remaining;
    broadcastToLobby(lobbyName, { type: 'lobbyState', payload: { players: Array.from(lobby.players.values()).map(p => ({ id: p.id, nickname: p.nickname })), gameState: lobby.gameState } });
  }, 1000);
  lobby._countdownTimer = setTimeout(() => {
    cleanupLobbyTimers(lobby);
    startGameForLobby(lobbyName);
  }, lobby.countdownMs);
}

function startGameForLobby(lobbyName) {
  const lobby = lobbies.get(lobbyName);
  if (!lobby) return;
  lobby.gameState = { state: 'playing', startedAt: Date.now() };
  broadcastToLobby(lobbyName, { type: 'lobbyState', payload: { players: Array.from(lobby.players.values()).map(p => ({ id: p.id, nickname: p.nickname })), gameState: lobby.gameState } });
}

function evaluateLobbyStart(lobbyName) {
  const lobby = lobbies.get(lobbyName);
  if (!lobby) return;
  const count = lobby.players.size;
  if (count >= lobby.maxPlayers) {
    // start countdown immediately
    startLobbyCountdown(lobbyName);
    return;
  }
  if (count >= lobby.minPlayers && !lobby._waitTimer && (!lobby._countdownTimer && !lobby._countdownInterval)) {
    // start wait timer for waitDuration before starting countdown
    lobby._waitTimer = setTimeout(() => {
      startLobbyCountdown(lobbyName);
    }, lobby.waitDurationMs);
    lobby.gameState = { state: 'waiting', waitEndsAt: Date.now() + lobby.waitDurationMs };
    broadcastToLobby(lobbyName, { type: 'lobbyState', payload: { players: Array.from(lobby.players.values()).map(p => ({ id: p.id, nickname: p.nickname })), gameState: lobby.gameState } });
    return;
  }
  // Not enough players -> ensure cleared
  if (count < lobby.minPlayers) {
    cleanupLobbyTimers(lobby);
    lobby.gameState = { state: 'lobby' };
    broadcastToLobby(lobbyName, { type: 'lobbyState', payload: { players: Array.from(lobby.players.values()).map(p => ({ id: p.id, nickname: p.nickname })), gameState: lobby.gameState } });
  }
}

wss.on('connection', (ws, req) => {
  console.log('client connected');
  // Assign a short unique id
  ws.id = Math.random().toString(36).slice(2, 9);
  // default lobby
  ws.lobby = 'main';
  const lobby = ensureLobby(ws.lobby);

  function removePlayer() {
    const l = lobbies.get(ws.lobby);
    if (!l) return;
    if (l.players.has(ws.id)) {
      l.players.delete(ws.id);
      broadcastToLobby(ws.lobby, { type: 'playerLeft', payload: { id: ws.id } });
    }
  }

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }
    if (!msg || !msg.type) return;

    // Handle join (initial) message
    if (msg.type === 'join' && msg.payload && msg.payload.nickname) {
      ws.nickname = String(msg.payload.nickname).slice(0, 32);
      // register player in lobby
      lobby.players.set(ws.id, { id: ws.id, nickname: ws.nickname, ws });
      //send the client his assigned id
      ws.send(JSON.stringify({ type: 'joined', payload: { id: ws.id, nickname: ws.nickname } }));
      // send lobby state and chat history
      ws.send(JSON.stringify({ type: 'lobbyState', payload: { players: Array.from(lobby.players.values()).map(p => ({ id: p.id, nickname: p.nickname })), gameState: lobby.gameState } }));
      if (lobby.chatHistory.length) {
        ws.send(JSON.stringify({ type: 'chatHistory', payload: lobby.chatHistory }));
      }
      // broadcast to others
      broadcastToLobby(ws.lobby, { type: 'playerJoined', payload: { id: ws.id, nickname: ws.nickname } });
      // log join event
      console.log(`[LOBBY] Player joined: ${ws.nickname} (${ws.id}) | Total: ${lobby.players.size}`);
      // evaluate lobby start logic
      evaluateLobbyStart(ws.lobby);
      return;
    }

    // Chat messages
    if (msg.type === 'chat' && msg.payload) {
      const payload = { author: msg.payload.author || ws.nickname || 'unknown', text: String(msg.payload.text || ''), ts: msg.payload.ts || Date.now(), id: ws.id };
      // store in history with simple limit
      lobby.chatHistory.push(payload);
      if (lobby.chatHistory.length > 100) lobby.chatHistory.shift();
      // broadcast chat
      broadcastToLobby(ws.lobby, { type: 'chat', payload });
      return;
    }

    // Player actions (movement, bombs, etc.)
    if (msg.type === 'action' && msg.payload) {
      // attach sender id and broadcast
      const payload = Object.assign({}, msg.payload, { playerId: ws.id });
      const out = { type: 'action', payload };
      // Update lobby gameState players positions for move actions
      try {
        if (!lobby.gameState.players) lobby.gameState.players = {};
        if (payload.type === 'move') {
          lobby.gameState.players[ws.id] = { id: ws.id, row: payload.row, col: payload.col, x: payload.x, y: payload.y, lastUpdate: Date.now() };
        } else if (payload.type === 'placeBomb') {
          // store event array for clients
          lobby.gameState.events = lobby.gameState.events || [];
          lobby.gameState.events.push({ type: 'placeBomb', by: ws.id, row: payload.row, col: payload.col, ts: Date.now() });
          if (lobby.gameState.events.length > 200) lobby.gameState.events.shift();
        }
      } catch (err) {
        console.warn('failed to update gameState', err && err.message);
      }
      // broadcast action to clients
      broadcastToLobby(ws.lobby, out);
      return;
    }

    // State sync (e.g., authoritative updates)
    if (msg.type === 'stateSync' && msg.payload) {
      lobby.gameState = msg.payload;
      broadcastToLobby(ws.lobby, { type: 'stateSync', payload: msg.payload });
      return;
    }
  });

  ws.on('close', () => {
    const leftName = ws.nickname || ws.id;
    removePlayer();
    // Re-evaluate start logic
    evaluateLobbyStart(ws.lobby);
    console.log(`[LOBBY] Player left: ${leftName} (${ws.id}) | Total: ${lobby.players.size}`);
  });
  ws.on('error', (err) => console.warn('ws error', err && err.message));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception in ws-server:', err && err.stack);
});
