class DiceEngine {
    constructor() {
        this.baseScoring = {
            ones: { chips: 5, mult: 1 },
            twos: { chips: 10, mult: 1 },
            threes: { chips: 15, mult: 1 },
            fours: { chips: 20, mult: 1 },
            fives: { chips: 25, mult: 1 },
            sixes: { chips: 30, mult: 1 },
            pair: { chips: 10, mult: 2 },
            twoPair: { chips: 20, mult: 3 },
            threeKind: { chips: 30, mult: 4 },
            fullHouse: { chips: 40, mult: 5 },
            smallStraight: { chips: 50, mult: 6 },
            largeStraight: { chips: 70, mult: 8 },
            fourKind: { chips: 100, mult: 10 },
            fiveKind: { chips: 200, mult: 20 },
            chance: { chips: 0, mult: 1 }
        };

        this.handLevels = {};
        this.initializeHandLevels();
    }

    initializeHandLevels() {
        for (let pattern in this.baseScoring) {
            this.handLevels[pattern] = 1;
        }
    }

    upgradeHand(pattern, levels = 1) {
        if (this.handLevels[pattern]) {
            this.handLevels[pattern] += levels;
        }
    }

    getHandScoring(pattern) {
        const base = this.baseScoring[pattern];
        const level = this.handLevels[pattern];
        
        const chipsPerLevel = Math.floor(base.chips * 0.5);
        const multPerLevel = pattern === 'chance' ? 0 : 1;
        
        return {
            chips: base.chips + (chipsPerLevel * (level - 1)),
            mult: base.mult + (multPerLevel * (level - 1)),
            level: level
        };
    }

    rollDice(numDice = 5, sides = 6) {
        const dice = [];
        for (let i = 0; i < numDice; i++) {
            dice.push(Math.floor(Math.random() * sides) + 1);
        }
        return dice;
    }

    countDice(dice) {
        const counts = {};
        for (let die of dice) {
            counts[die] = (counts[die] || 0) + 1;
        }
        return counts;
    }

    detectAllPatterns(dice) {
        const patterns = [];
        const counts = this.countDice(dice);
        const values = Object.keys(counts).map(Number).sort((a, b) => a - b);
        const frequencies = Object.values(counts).sort((a, b) => b - a);

        for (let num = 1; num <= 6; num++) {
            if (counts[num]) {
                const pattern = this.detectNumberPattern(dice, num);
                if (pattern) patterns.push(pattern);
            }
        }

        if (frequencies[0] >= 2) {
            patterns.push(this.detectPair(dice));
        }

        if (frequencies[0] >= 2 && frequencies[1] >= 2) {
            patterns.push(this.detectTwoPair(dice));
        }

        if (frequencies[0] >= 3) {
            patterns.push(this.detectThreeKind(dice));
        }

        if (frequencies[0] >= 3 && frequencies[1] >= 2) {
            patterns.push(this.detectFullHouse(dice));
        }

        const straight = this.detectStraights(dice);
        if (straight) patterns.push(straight);

        if (frequencies[0] >= 4) {
            patterns.push(this.detectFourKind(dice));
        }

        if (frequencies[0] >= 5) {
            patterns.push(this.detectFiveKind(dice));
        }

        patterns.push(this.detectChance(dice));

        return patterns;
    }

    detectNumberPattern(dice, number) {
        const count = dice.filter(d => d === number).length;
        if (count === 0) return null;

        const patternName = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'][number - 1];
        const scoring = this.getHandScoring(patternName);
        const baseScore = count * number;

        return {
            name: patternName,
            displayName: `${number}s`,
            description: `${count} ${number}${count > 1 ? 's' : ''}`,
            dice: dice.filter(d => d === number),
            chips: scoring.chips + baseScore,
            mult: scoring.mult,
            totalScore: (scoring.chips + baseScore) * scoring.mult,
            level: scoring.level
        };
    }

    detectPair(dice) {
        const counts = this.countDice(dice);
        let pairValue = 0;
        
        for (let value in counts) {
            if (counts[value] >= 2) {
                pairValue = Math.max(pairValue, Number(value));
            }
        }

        if (pairValue === 0) return null;

        const scoring = this.getHandScoring('pair');
        return {
            name: 'pair',
            displayName: 'Pair',
            description: `Pair of ${pairValue}s`,
            dice: [pairValue, pairValue],
            chips: scoring.chips,
            mult: scoring.mult,
            totalScore: scoring.chips * scoring.mult,
            level: scoring.level
        };
    }

    detectTwoPair(dice) {
        const counts = this.countDice(dice);
        const pairs = [];
        
        for (let value in counts) {
            if (counts[value] >= 2) {
                pairs.push(Number(value));
            }
        }

        if (pairs.length < 2) return null;

        pairs.sort((a, b) => b - a);
        const scoring = this.getHandScoring('twoPair');
        
        return {
            name: 'twoPair',
            displayName: 'Two Pair',
            description: `${pairs[0]}s and ${pairs[1]}s`,
            dice: [pairs[0], pairs[0], pairs[1], pairs[1]],
            chips: scoring.chips,
            mult: scoring.mult,
            totalScore: scoring.chips * scoring.mult,
            level: scoring.level
        };
    }

