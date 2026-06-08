const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Game state storage (in-memory + file persistence)
const SAVE_FILE = path.join(__dirname, 'savedata.json');

function loadGame() {
  if (fs.existsSync(SAVE_FILE)) {
    return JSON.parse(fs.readFileSync(SAVE_FILE, 'utf8'));
  }
  return null;
}

function saveGame(state) {
  fs.writeFileSync(SAVE_FILE, JSON.stringify(state, null, 2));
}

app.get('/api/save', (req, res) => {
  const data = loadGame();
  res.json(data || { exists: false });
});

app.post('/api/save', (req, res) => {
  saveGame(req.body);
  res.json({ ok: true });
});

// WebSocket for real-time multiplayer
wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    const data = JSON.parse(msg);
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === 1) {
        client.send(JSON.stringify(data));
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🏪 SuperMarket Simulator running at http://localhost:${PORT}`);
});
