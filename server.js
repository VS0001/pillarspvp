const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public'));

let players = {};

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Initialize new player
  players[socket.id] = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    username: 'Player',
    // Additional player properties
  };

  // Send existing players to the new player
  socket.emit('currentPlayers', players);

  // Notify other players of the new player
  socket.broadcast.emit('newPlayer', { id: socket.id, ...players[socket.id] });

  // Handle player movement
  socket.on('playerMovement', (movementData) => {
    if (players[socket.id]) {
      players[socket.id].position = movementData.position;
      players[socket.id].rotation = movementData.rotation;
      socket.broadcast.emit('playerMoved', { id: socket.id, ...players[socket.id] });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
