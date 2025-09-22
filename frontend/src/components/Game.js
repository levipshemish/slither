import React, { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';

const Game = () => {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const animationRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [connected, setConnected] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [gameOverMessage, setGameOverMessage] = useState('');

  // Game rendering
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState || !playerId) return;

    const ctx = canvas.getContext('2d');
    const currentPlayer = gameState.players.find(p => p.id === playerId);
    
    if (!currentPlayer) return;

    // Clear canvas with dark background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate camera offset to follow player
    const offsetX = canvas.width / 2 - currentPlayer.x;
    const offsetY = canvas.height / 2 - currentPlayer.y;

    ctx.save();
    ctx.translate(offsetX, offsetY);

    // Draw circular boundary
    drawCircularBoundary(ctx, gameState);
    
    // Draw grid for reference
    drawGrid(ctx, offsetX, offsetY, canvas.width, canvas.height);

    // Draw food
    if (gameState.food) {
      gameState.food.forEach(food => {
        drawFood(ctx, food);
      });
    }

    // Draw all players
    gameState.players.forEach(player => {
      drawPlayer(ctx, player, player.id === playerId);
    });

    ctx.restore();

    // Draw UI
    drawUI(ctx, currentPlayer, canvas);
  }, [gameState, playerId]);

  const drawCircularBoundary = (ctx, gameState) => {
    if (!gameState.worldRadius) return;
    
    // Draw the boundary circle
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 10]); // Dashed line
    ctx.beginPath();
    ctx.arc(gameState.centerX || 0, gameState.centerY || 0, gameState.worldRadius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash
    
    // Add a warning zone closer to the edge
    ctx.strokeStyle = '#ffa500';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(gameState.centerX || 0, gameState.centerY || 0, gameState.worldRadius - 100, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  };

  const drawGrid = (ctx, offsetX, offsetY, width, height) => {
    const gridSize = 50;
    ctx.strokeStyle = '#16213e';
    ctx.lineWidth = 1;

    // Calculate visible grid lines
    const startX = Math.floor(-offsetX / gridSize) * gridSize;
    const endX = startX + width + gridSize;
    const startY = Math.floor(-offsetY / gridSize) * gridSize;
    const endY = startY + height + gridSize;

    // Draw vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  };

  const drawFood = (ctx, food) => {
    ctx.fillStyle = food.color;
    ctx.beginPath();
    ctx.arc(food.x, food.y, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add glow effect
    ctx.shadowColor = food.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(food.x, food.y, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  const drawPlayer = (ctx, player, isCurrentPlayer) => {
    const baseHeadRadius = player.headSize || 18;
    const headRadius = Math.min(25, baseHeadRadius + Math.floor(player.score / 10));
    
    // Draw segments (body) with smooth connections
    if (player.segments && player.segments.length > 0) {
      for (let i = player.segments.length - 1; i >= 0; i--) {
        const segment = player.segments[i];
        // Calculate segment size - decreases towards tail
        const sizeRatio = 1 - (i / (player.segments.length + 2));
        const segmentRadius = Math.max(6, headRadius * sizeRatio * 0.85);
        
        // Color gets slightly darker towards tail
        const alpha = Math.max(0.7, 1 - (i * 0.02));
        
        if (isCurrentPlayer) {
          ctx.fillStyle = `rgba(78, 205, 196, ${alpha})`;
        } else {
          // Convert hex color to rgba
          const hex = player.color;
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        
        // Draw segment with subtle outline
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, segmentRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add subtle outline to body segments
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;

    // Draw head with gradient effect
    const gradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, headRadius);
    if (isCurrentPlayer) {
      gradient.addColorStop(0, '#5EFDD8');
      gradient.addColorStop(1, '#4ECDC4');
    } else {
      gradient.addColorStop(0, player.color);
      gradient.addColorStop(1, player.color + '99');
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(player.x, player.y, headRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Add border to head
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw eyes
    const eyeSize = Math.max(2, headRadius * 0.15);
    const eyeOffset = headRadius * 0.35;
    
    // Left eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(player.x - eyeOffset, player.y - 3, eyeSize, 0, 2 * Math.PI);
    ctx.fill();
    
    // Right eye
    ctx.beginPath();
    ctx.arc(player.x + eyeOffset, player.y - 3, eyeSize, 0, 2 * Math.PI);
    ctx.fill();

    // Eye pupils
    const pupilSize = eyeSize * 0.6;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(player.x - eyeOffset, player.y - 3, pupilSize, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(player.x + eyeOffset, player.y - 3, pupilSize, 0, 2 * Math.PI);
    ctx.fill();

    // Draw player name with better styling
    const nameY = player.y - headRadius - 8;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(player.name, player.x, nameY);
    ctx.fillText(player.name, player.x, nameY);
    
    // Draw score for current player
    if (isCurrentPlayer && player.score > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 12px Arial';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeText(`${player.score}`, player.x, nameY - 16);
      ctx.fillText(`${player.score}`, player.x, nameY - 16);
    }
  };

  const drawUI = (ctx, player, canvas) => {
    // Score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText(`Score: ${player.score}`, 20, 40);
    ctx.fillText(`Score: ${player.score}`, 20, 40);

    // Length (number of segments + head)
    const actualLength = (player.segments ? player.segments.length : 0) + 1;
    ctx.font = 'bold 18px Arial';
    ctx.strokeText(`Length: ${actualLength}`, 20, 70);
    ctx.fillText(`Length: ${actualLength}`, 20, 70);

    // Connection status
    const statusText = connected ? 'Connected' : 'Disconnected';
    const statusColor = connected ? '#4ECDC4' : '#FF6B6B';
    ctx.fillStyle = statusColor;
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(statusText, canvas.width - 20, 30);

    // Instructions
    ctx.fillStyle = '#cccccc';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Move your mouse to control your snake', canvas.width / 2, canvas.height - 20);
  };

  // Game loop
  useEffect(() => {
    if (!gameStarted) return;

    const gameLoop = () => {
      draw();
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw, gameStarted]);

  // Socket setup
  useEffect(() => {
    if (!gameStarted) return;

    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5001';
    socketRef.current = io(serverUrl);

    socketRef.current.on('connect', () => {
      setConnected(true);
      console.log('Connected to server');
    });

    socketRef.current.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from server');
    });

    socketRef.current.on('gameJoined', (data) => {
      setPlayerId(data.playerId);
      setGameState(data.gameState);
      console.log('Game joined:', data);
    });

    socketRef.current.on('gameUpdate', (newGameState) => {
      setGameState(newGameState);
    });

    socketRef.current.on('gameOver', (data) => {
      console.log('Game Over!', data);
      setFinalScore(data.finalScore);
      setGameOverMessage(data.message);
      setGameOver(true);
      setGameStarted(false);
      setGameState(null);
      setPlayerId(null);
    });

    socketRef.current.on('playerEliminated', (data) => {
      console.log(`Player ${data.playerName} was eliminated with ${data.finalScore} points`);
    });

    // Join the game with viewport information
    socketRef.current.emit('joinGame', { 
      name: playerName,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [gameStarted, playerName]);

  // Mouse movement handling
  useEffect(() => {
    if (!gameStarted) return;

    const handleMouseMove = (e) => {
      const canvas = canvasRef.current;
      if (!canvas || !socketRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Convert mouse position to game direction
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      const directionX = mouseX - centerX;
      const directionY = mouseY - centerY;

      // Normalize and send direction
      const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
      if (magnitude > 10) { // Dead zone
        const normalizedDirection = {
          x: directionX / magnitude,
          y: directionY / magnitude
        };
        
        socketRef.current.emit('updateDirection', normalizedDirection);
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      return () => canvas.removeEventListener('mousemove', handleMouseMove);
    }
  }, [gameStarted]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        // Set canvas size to match viewport
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Also set CSS size to prevent scaling issues
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
      }
    };

    // Initial sizing when component mounts
    handleResize();
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Additional effect to ensure canvas is sized when game starts
  useEffect(() => {
    if (gameStarted) {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
      }
    }
  }, [gameStarted]);

  const joinGame = () => {
    if (playerName.trim()) {
      setGameStarted(true);
      setGameOver(false);
      setFinalScore(0);
      setGameOverMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      joinGame();
    }
  };

  if (!gameStarted) {
    return (
      <div className="menu-container">
        <div className="menu">
          <h1 className="game-title">🐍 Slither.io Clone</h1>
          
          {gameOver && (
            <div className="game-over-info">
              <h2 className="game-over-title">💀 Game Over!</h2>
              <p className="final-score">Final Score: {finalScore}</p>
              <p className="game-over-message">{gameOverMessage}</p>
              <div className="play-again-prompt">
                <p>Ready to play again?</p>
              </div>
            </div>
          )}
          
          <div className="menu-content">
            <input
              type="text"
              placeholder="Enter your snake name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="name-input"
              maxLength={15}
            />
            <button 
              onClick={joinGame} 
              className="play-button"
              disabled={!playerName.trim()}
            >
              {gameOver ? '🔄 Play Again' : '🎮 Play Game'}
            </button>
            
            {!gameOver && (
              <div className="game-info">
                <p>🎯 Eat food to grow your snake</p>
                <p>🖱️ Use your mouse to control direction</p>
                <p>⚠️ Don't hit other snakes!</p>
                <p>💎 When you die, you drop food worth your score!</p>
                <p>🔴 Stay within the red circular boundary!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        className="game-canvas"
      />
    </div>
  );
};

export default Game;