# Dice Dynasty - Implementation Plan

## Overview
A roguelike dice game inspired by Balatro's mechanics, using Yahtzee-style dice combinations for scoring with roguelike progression, relics, and upgrades.

## Phase 1: Core Architecture

### Files to Create
- [ ] `game.js` - Main game state manager and game loop
- [ ] `dice-engine.js` - Dice rolling, scoring patterns, and hand evaluation
- [ ] `relics.js` - Relic definitions and effect system
- [ ] `progression.js` - Blind progression, constellation cards, and upgrades
- [ ] `shop.js` - Shop system and economy
- [ ] `ui.js` - UI components and rendering
- [ ] `game.html` - Updated HTML with game layout

## Phase 2: Core Mechanics

### Scoring Patterns (Yahtzee-style)
- [ ] Ones through Sixes (sum of matching dice)
- [ ] Pair (2 matching)
- [ ] Two Pair (2 sets of pairs)
- [ ] Three of a Kind
- [ ] Full House (3 of kind + pair)
- [ ] Small Straight (4 consecutive)
- [ ] Large Straight (5 consecutive)
- [ ] Four of a Kind
- [ ] Five of a Kind (Yahtzee)
- [ ] Chance (sum all dice)

### Base Scoring Values
```javascript
const baseScoring = {
    pair: { chips: 10, mult: 2 },
    twoPair: { chips: 20, mult: 3 },
    threeKind: { chips: 30, mult: 4 },
    fullHouse: { chips: 40, mult: 5 },
    smallStraight: { chips: 50, mult: 6 },
    largeStraight: { chips: 70, mult: 8 },
    fourKind: { chips: 100, mult: 10 },
    fiveKind: { chips: 200, mult: 20 }
}
```

## Phase 3: Progression Systems

### Relics System (like Jokers)
- [ ] Golden Die: +50 chips when rolling a 6
- [ ] Probability Engine: Free reroll each turn
- [ ] Snake Eyes Charm: Pairs of 1s give 10x mult
- [ ] Loaded Dice: +2 to all dice minimum value
- [ ] Mirror Shield: Duplicate your best die
- [ ] Chaos Orb: Random dice explode for double value
- [ ] Time Loop: Store a roll to replay later

### Constellation Cards (like Planet cards)
- [ ] Orion: Upgrades Straights
- [ ] Gemini: Upgrades Pairs/Two Pairs
- [ ] Taurus: Upgrades Three/Four of a Kind
- [ ] Leo: Upgrades Full House
- [ ] Scorpio: Upgrades Five of a Kind

### Dice Enchantments
- [ ] Material types: Jade (2x score), Obsidian (locked but 3x), Crystal (see through time)
- [ ] Pip modifications: Weighted, Wild faces, Bonus pips
- [ ] Special effects: Exploding, Cascading, Magnetic

## Phase 4: Game Structure

### Run Structure
- [ ] Start with 5 basic d6 dice
- [ ] 8 Antes (stages) to complete
- [ ] Each Ante has: Small Blind → Big Blind → Boss Blind
- [ ] Score requirements scale exponentially

### Turn Structure
- [ ] 3 rolls per hand (can keep dice between rolls)
- [ ] 4 hands to beat each blind
- [ ] Must choose scoring pattern after final roll
- [ ] Can skip scoring for money (risk/reward)

### Shop Phase
- [ ] Buy Relics (3 available)
- [ ] Buy Constellation Cards (2 available)
- [ ] Buy Dice Packs (add/remove/modify dice)
- [ ] Buy Enchantments
- [ ] Reroll shop for $5

## Phase 5: UI Layout

```
┌─────────────────────────────────────┐
│  Ante 3 - Big Blind                 │
│  Target: 2,500 | Current: 1,200     │
│  Hands: 2/4 | Rolls: 2/3            │
├─────────────────────────────────────┤
│                                     │
│     [6] [6] [4] [2] [1]            │
│      ↓   ↓   □   □   □             │
│    (keep)(keep)(reroll)            │
│                                     │
├─────────────────────────────────────┤
│  Available Patterns:                │
│  • Pair (6s): 15 × 3 = 45          │
│  • Chance: 19 × 1 = 19             │
├─────────────────────────────────────┤
│  Relics: [Golden Die] [Snake Eyes]  │
│  Money: $23 | Multiplier: ×1.5      │
└─────────────────────────────────────┘
```

## Phase 6: Special Features

### Boss Blind Challenges
- [ ] "No Straights" - Straight patterns disabled
- [ ] "Chaos Dice" - Dice values randomize after keeping
- [ ] "High Stakes" - Must score 2x target but get 2x rewards
- [ ] "Blind Roll" - Can't see dice until after choosing pattern

### Risk/Reward Mechanics
- [ ] Interest: Earn $1 per $5 saved between rounds
- [ ] All-in bonus: Score 2x if you use all hands
- [ ] Perfect bonus: Extra rewards for exceeding target by 2x

### Meta Progression
- [ ] Unlock new starting relics
- [ ] Unlock new dice types
- [ ] Collection/achievement system

## Implementation Priority Order

1. [ ] Basic dice rolling with 3D visuals (adapt current code)
2. [ ] Scoring pattern detection and calculation
3. [ ] Simple progression (antes/blinds)
4. [ ] Relic system with 3-5 basic relics
5. [ ] Shop system
6. [ ] Constellation card upgrades
7. [ ] Full relic roster
8. [ ] Boss blinds and challenges
9. [ ] Dice enchantments
10. [ ] Polish and balancing

## Technical Tasks

### Immediate
- [ ] Refactor current dice.js to support game state
- [ ] Create scoring engine for pattern detection
- [ ] Implement turn-based rolling system
- [ ] Add dice selection/keeping mechanism

### Short Term
- [ ] Design game state management system
- [ ] Create UI components for game information
- [ ] Implement basic ante progression
- [ ] Add score calculation with chips + multipliers

### Medium Term
- [ ] Build relic effect system
- [ ] Create shop interface
- [ ] Implement constellation card upgrades
- [ ] Add save/load functionality

### Long Term
- [ ] Balance scoring curves and economy
- [ ] Add visual effects and animations
- [ ] Implement all boss blind types
- [ ] Create tutorial/onboarding
- [ ] Add sound effects and music

## Notes
- Keep the existing 3D dice visualization as the core visual element
- Focus on satisfying number scaling like Balatro
- Ensure each relic feels unique and creates interesting synergies
- Balance should start easy but scale to require clever relic combinations