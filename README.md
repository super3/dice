<h1 align="center">
  Dice
  <br>
</h1>

<h4 align="center">A browser-based roguelike dice game with 3D physics built with <a href="https://threejs.org">Three.js</a>, <a href="https://pmndrs.github.io/cannon-es/">Cannon-ES</a>, and <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript">JavaScript</a>.</h4>

<div align="center">

[![Frontend Build Status](https://img.shields.io/github/actions/workflow/status/super3/dice/frontend.yml?label=frontend)](https://github.com/super3/dice/actions/workflows/frontend.yml)
[![Test Status](https://img.shields.io/github/actions/workflow/status/super3/dice/test.yml?label=tests)](https://github.com/super3/dice/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/super3/dice/badge.svg?branch=main)](https://coveralls.io/github/super3/dice?branch=main)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?label=license)](https://github.com/super3/dice/blob/main/LICENSE)

</div>

<p align="center">
  <a href="https://super3.github.io/dice/">🎮 Play the game here</a>
</p>

## Quick Start
```bash
git clone https://github.com/super3/dice.git && cd dice
npm install && npm test
npm start
```

Open `http://localhost:8000` in your browser to start playing.

## 🎲 How to Play

### Objective
Roll dice to meet or exceed target scores across increasingly difficult rounds. Earn money based on your performance and spend it on additional dice to improve your chances.

### Controls
- **Double-tap** or click **Roll Dice** button to throw the dice
- **Click on individual dice** to lock/unlock them (locked dice won't reroll)
- Locked dice show a 🔒 indicator

### Game Mechanics

#### Rounds
- Each round has a target score you must reach
- You have 3 rerolls per round to achieve the target
- Target scores increase with each round: 7, 12, 18, 25, 33, 42...

#### Scoring & Earnings
Complete a round to earn money based on:
- **Base earnings**: Score minus target score
- **Perfect Roll Bonus**: +$10 for hitting the exact target
- **Efficiency Bonus**: +$2 per unused reroll

#### Store
Between rounds, spend your earnings on:
- **Extra Dice**: Starting at $10, price increases by 50% with each purchase
- More dice = higher potential scores

### Strategy Tips
- Lock high-value dice to preserve good rolls
- Balance risk vs reward - perfect rolls give bonuses but are harder to achieve
- Save rerolls when possible for efficiency bonuses
- Buy additional dice to make higher targets achievable

## 🚀 Development

### Local Setup
```bash
# Clone the repository
git clone https://github.com/super3/dice.git
cd dice

# Start the development server
npm start

# Or for development with cache disabled
npm run dev

# Server will open automatically at http://localhost:8000
```

### Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Technologies
- **Three.js** - 3D graphics and rendering
- **Cannon-ES** - Physics simulation
- **ES6 Modules** - Modern JavaScript modules
- **Jest** - Testing framework
- **GitHub Pages** - Deployment

### Project Structure
```
├── index.html           # Main HTML file
├── script.js            # Game logic and physics
├── style.css            # UI styling
├── src/
│   └── gameLogic.js     # Extracted game logic for testing
├── tests/
│   ├── gameLogic.test.js  # Unit tests
│   └── __mocks__/       # Test mocks for Three.js and Cannon
└── .github/
    └── workflows/
        ├── frontend.yml # GitHub Pages deployment
        └── test.yml     # CI testing workflow
```

## 📜 Credits

The 3D dice rolling physics implementation is based on the excellent tutorial by [uuuulala](https://github.com/uuuulala):
- **Original Tutorial**: [Three.js Rolling Dice Tutorial](https://github.com/uuuulala/Threejs-rolling-dice-tutorial/)
- The dice geometry, physics setup, and core rolling mechanics are adapted from this tutorial