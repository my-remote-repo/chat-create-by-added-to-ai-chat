// scripts/socket-server.js
const { startSocketServer } = require('../src/lib/socket-service');

console.log('Starting standalone Socket.io server...');
const io = startSocketServer();

if (io) {
  console.log('Socket.io server is running on port 3001');
} else {
  console.error('Failed to start Socket.io server');
}
