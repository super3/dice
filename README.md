# 3D Dice Roguelike

![Deploy Frontend](https://github.com/super3/dice/actions/workflows/frontend.yml/badge.svg)
![Tests](https://github.com/super3/dice/actions/workflows/test.yml/badge.svg)

A browser-based roguelike dice game with 3D physics and strategic gameplay. Built with Three.js and Cannon-ES physics engine.

🎮 **[Play the game here](https://super3.github.io/dice/)**

## How to Play

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

## Development

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

## Credits

The 3D dice rolling physics implementation is based on the excellent tutorial by [uuuulala](https://github.com/uuuulala):
- **Original Tutorial**: [Three.js Rolling Dice Tutorial](https://github.com/uuuulala/Threejs-rolling-dice-tutorial/)
- The dice geometry, physics setup, and core rolling mechanics are adapted from this tutorial

## Contributing
Feel free to open issues or submit pull requests with improvements!

## License
MIT