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
      sharedMap: null, // Store first player's map to share with others
      // Lobby timing & configuration
      _waitTimer: null,
      _countdownInterval: null,
      _countdownTimer: null,
      _stateSyncTimer: null,
      minPlayers: 2,
      maxPlayers: 4,
      waitDurationMs: 20 * 1000, // 20 seconds before countdown
      countdownMs: 10 * 1000 // 10 seconds to start
    });
  }
  return lobbies.get(name);
}

// Ensure a nickname is unique within a lobby by appending a numeric suffix when needed
function generateUniqueNickname(lobby, desired) {
  if (!lobby || !desired) return desired || 'Player';
  const taken = new Set(Array.from(lobby.players.values()).map(p => String(p.nickname || '').toLowerCase()));
  let base = String(desired).trim();
  if (base.length === 0) base = 'Player';
  let candidate = base;
  let idx = 1;
  while (taken.has(candidate.toLowerCase())) {
    idx += 1;
    candidate = `${base} (${idx})`;
    if (idx > 1000) break;
  }
  return candidate;
}

// Return a deduplicated list of players for broadcasting (one entry per clientId when present)
function getPlayersForBroadcast(lobby) {
  if (!lobby) return [];
  const seen = new Set();
  const out = [];
  Array.from(lobby.players.values()).forEach(p => {
    if (p && p.inLobby === false) return;
    const key = p.clientId || p.id;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ id: p.id, nickname: p.nickname, clientId: p.clientId, inLobby: true });
  });
  return out.map((p, idx) => ({ id: p.id, nickname: p.nickname, clientId: p.clientId, inLobby: p.inLobby, playerIndex: Math.min(idx, 3) }));
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
  if (lobby._stateSyncTimer) { clearTimeout(lobby._stateSyncTimer); lobby._stateSyncTimer = null; }
}

// Throttled state sync broadcast (avoids spamming on every action)
function scheduleStateSync(lobbyName, delayMs = 250) {
  const lobby = lobbies.get(lobbyName);
  if (!lobby) return;
  if (lobby._stateSyncTimer) return; // already scheduled
  lobby._stateSyncTimer = setTimeout(() => {
    lobby._stateSyncTimer = null;
    const payload = lobby.gameState || {};
    broadcastToLobby(lobbyName, { type: 'stateSync', payload });
  }, delayMs);
}

