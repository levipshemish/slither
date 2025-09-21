const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL, "https://your-actual-vercel-app.vercel.app"]
      : "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Game state
const gameState = {
  players: new Map(),
  food: [],
  gameWidth: 4000,
  gameHeight: 4000,
  maxFood: 200
};

// Game utilities
function getRandomColor() {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getDistance(pos1, pos2) {
  return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
}

function generateFood() {
  return {
    id: Math.random().toString(36).substr(2, 9),
    x: Math.random() * gameState.gameWidth,
    y: Math.random() * gameState.gameHeight,
    color: getRandomColor(),
    value: 1
  };
}

// Initialize food
function initializeFood() {
  for (let i = 0; i < gameState.maxFood; i++) {
    gameState.food.push(generateFood());
  }
}

// Game logic
function updatePlayers() {
  gameState.players.forEach((player) => {
    // Update player position based on direction
    const speed = 3;
    player.x += player.direction.x * speed;
    player.y += player.direction.y * speed;
    
    // Boundary checking with wrapping
    if (player.x < 0) player.x = gameState.gameWidth;
    if (player.x > gameState.gameWidth) player.x = 0;
    if (player.y < 0) player.y = gameState.gameHeight;
    if (player.y > gameState.gameHeight) player.y = 0;
    
    // Update segments (body) to follow the head
    if (player.direction.x !== 0 || player.direction.y !== 0) {
      // Store previous head position
      const prevX = player.x - player.direction.x * 3;
      const prevY = player.y - player.direction.y * 3;
      
      // Add previous head position as new segment
      player.segments.unshift({ 
        x: prevX, 
        y: prevY, 
        timestamp: Date.now()
      });
      
      // Calculate desired length based on score (minimum 4 segments)
      const desiredLength = Math.max(4, Math.floor(player.score / 2) + 4);
      
      // Trim segments to desired length
      while (player.segments.length > desiredLength) {
        player.segments.pop();
      }
    }
    
    // Check food collision
    checkFoodCollision(player);
    
    // Check collision with other players
    checkPlayerCollisions(player);
  });
}

function checkFoodCollision(player) {
  gameState.food.forEach((food, index) => {
    const distance = getDistance(player, food);
    
    if (distance < 18) {
      // Player ate food
      player.score += food.value;
      player.length = Math.max(5, Math.floor(player.score / 2) + 5); // Grow based on score
      
      // Remove eaten food and generate new one
      gameState.food.splice(index, 1);
      gameState.food.push(generateFood());
    }
  });
}

function checkPlayerCollisions(currentPlayer) {
  gameState.players.forEach((otherPlayer) => {
    if (currentPlayer.id === otherPlayer.id) return;
    
    // Check collision with other player's head
    const headDistance = getDistance(currentPlayer, otherPlayer);
    if (headDistance < 30) {
      // Collision detected - respawn current player
      respawnPlayer(currentPlayer);
      return;
    }
    
    // Check collision with other player's segments
    otherPlayer.segments.forEach((segment) => {
      const segmentDistance = getDistance(currentPlayer, segment);
      if (segmentDistance < 20) {
        respawnPlayer(currentPlayer);
        return;
      }
    });
  });
}

function respawnPlayer(player) {
  // Reset player position and stats
  const newX = Math.random() * gameState.gameWidth;
  const newY = Math.random() * gameState.gameHeight;
  
  player.x = newX;
  player.y = newY;
  player.score = 0;
  player.length = 5;
  player.maxSegments = 5;
  player.segments = [
    { x: newX - 20, y: newY },
    { x: newX - 40, y: newY },
    { x: newX - 60, y: newY },
    { x: newX - 80, y: newY }
  ];
  player.direction = { x: 0, y: 0 };
  player.headSize = 18;
  
  // Notify the player of respawn
  io.to(player.id).emit('playerRespawned');
}

// Socket connection handling
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  socket.on('joinGame', (playerData) => {
    console.log('Player joining:', playerData.name);
    
    // Initialize new player
    const startX = Math.random() * gameState.gameWidth;
    const startY = Math.random() * gameState.gameHeight;
    
    const player = {
      id: socket.id,
      name: playerData.name || 'Anonymous',
      x: startX,
      y: startY,
      segments: [
        { x: startX - 20, y: startY },
        { x: startX - 40, y: startY },
        { x: startX - 60, y: startY },
        { x: startX - 80, y: startY }
      ],
      direction: { x: 0, y: 0 },
      score: 0,
      length: 5,
      maxSegments: 5,
      headSize: 18,
      color: getRandomColor()
    };
    
    gameState.players.set(socket.id, player);
    
    // Send initial game state to the new player
    socket.emit('gameJoined', { 
      playerId: socket.id, 
      gameState: {
        players: Array.from(gameState.players.values()),
        food: gameState.food,
        gameWidth: gameState.gameWidth,
        gameHeight: gameState.gameHeight
      }
    });
    
    // Notify other players
    socket.broadcast.emit('playerJoined', player);
  });
  
  socket.on('updateDirection', (direction) => {
    const player = gameState.players.get(socket.id);
    if (player) {
      // Normalize direction
      const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      if (magnitude > 0) {
        player.direction = {
          x: direction.x / magnitude,
          y: direction.y / magnitude
        };
      }
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    gameState.players.delete(socket.id);
    socket.broadcast.emit('playerLeft', socket.id);
  });
});

// Game loop
function gameLoop() {
  updatePlayers();
  
  // Send game state to all players
  const gameStateForClients = {
    players: Array.from(gameState.players.values()),
    food: gameState.food
  };
  
  io.emit('gameUpdate', gameStateForClients);
}

// Initialize game
initializeFood();

// Start game loop (60 FPS)
setInterval(gameLoop, 1000 / 60);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    players: gameState.players.size,
    food: gameState.food.length 
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🐍 Slither.io Server running on port ${PORT}`);
  console.log(`Players: ${gameState.players.size}, Food: ${gameState.food.length}`);
});