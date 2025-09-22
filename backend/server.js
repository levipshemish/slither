const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
// CORS origins for production and development
const getAllowedOrigins = () => {
  const origins = [];
  
  if (process.env.NODE_ENV === 'production') {
    // Add environment variable if set
    if (process.env.FRONTEND_URL) {
      origins.push(process.env.FRONTEND_URL);
      console.log('🌍 Added FRONTEND_URL to CORS:', process.env.FRONTEND_URL);
    }
    // Add known Vercel URLs (with and without trailing slash)
    origins.push(
      "https://slither-565t.vercel.app",
      "https://slither-565t.vercel.app/",
      "https://slither2-zeta.vercel.app",
      "https://slither2-zeta.vercel.app/"
    );
    // Allow all vercel.app subdomains in production for this app
    origins.push(/https:\/\/.*\.vercel\.app$/);
    console.log('🔒 Production CORS origins:', origins.filter(o => typeof o === 'string'));
  } else {
    // Development
    origins.push("http://localhost:3000", "http://127.0.0.1:3000");
    console.log('🔧 Development CORS origins:', origins);
  }
  
  return origins;
};

const io = socketIo(server, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});

// Middleware - Use the same CORS configuration as Socket.IO
app.use(cors({
  origin: getAllowedOrigins(),
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
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

// Generate food at specific location with custom value
function generateFoodAt(x, y, value = 1) {
  return {
    id: Math.random().toString(36).substr(2, 9),
    x: x,
    y: y,
    color: getRandomColor(),
    value: value
  };
}

// Drop food when player dies
function dropPlayerFood(player) {
  if (player.score <= 0) return;
  
  // Calculate how much food to drop (based on player's score)
  const foodToDrop = Math.min(Math.floor(player.score / 2), 50); // Cap at 50 pieces
  const foodValue = Math.max(1, Math.floor(player.score / foodToDrop)); // Each piece worth at least 1
  
  console.log(`💀 Player ${player.name} died with ${player.score} points, dropping ${foodToDrop} food pieces`);
  
  // Drop food in a scattered pattern around death location
  for (let i = 0; i < foodToDrop; i++) {
    // Random angle and distance for scatter effect
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * 150 + 20; // 20-170 pixels from death point
    
    const foodX = Math.max(20, Math.min(gameState.gameWidth - 20, 
      player.x + Math.cos(angle) * distance));
    const foodY = Math.max(20, Math.min(gameState.gameHeight - 20, 
      player.y + Math.sin(angle) * distance));
    
    const droppedFood = generateFoodAt(foodX, foodY, foodValue);
    gameState.food.push(droppedFood);
  }
  
  // Remove excess food if we're over the limit
  while (gameState.food.length > gameState.maxFood + 100) {
    gameState.food.shift(); // Remove oldest food
  }
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
      // Collision detected - eliminate current player
      eliminatePlayer(currentPlayer);
      return;
    }
    
    // Check collision with other player's segments
    otherPlayer.segments.forEach((segment) => {
      const segmentDistance = getDistance(currentPlayer, segment);
      if (segmentDistance < 20) {
        eliminatePlayer(currentPlayer);
        return;
      }
    });
  });
}

function eliminatePlayer(player) {
  console.log(`💀 Eliminating player: ${player.name} (Score: ${player.score})`);
  
  // Drop food based on player's score
  dropPlayerFood(player);
  
  // Remove player from game state
  gameState.players.delete(player.id);
  
  // Notify the eliminated player
  io.to(player.id).emit('gameOver', {
    finalScore: player.score,
    message: `Game Over! You scored ${player.score} points.`
  });
  
  // Notify other players that this player left
  io.emit('playerEliminated', {
    playerId: player.id,
    playerName: player.name,
    finalScore: player.score
  });
}

// Socket connection handling
io.on('connection', (socket) => {
  const origin = socket.handshake.headers.origin || socket.handshake.headers.referer;
  console.log('🎮 Player connected:', socket.id, 'from origin:', origin);
  
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