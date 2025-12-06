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

wss.on('connection', (ws) => {
  console.log('client connected');

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }

    if (!msg || !msg.type) return;

    if (msg.type === 'chat' && msg.payload) {
      const out = JSON.stringify({ type: 'chat', payload: msg.payload });
      // broadcast to all connected clients
      wss.clients.forEach((c) => {
        if (c.readyState === WebSocket.OPEN) c.send(out);
      });
    }
  });

  ws.on('close', () => console.log('client disconnected'));
  ws.on('error', (err) => console.warn('ws error', err && err.message));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception in ws-server:', err && err.stack);
});