// Start the 10s countdown and broadcast periodic updates
function startLobbyCountdown(lobbyName) {
  const lobby = lobbies.get(lobbyName);
  if (!lobby) return;
  cleanupLobbyTimers(lobby);
  let remaining = Math.floor(lobby.countdownMs / 1000);
  lobby.gameState = { state: 'starting', countdown: remaining };
  broadcastToLobby(lobbyName, { type: 'lobbyState', payload: { players: getPlayersForBroadcast(lobby), gameState: lobby.gameState } });
  lobby._countdownInterval = setInterval(() => {
    remaining -= 1;
    lobby.gameState.countdown = remaining;
    broadcastToLobby(lobbyName, { type: 'lobbyState', payload: { players: getPlayersForBroadcast(lobby), gameState: lobby.gameState } });
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
  broadcastToLobby(lobbyName, { type: 'lobbyState', payload: { players: getPlayersForBroadcast(lobby), gameState: lobby.gameState } });
  // Broadcast shared map to all players at game start
  if (lobby.sharedMap) {
    broadcastToLobby(lobbyName, { type: 'mapSync', payload: lobby.sharedMap });
  }
}

function evaluateLobbyStart(lobbyName) {
  const lobby = lobbies.get(lobbyName);
  if (!lobby) return;
  const count = Array.from(lobby.players.values()).filter(p => p && p.inLobby !== false).length;
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
    broadcastToLobby(lobbyName, { type: 'lobbyState', payload: { players: getPlayersForBroadcast(lobby), gameState: lobby.gameState } });
    return;
  }
  // Not enough players -> ensure cleared
  if (count < lobby.minPlayers) {
    cleanupLobbyTimers(lobby);
    lobby.gameState = { state: 'lobby' };
    broadcastToLobby(lobbyName, { type: 'lobbyState', payload: { players: getPlayersForBroadcast(lobby), gameState: lobby.gameState } });
  }
}

wss.on('connection', (ws, req) => {
  console.log('client connected');
  // Assign a short unique id
  ws.id = Math.random().toString(36).slice(2, 9);
  
  // Find an available lobby (not playing) or create a new one
  let lobbyName = 'main';
  let lobbyIndex = 1;
  while (true) {
    const existingLobby = lobbies.get(lobbyName);
    if (!existingLobby || existingLobby.gameState.state !== 'playing') {
      break; // Found available lobby
    }
    // Try next lobby
    lobbyName = `main-${lobbyIndex++}`;
  }
  
  ws.lobby = lobbyName;
  const lobby = ensureLobby(ws.lobby);
  console.log(`[LOBBY] Assigned ${ws.id} to lobby: ${lobbyName}`);

  function removePlayer() {
    const l = lobbies.get(ws.lobby);
    if (!l) return;
    if (l.players.has(ws.id)) {
      l.players.delete(ws.id);
      // clean up gameState for this player
      if (l.gameState && l.gameState.players && l.gameState.players[ws.id]) {
        delete l.gameState.players[ws.id];
      }
      // Broadcast updated lobby state to all remaining players
      broadcastToLobby(ws.lobby, { type: 'lobbyState', payload: { players: getPlayersForBroadcast(l), gameState: l.gameState } });
      // push an updated state snapshot after removal
      scheduleStateSync(ws.lobby, 50);
      
      // If lobby is empty and game finished, clean it up
      if (l.players.size === 0 && l.gameState.state === 'playing') {
        cleanupLobbyTimers(l);
        lobbies.delete(ws.lobby);
        console.log(`[LOBBY] Deleted empty lobby: ${ws.lobby}`);
      }
    }
  }

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }
    if (!msg || !msg.type) return;

    // Handle join (initial) message
    if (msg.type === 'join' && msg.payload && msg.payload.nickname) {
      const requested = String(msg.payload.nickname).slice(0, 32);
      const clientId = msg.payload.clientId ? String(msg.payload.clientId).slice(0, 64) : null;
      const ip = (req && req.socket && req.socket.remoteAddress) ? req.socket.remoteAddress : (req && req.headers && req.headers['x-forwarded-for']) || null;

      // Try to find an existing player by clientId first, fall back to matching nickname+ip
      let existing = null;
      if (clientId) {
        existing = Array.from(lobby.players.values()).find(p => p.clientId === clientId);
      }
      if (!existing && !clientId && ip) {
        existing = Array.from(lobby.players.values()).find(p => p.nickname === requested && p.ip === ip);
      }

      if (existing) {
        // reuse nickname from existing entry
        ws.nickname = existing.nickname || requested;
        // remove old entry and replace with this ws (keep single entry per clientId/ip)
        lobby.players.delete(existing.id);
        lobby.players.set(ws.id, { id: ws.id, nickname: ws.nickname, ws, clientId, ip, inLobby: true });
      } else {
        // enforce uniqueness across different clients
        ws.nickname = generateUniqueNickname(lobby, requested).slice(0, 32);
        lobby.players.set(ws.id, { id: ws.id, nickname: ws.nickname, ws, clientId, ip, inLobby: true });
      }
      
      // Assign player index based on join order (0-3 for up to 4 players)
      const playerIndex = Math.min(lobby.players.size - 1, 3);
      
      //send the client his assigned id and playerIndex
      ws.send(JSON.stringify({ 
        type: 'joined', 
        payload: { 
          id: ws.id, 
          nickname: ws.nickname, 
          playerIndex: playerIndex 
        } 
      }));
      // send a state sync snapshot for late joiners
      ws.send(JSON.stringify({ type: 'stateSync', payload: lobby.gameState }));
      // log join event
      console.log(`[LOBBY] Player joined: ${ws.nickname} (${ws.id}) | Index: ${playerIndex} | Total: ${lobby.players.size}`);
      // broadcast updated lobby state to ALL players (including the one who just joined)
      broadcastToLobby(ws.lobby, { type: 'lobbyState', payload: { players: getPlayersForBroadcast(lobby), gameState: lobby.gameState } });
      // evaluate lobby start logic
      evaluateLobbyStart(ws.lobby);
      return;
    }

    // Lobby presence (client reports whether they are on the lobby screen)
    if (msg.type === 'presence' && msg.payload && typeof msg.payload.inLobby === 'boolean') {
      const meta = lobby.players.get(ws.id);
      if (meta) {
        meta.inLobby = msg.payload.inLobby;
        broadcastToLobby(ws.lobby, { type: 'lobbyState', payload: { players: getPlayersForBroadcast(lobby), gameState: lobby.gameState } });
        evaluateLobbyStart(ws.lobby);
      }
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

    // Pause messages (broadcast pause/resume to all players)
    if (msg.type === 'pause' && msg.payload) {
      const payload = Object.assign({}, msg.payload, { playerId: ws.id });
      broadcastToLobby(ws.lobby, { type: 'pause', payload });
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
          lobby.gameState.players[ws.id] = { id: ws.id, row: payload.row, col: payload.col, x: payload.x, y: payload.y, direction: payload.direction, lastUpdate: Date.now() };
        } else if (payload.type === 'placeBomb') {
          // store bomb event for clients
          lobby.gameState.events = lobby.gameState.events || [];
          lobby.gameState.events.push({ type: 'placeBomb', by: ws.id, row: payload.row, col: payload.col, ts: Date.now() });
          if (lobby.gameState.events.length > 200) lobby.gameState.events.shift();
        } else if (payload.type === 'explode') {
          // store explosion event for clients
          lobby.gameState.events = lobby.gameState.events || [];
          lobby.gameState.events.push({ type: 'explode', by: ws.id, row: payload.row, col: payload.col, range: payload.range, ts: Date.now() });
          if (lobby.gameState.events.length > 200) lobby.gameState.events.shift();
        }
      } catch (err) {
        console.warn('failed to update gameState', err && err.message);
      }
      // broadcast action to clients
      broadcastToLobby(ws.lobby, out);
      // schedule a synced snapshot so late joiners catch up
      scheduleStateSync(ws.lobby);
      return;
    }

    // State sync (e.g., authoritative updates)
    if (msg.type === 'stateSync' && msg.payload) {
      lobby.gameState = msg.payload;
      broadcastToLobby(ws.lobby, { type: 'stateSync', payload: msg.payload });
      return;
    }

    // Map sync - first player sends their map to be shared
    if (msg.type === 'mapSync' && msg.payload) {
      if (!lobby.sharedMap) {
        lobby.sharedMap = msg.payload;
        console.log(`[LOBBY] Received shared map from ${ws.nickname}`);
        // broadcast to all other players
        broadcastToLobby(ws.lobby, { type: 'mapSync', payload: msg.payload });
      }
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
