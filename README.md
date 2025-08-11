# 3D Dice Roguelike

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

# Start a local server
python3 -m http.server 8000

# Open in browser
# Navigate to http://localhost:8000
```

### Technologies
- **Three.js** - 3D graphics and rendering
- **Cannon-ES** - Physics simulation
- **ES6 Modules** - Modern JavaScript modules
- **GitHub Pages** - Deployment

### Project Structure
```
├── index.html       # Main HTML file
├── script.js        # Game logic and physics
├── style.css        # UI styling
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Pages deployment
```

## Contributing
Feel free to open issues or submit pull requests with improvements!

## License
MIT