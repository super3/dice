const {
  getDicePrice,
  calculateEarnings,
  getTargetScoreForRound,
  checkRoundComplete,
  calculateDiceScore,
  calculateTotalScore
} = require('../src/gameLogic.js');

describe('Game Logic Tests', () => {
  
  describe('getDicePrice', () => {
    test('should return base cost for first dice', () => {
      expect(getDicePrice(10, 0)).toBe(10);
    });

    test('should increase price exponentially', () => {
      expect(getDicePrice(10, 1)).toBe(15);
      expect(getDicePrice(10, 2)).toBe(22);
      expect(getDicePrice(10, 3)).toBe(33);
      expect(getDicePrice(10, 4)).toBe(50);
    });

    test('should handle different base costs', () => {
      expect(getDicePrice(20, 0)).toBe(20);
      expect(getDicePrice(20, 1)).toBe(30);
    });
  });

  describe('calculateEarnings', () => {
    test('should calculate base earnings correctly', () => {
      const result = calculateEarnings(10, 7, 0);
      expect(result.base).toBe(3);
      expect(result.total).toBe(3);
    });

    test('should add perfect roll bonus', () => {
      const result = calculateEarnings(7, 7, 0);
      expect(result.base).toBe(0);
      expect(result.total).toBe(10);
      expect(result.bonuses).toContainEqual({ type: 'perfect', amount: 10 });
    });

    test('should add efficiency bonus for unused rerolls', () => {
      const result = calculateEarnings(10, 7, 2);
      expect(result.base).toBe(3);
      expect(result.total).toBe(7); // 3 base + 4 efficiency
      expect(result.bonuses).toContainEqual({ 
        type: 'efficiency', 
        amount: 4, 
        rerolls: 2 
      });
    });

    test('should combine perfect roll and efficiency bonuses', () => {
      const result = calculateEarnings(7, 7, 3);
      expect(result.total).toBe(16); // 0 base + 10 perfect + 6 efficiency
      expect(result.bonuses).toHaveLength(2);
    });
  });

  describe('getTargetScoreForRound', () => {
    test('should return correct target scores for rounds', () => {
      expect(getTargetScoreForRound(1)).toBe(7);
      expect(getTargetScoreForRound(2)).toBe(12);
      expect(getTargetScoreForRound(3)).toBe(18);
      expect(getTargetScoreForRound(4)).toBe(25);
    });

    test('should cap at last target for high rounds', () => {
      expect(getTargetScoreForRound(10)).toBe(88);
      expect(getTargetScoreForRound(15)).toBe(88);
      expect(getTargetScoreForRound(100)).toBe(88);
    });
  });

  describe('checkRoundComplete', () => {
    test('should return won when score meets target', () => {
      expect(checkRoundComplete(7, 7, 2)).toBe('won');
      expect(checkRoundComplete(10, 7, 1)).toBe('won');
    });

    test('should return lost when no rerolls and target not met', () => {
      expect(checkRoundComplete(5, 7, 0)).toBe('lost');
    });

    test('should return continue when target not met but rerolls remain', () => {
      expect(checkRoundComplete(5, 7, 1)).toBe('continue');
      expect(checkRoundComplete(5, 7, 3)).toBe('continue');
    });
  });

  describe('calculateDiceScore', () => {
    test('should calculate score 1 for face up', () => {
      const euler = { x: 0, y: 0, z: 0 };
      expect(calculateDiceScore(euler)).toBe(1);
    });

    test('should calculate score 6 for opposite face', () => {
      const euler = { x: Math.PI, y: 0, z: 0 };
      expect(calculateDiceScore(euler)).toBe(6);
    });

    test('should calculate score 2 for side face', () => {
      const euler = { x: 0, y: 0, z: Math.PI / 2 };
      expect(calculateDiceScore(euler)).toBe(2);
    });

    test('should calculate score 5 for opposite side face', () => {
      const euler = { x: 0, y: 0, z: -Math.PI / 2 };
      expect(calculateDiceScore(euler)).toBe(5);
    });

    test('should return null for edge landing', () => {
      const euler = { x: Math.PI / 4, y: 0, z: 0 };
      expect(calculateDiceScore(euler)).toBe(null);
    });
  });

  describe('calculateTotalScore', () => {
    test('should sum all dice scores', () => {
      expect(calculateTotalScore([1, 2, 3, 4])).toBe(10);
      expect(calculateTotalScore([6, 6, 6])).toBe(18);
    });

    test('should handle undefined scores', () => {
      expect(calculateTotalScore([1, undefined, 3])).toBe(4);
      expect(calculateTotalScore([undefined, undefined])).toBe(0);
    });

    test('should handle empty array', () => {
      expect(calculateTotalScore([])).toBe(0);
    });
  });
});