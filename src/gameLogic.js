// Game logic functions that can be tested independently

const roundTargets = [7, 12, 18, 25, 33, 42, 52, 63, 75, 88];

function getDicePrice(baseCost, dicePurchased) {
  // Price increases with each purchase: 10, 15, 25, 40, 60, 85...
  return Math.floor(baseCost * Math.pow(1.5, dicePurchased));
}

function calculateEarnings(currentScore, targetScore, rerollsRemaining) {
  let earnings = 0;
  let bonuses = [];
  
  // Base earnings: difference between score and target
  const baseEarnings = currentScore - targetScore;
  earnings += baseEarnings;
  
  // Perfect roll bonus: exactly hit the target
  if (currentScore === targetScore) {
    earnings += 10;
    bonuses.push({ type: 'perfect', amount: 10 });
  }
  
  // Efficiency bonus: $2 per unused reroll
  if (rerollsRemaining > 0) {
    const efficiencyBonus = rerollsRemaining * 2;
    earnings += efficiencyBonus;
    bonuses.push({ type: 'efficiency', amount: efficiencyBonus, rerolls: rerollsRemaining });
  }
  
  return {
    total: earnings,
    base: baseEarnings,
    bonuses: bonuses
  };
}

function getTargetScoreForRound(round) {
  return roundTargets[Math.min(round - 1, roundTargets.length - 1)];
}

function checkRoundComplete(currentScore, targetScore, rerollsRemaining) {
  if (currentScore >= targetScore) {
    return 'won';
  } else if (rerollsRemaining === 0) {
    return 'lost';
  }
  return 'continue';
}

function calculateDiceScore(euler) {
  const eps = 0.1;
  let isZero = (angle) => Math.abs(angle) < eps;
  let isHalfPi = (angle) => Math.abs(angle - 0.5 * Math.PI) < eps;
  let isMinusHalfPi = (angle) => Math.abs(0.5 * Math.PI + angle) < eps;
  let isPiOrMinusPi = (angle) => (Math.abs(Math.PI - angle) < eps || Math.abs(Math.PI + angle) < eps);

  let score = 0;
  if (isZero(euler.z)) {
    if (isZero(euler.x)) {
      score = 1;
    } else if (isHalfPi(euler.x)) {
      score = 4;
    } else if (isMinusHalfPi(euler.x)) {
      score = 3;
    } else if (isPiOrMinusPi(euler.x)) {
      score = 6;
    } else {
      // landed on edge
      return null;
    }
  } else if (isHalfPi(euler.z)) {
    score = 2;
  } else if (isMinusHalfPi(euler.z)) {
    score = 5;
  } else {
    // landed on edge
    return null;
  }
  
  return score;
}

function calculateTotalScore(diceScores, lockedDice = new Set()) {
  return diceScores.reduce((sum, score) => sum + (score || 0), 0);
}

module.exports = {
  roundTargets,
  getDicePrice,
  calculateEarnings,
  getTargetScoreForRound,
  checkRoundComplete,
  calculateDiceScore,
  calculateTotalScore
};