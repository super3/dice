# 🎲 DiceRun.io · [Play Now →](https://dicerun.io/)

A browser-based roguelike dice game with 3D physics built with [Three.js](https://threejs.org) and [Cannon-ES](https://pmndrs.github.io/cannon-es/).

[![Frontend Build Status](https://img.shields.io/github/actions/workflow/status/super3/dicerun.io/frontend.yml?branch=main&label=frontend)](https://github.com/super3/dicerun.io/actions/workflows/frontend.yml)
[![Test Status](https://img.shields.io/github/actions/workflow/status/super3/dicerun.io/test.yml?branch=main&label=tests)](https://github.com/super3/dicerun.io/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/super3/dicerun.io/badge.svg?branch=main)](https://coveralls.io/github/super3/dicerun.io?branch=main)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?label=license)](https://github.com/super3/dicerun.io/blob/main/LICENSE)

## 🚀 Quick Start
```bash
git clone https://github.com/super3/dicerun.io.git && cd dicerun.io
npm install && npm start
```

Open `http://localhost:8000` in your browser to start playing.

## 🎮 How to Play

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

## 🛠️ Development

### Local Setup
```bash
# Clone the repository
git clone https://github.com/super3/dicerun.io.git && cd dicerun.io

# Run tests
npm test

# Start development server (cache disabled)
npm run dev

# Server will open automatically at http://localhost:8000
```

### Project Structure
```
├── index.html              # Main HTML file
├── src/
│   ├── script.js           # Game logic and physics
│   ├── style.css           # UI styling
│   └── gameLogic.js        # Extracted game logic for testing
├── tests/
│   ├── gameLogic.test.js   # Unit tests
│   └── __mocks__/          # Test mocks for Three.js and Cannon
└── .github/
    └── workflows/
        ├── frontend.yml    # GitHub Pages deployment
        └── test.yml        # CI testing workflow
```

## 📜 Credits

The 3D dice rolling physics implementation is based on the excellent tutorial by [uuuulala](https://github.com/uuuulala):
- **Original Tutorial**: [Three.js Rolling Dice Tutorial](https://github.com/uuuulala/Threejs-rolling-dice-tutorial/)
- The dice geometry, physics setup, and core rolling mechanics are adapted from this tutorial