// Dice Game Statistical Simulator
// Calculates win probabilities for each round configuration

// Game configuration
const roundTargets = [6, 10, 15, 21, 28, 36, 45, 55, 66, 78];
const SIMULATIONS = 100000; // Number of simulations per scenario
const MAX_REROLLS = 3;

// Roll a single die
function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
}

// Roll multiple dice
function rollDice(count) {
    const dice = [];
    for (let i = 0; i < count; i++) {
        dice.push(rollDie());
    }
    return dice;
}

// Calculate combo bonuses based on dice values
function calculateCombos(dice) {
    let bonus = 0;
    const counts = {};
    
    // Count occurrences
    dice.forEach(d => {
        counts[d] = (counts[d] || 0) + 1;
    });
    
    // Check for multiples
    Object.values(counts).forEach(count => {
        if (count === 2) bonus += 3;      // Pair
        else if (count === 3) bonus += 8;  // Triple
        else if (count === 4) bonus += 15; // Four of a kind
        else if (count >= 5) bonus += 15 + (count - 4) * 10; // 5+ of a kind
    });
    
    // Check for full house (3 + 2)
    const countValues = Object.values(counts);
    if (countValues.includes(3) && countValues.includes(2)) {
        bonus += 12;
    }
    
    // Check for straights
    const unique = [...new Set(dice)].sort((a, b) => a - b);
    let straightLength = 1;
    let maxStraight = 1;
    
    for (let i = 1; i < unique.length; i++) {
        if (unique[i] === unique[i-1] + 1) {
            straightLength++;
            maxStraight = Math.max(maxStraight, straightLength);
        } else {
            straightLength = 1;
        }
    }
    
    if (maxStraight >= 3) {
        bonus += (maxStraight - 2) * 5;
    }
    
    return bonus;
}

// Calculate total score (sum + combos)
function calculateScore(dice) {
    const sum = dice.reduce((a, b) => a + b, 0);
    const combos = calculateCombos(dice);
    return sum + combos;
}

// Simulate a single round with optimal play (always reroll if below target)
function simulateRound(diceCount, target, rerolls) {
    let dice = rollDice(diceCount);
    let score = calculateScore(dice);
    
    // Use rerolls if score is below target
    let rerollsUsed = 0;
    while (score < target && rerollsUsed < rerolls) {
        dice = rollDice(diceCount);
        score = calculateScore(dice);
        rerollsUsed++;
    }
    
    return {
        won: score >= target,
        score: score,
        rerollsUsed: rerollsUsed
    };
}

// Run simulations for a specific configuration
function runSimulation(diceCount, target, rerolls, simCount = SIMULATIONS) {
    let wins = 0;
    let totalScore = 0;
    let totalRerolls = 0;
    const scores = [];
    
    for (let i = 0; i < simCount; i++) {
        const result = simulateRound(diceCount, target, rerolls);
        if (result.won) wins++;
        totalScore += result.score;
        totalRerolls += result.rerollsUsed;
        scores.push(result.score);
    }
    
    // Calculate statistics
    const winRate = wins / simCount;
    const avgScore = totalScore / simCount;
    const avgRerolls = totalRerolls / simCount;
    
    // Calculate score distribution percentiles
    scores.sort((a, b) => a - b);
    const p25 = scores[Math.floor(simCount * 0.25)];
    const p50 = scores[Math.floor(simCount * 0.50)];
    const p75 = scores[Math.floor(simCount * 0.75)];
    
    return {
        winRate,
        avgScore,
        avgRerolls,
        percentiles: { p25, p50, p75 }
    };
}

// Main analysis
console.log("=== DICE GAME PROBABILITY ANALYSIS ===");
console.log(`Simulations per scenario: ${SIMULATIONS.toLocaleString()}\n`);

// Analyze each round with different dice counts
console.log("Round Analysis (with 3 rerolls):");
console.log("-".repeat(80));

for (let round = 1; round <= 10; round++) {
    const target = roundTargets[round - 1];
    console.log(`\nRound ${round} (Target: ${target}):`);
    
    // Test with different dice counts
    for (let diceCount = 2; diceCount <= Math.min(6, Math.ceil(target / 3.5)); diceCount++) {
        const stats = runSimulation(diceCount, target, MAX_REROLLS);
        
        console.log(`  ${diceCount} dice:`);
        console.log(`    Win rate: ${(stats.winRate * 100).toFixed(1)}%`);
        console.log(`    Avg score: ${stats.avgScore.toFixed(1)} (25th: ${stats.percentiles.p25}, 50th: ${stats.percentiles.p50}, 75th: ${stats.percentiles.p75})`);
        console.log(`    Avg rerolls used: ${stats.avgRerolls.toFixed(2)}`);
        
        // Stop showing more dice if win rate is already very high
        if (stats.winRate > 0.95) break;
    }
}

// Analyze dice purchasing strategy
console.log("\n" + "=".repeat(80));
console.log("DICE PURCHASING STRATEGY ANALYSIS");
console.log("=".repeat(80));

console.log("\nOptimal dice count per round (targeting 80% win rate):");
for (let round = 1; round <= 10; round++) {
    const target = roundTargets[round - 1];
    let optimalDice = 2;
    
    for (let diceCount = 2; diceCount <= 8; diceCount++) {
        const stats = runSimulation(diceCount, target, MAX_REROLLS, 10000); // Fewer sims for speed
        if (stats.winRate >= 0.8) {
            optimalDice = diceCount;
            break;
        }
        optimalDice = diceCount;
    }
    
    console.log(`  Round ${round} (Target ${target}): ${optimalDice} dice recommended`);
}

// Analyze the impact of combo bonuses
console.log("\n" + "=".repeat(80));
console.log("COMBO BONUS IMPACT");
console.log("=".repeat(80));

console.log("\nAverage combo bonus by dice count (10,000 rolls each):");
for (let diceCount = 2; diceCount <= 6; diceCount++) {
    let totalBonus = 0;
    let pairCount = 0;
    let tripleCount = 0;
    let straightCount = 0;
    
    for (let i = 0; i < 10000; i++) {
        const dice = rollDice(diceCount);
        const bonus = calculateCombos(dice);
        totalBonus += bonus;
        
        // Track combo types
        const counts = {};
        dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
        if (Object.values(counts).some(c => c >= 2)) pairCount++;
        if (Object.values(counts).some(c => c >= 3)) tripleCount++;
        
        const unique = [...new Set(dice)].sort((a, b) => a - b);
        let straight = 1;
        for (let j = 1; j < unique.length; j++) {
            if (unique[j] === unique[j-1] + 1) straight++;
            else straight = 1;
            if (straight >= 3) {
                straightCount++;
                break;
            }
        }
    }
    
    console.log(`  ${diceCount} dice:`);
    console.log(`    Avg bonus: +${(totalBonus / 10000).toFixed(2)} points`);
    console.log(`    Pair+ rate: ${(pairCount / 100).toFixed(1)}%`);
    console.log(`    Triple+ rate: ${(tripleCount / 100).toFixed(1)}%`);
    console.log(`    Straight rate: ${(straightCount / 100).toFixed(1)}%`);
}

console.log("\n" + "=".repeat(80));
console.log("ANALYSIS COMPLETE");