    detectThreeKind(dice) {
        const counts = this.countDice(dice);
        let tripleValue = 0;
        
        for (let value in counts) {
            if (counts[value] >= 3) {
                tripleValue = Math.max(tripleValue, Number(value));
            }
        }

        if (tripleValue === 0) return null;

        const scoring = this.getHandScoring('threeKind');
        return {
            name: 'threeKind',
            displayName: 'Three of a Kind',
            description: `Three ${tripleValue}s`,
            dice: [tripleValue, tripleValue, tripleValue],
            chips: scoring.chips,
            mult: scoring.mult,
            totalScore: scoring.chips * scoring.mult,
            level: scoring.level
        };
    }

    detectFullHouse(dice) {
        const counts = this.countDice(dice);
        let triple = 0;
        let pair = 0;
        
        for (let value in counts) {
            if (counts[value] >= 3) {
                triple = Number(value);
            } else if (counts[value] >= 2) {
                pair = Number(value);
            }
        }

        if (triple === 0 || pair === 0) {
            for (let value in counts) {
                if (counts[value] >= 5) {
                    triple = Number(value);
                    pair = Number(value);
                    break;
                }
            }
        }

        if (triple === 0 || pair === 0) return null;

        const scoring = this.getHandScoring('fullHouse');
        return {
            name: 'fullHouse',
            displayName: 'Full House',
            description: `${triple}s over ${pair}s`,
            dice: [triple, triple, triple, pair, pair],
            chips: scoring.chips,
            mult: scoring.mult,
            totalScore: scoring.chips * scoring.mult,
            level: scoring.level
        };
    }

    detectStraights(dice) {
        const unique = [...new Set(dice)].sort((a, b) => a - b);
        
        let maxStraightLength = 1;
        let currentLength = 1;
        
        for (let i = 1; i < unique.length; i++) {
            if (unique[i] === unique[i-1] + 1) {
                currentLength++;
                maxStraightLength = Math.max(maxStraightLength, currentLength);
            } else {
                currentLength = 1;
            }
        }

        if (maxStraightLength >= 5) {
            const scoring = this.getHandScoring('largeStraight');
            return {
                name: 'largeStraight',
                displayName: 'Large Straight',
                description: '5 in a row',
                dice: unique.slice(0, 5),
                chips: scoring.chips,
                mult: scoring.mult,
                totalScore: scoring.chips * scoring.mult,
                level: scoring.level
            };
        } else if (maxStraightLength >= 4) {
            const scoring = this.getHandScoring('smallStraight');
            return {
                name: 'smallStraight',
                displayName: 'Small Straight',
                description: '4 in a row',
                dice: unique.slice(0, 4),
                chips: scoring.chips,
                mult: scoring.mult,
                totalScore: scoring.chips * scoring.mult,
                level: scoring.level
            };
        }

        return null;
    }

    detectFourKind(dice) {
        const counts = this.countDice(dice);
        let quadValue = 0;
        
        for (let value in counts) {
            if (counts[value] >= 4) {
                quadValue = Math.max(quadValue, Number(value));
            }
        }

        if (quadValue === 0) return null;

        const scoring = this.getHandScoring('fourKind');
        return {
            name: 'fourKind',
            displayName: 'Four of a Kind',
            description: `Four ${quadValue}s`,
            dice: [quadValue, quadValue, quadValue, quadValue],
            chips: scoring.chips,
            mult: scoring.mult,
            totalScore: scoring.chips * scoring.mult,
            level: scoring.level
        };
    }

    detectFiveKind(dice) {
        const counts = this.countDice(dice);
        let quintValue = 0;
        
        for (let value in counts) {
            if (counts[value] >= 5) {
                quintValue = Math.max(quintValue, Number(value));
            }
        }

        if (quintValue === 0) return null;

        const scoring = this.getHandScoring('fiveKind');
        return {
            name: 'fiveKind',
            displayName: 'Five of a Kind',
            description: `Five ${quintValue}s!`,
            dice: [quintValue, quintValue, quintValue, quintValue, quintValue],
            chips: scoring.chips,
            mult: scoring.mult,
            totalScore: scoring.chips * scoring.mult,
            level: scoring.level
        };
    }

    detectChance(dice) {
        const sum = dice.reduce((a, b) => a + b, 0);
        const scoring = this.getHandScoring('chance');
        
        return {
            name: 'chance',
            displayName: 'Chance',
            description: `Sum of all dice`,
            dice: [...dice],
            chips: scoring.chips + sum,
            mult: scoring.mult,
            totalScore: (scoring.chips + sum) * scoring.mult,
            level: scoring.level
        };
    }

    calculateScore(pattern, relicEffects = []) {
        let chips = pattern.chips;
        let mult = pattern.mult;

        for (let effect of relicEffects) {
            if (effect.type === 'addChips') {
                chips += effect.value;
            } else if (effect.type === 'addMult') {
                mult += effect.value;
            } else if (effect.type === 'multChips') {
                chips *= effect.value;
            } else if (effect.type === 'multMult') {
                mult *= effect.value;
            }
        }

        return {
            chips,
            mult,
            total: chips * mult
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiceEngine;
}