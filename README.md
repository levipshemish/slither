# 🐍 Slither.io Clone

A multiplayer snake game inspired by Slither.io, built with React, Node.js, and Socket.IO.

## 🎮 Features

- **Real-time Multiplayer**: Play with friends and other players online
- **Smooth Snake Movement**: Fluid mouse-controlled movement
- **Dynamic Growth**: Snake grows as you eat food
- **Collision Detection**: Avoid other snakes or respawn
- **Beautiful Graphics**: Gradient effects and smooth animations
- **Responsive Design**: Works on desktop and mobile
- **Live Score Tracking**: See your score and length in real-time

## 🚀 Live Demo

🌐 **Play the game**: [Your deployed game URL here]

## 🛠️ Technology Stack

### Frontend
- **React** - UI framework
- **Socket.IO Client** - Real-time communication
- **HTML5 Canvas** - Game rendering
- **CSS3** - Styling and animations

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Socket.IO** - WebSocket communication
- **CORS** - Cross-origin resource sharing

## 📦 Installation & Development

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd slither
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Start the backend server**
```bash
cd ../backend
npm start
# Server runs on http://localhost:5001
```

5. **Start the frontend**
```bash
cd ../frontend
npm start
# Game runs on http://localhost:3000
```

6. **Open your browser** and navigate to `http://localhost:3000`

## 🌍 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Options:
- **Vercel + Railway** (Recommended - Free tier available)
- **Heroku** (Easy deployment)
- **DigitalOcean App Platform**
- **AWS/Google Cloud** (Advanced)

## 🎯 How to Play

1. **Enter your snake name** in the menu
2. **Click "Play Game"** to join
3. **Move your mouse** to control snake direction
4. **Eat colorful food** to grow your snake
5. **Avoid other snakes** or you'll respawn
6. **Compete for the highest score!**

## 🔧 Game Configuration

### Server Settings (backend/server.js)
```javascript
const gameState = {
  gameWidth: 4000,    // Game world width
  gameHeight: 4000,   // Game world height
  maxFood: 200        // Number of food items
};
```

### Adjust Game Mechanics:
- **Snake Speed**: Modify `speed` variable in `updatePlayers()`
- **Growth Rate**: Change score-to-length ratio in `checkFoodCollision()`
- **Food Generation**: Adjust `maxFood` and food spawn logic
- **Collision Sensitivity**: Modify collision detection distances

## 🚀 Performance Optimization

For handling many concurrent players:

1. **Use Redis** for shared game state
2. **Implement clustering** for multiple server instances  
3. **Add rate limiting** to prevent spam
4. **Optimize collision detection** with spatial partitioning
5. **Use CDN** for static assets

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Known Issues & Roadmap

- [ ] Add player authentication
- [ ] Implement leaderboards
- [ ] Add power-ups and special abilities
- [ ] Mobile touch controls optimization
- [ ] Sound effects and music
- [ ] Spectator mode
- [ ] Private rooms/lobbies

## 🙏 Acknowledgments

- Inspired by the original Slither.io game
- Built with modern web technologies
- Socket.IO for real-time multiplayer functionality

---

**Have fun playing! 🎉**