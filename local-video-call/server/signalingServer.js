const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 3000 });

server.on('connection', (socket) => {
  console.log('New connection');

  // Broadcast signaling data to all clients except the sender
  socket.on('message', (message) => {
    server.clients.forEach(client => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  socket.on('close', () => {
    console.log('Connection closed');
  });
});

console.log('Signaling server is running on ws://localhost:3000');
