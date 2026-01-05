/**
 * Tests for the DiceRoller web component
 * 
 * Run with: node tests/dice-roller.test.js
 */

// Simple test framework
let testsPassed = 0;
let testsFailed = 0;

function describe(name, fn) {
  console.log(`\n📦 ${name}`);
  fn();
}

function it(name, fn) {
  try {
    fn();
    testsPassed++;
    console.log(`  ✅ ${name}`);
  } catch (error) {
    testsFailed++;
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${error.message}`);
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toBeGreaterThanOrEqual(expected) {
      if (!(actual >= expected)) {
        throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
      }
    },
    toBeLessThanOrEqual(expected) {
      if (!(actual <= expected)) {
        throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected ${actual} to be truthy`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected ${actual} to be falsy`);
      }
    },
    toHaveLength(expected) {
      if (actual.length !== expected) {
        throw new Error(`Expected length ${expected}, but got ${actual.length}`);
      }
    }
  };
}

// DiceRoller logic for testing (without DOM dependency)
class DiceRollerLogic {
  constructor(dice = 3, sides = 6) {
    this._dice = dice;
    this._sides = sides;
  }
  
  get dice() { return this._dice; }
  get sides() { return this._sides; }
  
  rollDie() {
    return Math.floor(Math.random() * this._sides) + 1;
  }
  
  rollDice() {
    const results = [];
    for (let i = 0; i < this._dice; i++) {
      results.push(this.rollDie());
    }
    return results;
  }
  
  calculateSunderResult(rolls) {
    // Special case: all dice are 1
    if (rolls.every(roll => roll === 1)) {
      return 1;
    }
    
    // Drop the highest
    const sorted = [...rolls].sort((a, b) => a - b);
    sorted.pop(); // Remove highest
    
    // Sum remaining dice
    return sorted.reduce((sum, roll) => sum + roll, 0);
  }
}

// Run tests
describe('DiceRoller Initialization', () => {
  it('should initialize with default values', () => {
    const roller = new DiceRollerLogic();
    expect(roller.dice).toBe(3);
    expect(roller.sides).toBe(6);
  });
  
  it('should initialize with custom values', () => {
    const roller = new DiceRollerLogic(4, 8);
    expect(roller.dice).toBe(4);
    expect(roller.sides).toBe(8);
  });
});

describe('Single Die Roll', () => {
  it('should roll values within valid range', () => {
    const roller = new DiceRollerLogic(1, 6);
    
    for (let i = 0; i < 100; i++) {
      const result = roller.rollDie();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    }
  });
  
  it('should handle different die sizes', () => {
    const roller = new DiceRollerLogic(1, 20);
    
    for (let i = 0; i < 100; i++) {
      const result = roller.rollDie();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(20);
    }
  });
});

describe('Multiple Dice Roll', () => {
  it('should roll the correct number of dice', () => {
    const roller = new DiceRollerLogic(3, 6);
    const results = roller.rollDice();
    expect(results).toHaveLength(3);
  });
  
  it('should return array with values in valid range', () => {
    const roller = new DiceRollerLogic(5, 6);
    const results = roller.rollDice();
    
    expect(results).toHaveLength(5);
    results.forEach(value => {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
    });
  });
});

describe('Sunder Roll Calculation (3d6 drop highest)', () => {
  it('should return 1 when all dice are 1', () => {
    const roller = new DiceRollerLogic(3, 6);
    const result = roller.calculateSunderResult([1, 1, 1]);
    expect(result).toBe(1);
  });
  
  it('should drop the highest die and sum the rest', () => {
    const roller = new DiceRollerLogic(3, 6);
    
    // Test case: [2, 3, 5] -> drop 5 -> 2 + 3 = 5
    let result = roller.calculateSunderResult([2, 3, 5]);
    expect(result).toBe(5);
    
    // Test case: [1, 2, 6] -> drop 6 -> 1 + 2 = 3
    result = roller.calculateSunderResult([1, 2, 6]);
    expect(result).toBe(3);
    
    // Test case: [4, 4, 4] -> drop 4 -> 4 + 4 = 8
    result = roller.calculateSunderResult([4, 4, 4]);
    expect(result).toBe(8);
  });
  
  it('should handle minimum result (all 1s)', () => {
    const roller = new DiceRollerLogic(3, 6);
    const result = roller.calculateSunderResult([1, 1, 1]);
    expect(result).toBe(1);
  });
  
  it('should handle near-minimum results', () => {
    const roller = new DiceRollerLogic(3, 6);
    
    // [1, 1, 2] -> drop 2 -> 1 + 1 = 2
    let result = roller.calculateSunderResult([1, 1, 2]);
    expect(result).toBe(2);
    
    // [1, 2, 2] -> drop 2 -> 1 + 2 = 3
    result = roller.calculateSunderResult([1, 2, 2]);
    expect(result).toBe(3);
  });
  
  it('should handle maximum result scenario', () => {
    const roller = new DiceRollerLogic(3, 6);
    
    // [5, 6, 6] -> drop 6 -> 5 + 6 = 11
    let result = roller.calculateSunderResult([5, 6, 6]);
    expect(result).toBe(11);
    
    // [6, 6, 6] -> drop 6 -> 6 + 6 = 12
    result = roller.calculateSunderResult([6, 6, 6]);
    expect(result).toBe(12);
  });
  
  it('should produce results in valid range (1-12 for 3d6)', () => {
    const roller = new DiceRollerLogic(3, 6);
    
    // Run many rolls to test distribution
    for (let i = 0; i < 100; i++) {
      const rolls = roller.rollDice();
      const result = roller.calculateSunderResult(rolls);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(12); // Max is 6+6 when highest is dropped
    }
  });
});

describe('Edge Cases', () => {
  it('should handle single die (nothing to drop)', () => {
    const roller = new DiceRollerLogic(1, 6);
    const result = roller.calculateSunderResult([5]);
    expect(result).toBe(0); // Single die gets dropped, nothing left
  });
  
  it('should handle two dice', () => {
    const roller = new DiceRollerLogic(2, 6);
    
    // [3, 5] -> drop 5 -> 3
    let result = roller.calculateSunderResult([3, 5]);
    expect(result).toBe(3);
    
    // [2, 2] -> drop 2 -> 2
    result = roller.calculateSunderResult([2, 2]);
    expect(result).toBe(2);
  });
});

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`Tests completed: ${testsPassed} passed, ${testsFailed} failed`);
console.log('='.repeat(50));

// Exit with appropriate code
process.exit(testsFailed > 0 ? 1 : 0);
