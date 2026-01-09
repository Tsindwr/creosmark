/**
 * Tests for the VolatilityDiceRoller web component
 * 
 * Run with: node tests/volatility-dice-roller.test.js
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
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },
    toContain(expected) {
      if (!actual.includes(expected)) {
        throw new Error(`Expected ${actual} to contain ${expected}`);
      }
    }
  };
}

// VolatilityDiceRoller logic for testing (without DOM dependency)
class VolatilityDiceRollerLogic {
  constructor(dieSize = 4, poolSize = 1, stress = 0) {
    this._dieSize = dieSize;
    this._poolSize = poolSize;
    this._stress = stress;
  }
  
  get dieSize() { return this._dieSize; }
  get poolSize() { return this._poolSize; }
  get stress() { return this._stress; }
  
  rollDie() {
    return Math.floor(Math.random() * this._dieSize) + 1;
  }
  
  rollPool() {
    const results = [];
    for (let i = 0; i < this._poolSize; i++) {
      results.push(this.rollDie());
    }
    return results;
  }
  
  getJinxThreshold() {
    return Math.min(this._stress, this._dieSize - 1);
  }
  
  canExplode() {
    return this.getJinxThreshold() === (this._dieSize - 1);
  }
  
  isJinxed(value) {
    return value <= this.getJinxThreshold() && value > 0;
  }
  
  getPerkSlots() {
    const slots = {
      4: 2,
      6: 4,
      8: 6,
      10: 8,
      12: 10
    };
    return slots[this._dieSize] || 0;
  }
}

// Run tests
describe('VolatilityDiceRoller Initialization', () => {
  it('should initialize with default values', () => {
    const roller = new VolatilityDiceRollerLogic();
    expect(roller.dieSize).toBe(4);
    expect(roller.poolSize).toBe(1);
    expect(roller.stress).toBe(0);
  });
  
  it('should initialize with custom values', () => {
    const roller = new VolatilityDiceRollerLogic(8, 3, 2);
    expect(roller.dieSize).toBe(8);
    expect(roller.poolSize).toBe(3);
    expect(roller.stress).toBe(2);
  });
});

describe('Single Die Roll', () => {
  it('should roll d4 values between 1 and 4', () => {
    const roller = new VolatilityDiceRollerLogic(4, 1, 0);
    
    for (let i = 0; i < 50; i++) {
      const result = roller.rollDie();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(4);
    }
  });
  
  it('should roll d6 values between 1 and 6', () => {
    const roller = new VolatilityDiceRollerLogic(6, 1, 0);
    
    for (let i = 0; i < 50; i++) {
      const result = roller.rollDie();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    }
  });
  
  it('should roll d8 values between 1 and 8', () => {
    const roller = new VolatilityDiceRollerLogic(8, 1, 0);
    
    for (let i = 0; i < 50; i++) {
      const result = roller.rollDie();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(8);
    }
  });
  
  it('should roll d10 values between 1 and 10', () => {
    const roller = new VolatilityDiceRollerLogic(10, 1, 0);
    
    for (let i = 0; i < 50; i++) {
      const result = roller.rollDie();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    }
  });
  
  it('should roll d12 values between 1 and 12', () => {
    const roller = new VolatilityDiceRollerLogic(12, 1, 0);
    
    for (let i = 0; i < 50; i++) {
      const result = roller.rollDie();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(12);
    }
  });
});

describe('Pool Roll', () => {
  it('should roll the correct number of dice', () => {
    const roller = new VolatilityDiceRollerLogic(6, 3, 0);
    const results = roller.rollPool();
    
    expect(results.length).toBe(3);
  });
  
  it('should return array with values in valid range', () => {
    const roller = new VolatilityDiceRollerLogic(6, 5, 0);
    const results = roller.rollPool();
    
    results.forEach(value => {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
    });
  });
  
  it('should work with single die pool', () => {
    const roller = new VolatilityDiceRollerLogic(4, 1, 0);
    const results = roller.rollPool();
    
    expect(results.length).toBe(1);
    expect(results[0]).toBeGreaterThanOrEqual(1);
    expect(results[0]).toBeLessThanOrEqual(4);
  });
});

describe('Jinx Threshold Calculation', () => {
  it('should return 0 when stress is 0', () => {
    const roller = new VolatilityDiceRollerLogic(4, 1, 0);
    expect(roller.getJinxThreshold()).toBe(0);
  });
  
  it('should equal stress when stress < die_size - 1', () => {
    const roller = new VolatilityDiceRollerLogic(6, 1, 2);
    expect(roller.getJinxThreshold()).toBe(2);
  });
  
  it('should cap at die_size - 1', () => {
    const roller = new VolatilityDiceRollerLogic(4, 1, 5);
    expect(roller.getJinxThreshold()).toBe(3); // d4 max jinx is 3
  });
  
  it('should work correctly for d6', () => {
    expect(new VolatilityDiceRollerLogic(6, 1, 10).getJinxThreshold()).toBe(5);
  });
  
  it('should work correctly for d8', () => {
    expect(new VolatilityDiceRollerLogic(8, 1, 10).getJinxThreshold()).toBe(7);
  });
  
  it('should work correctly for d10', () => {
    expect(new VolatilityDiceRollerLogic(10, 1, 10).getJinxThreshold()).toBe(9);
  });
  
  it('should work correctly for d12', () => {
    expect(new VolatilityDiceRollerLogic(12, 1, 15).getJinxThreshold()).toBe(11);
  });
});

describe('Exploding Dice Logic', () => {
  it('should not explode when jinx threshold is not maxed', () => {
    const roller = new VolatilityDiceRollerLogic(4, 1, 0);
    expect(roller.canExplode()).toBeFalsy();
  });
  
  it('should allow exploding when jinx threshold is maxed', () => {
    const roller = new VolatilityDiceRollerLogic(4, 1, 3);
    expect(roller.canExplode()).toBeTruthy();
  });
  
  it('should allow exploding for d6 when stress >= 5', () => {
    expect(new VolatilityDiceRollerLogic(6, 1, 5).canExplode()).toBeTruthy();
    expect(new VolatilityDiceRollerLogic(6, 1, 10).canExplode()).toBeTruthy();
  });
  
  it('should allow exploding for d12 when stress >= 11', () => {
    expect(new VolatilityDiceRollerLogic(12, 1, 11).canExplode()).toBeTruthy();
    expect(new VolatilityDiceRollerLogic(12, 1, 20).canExplode()).toBeTruthy();
  });
});

describe('Jinxed Value Detection', () => {
  it('should not mark any values as jinxed when stress is 0', () => {
    const roller = new VolatilityDiceRollerLogic(6, 1, 0);
    
    expect(roller.isJinxed(1)).toBeFalsy();
    expect(roller.isJinxed(3)).toBeFalsy();
    expect(roller.isJinxed(6)).toBeFalsy();
  });
  
  it('should mark values <= threshold as jinxed', () => {
    const roller = new VolatilityDiceRollerLogic(6, 1, 2);
    
    expect(roller.isJinxed(1)).toBeTruthy();
    expect(roller.isJinxed(2)).toBeTruthy();
    expect(roller.isJinxed(3)).toBeFalsy();
    expect(roller.isJinxed(4)).toBeFalsy();
  });
  
  it('should handle maxed jinx threshold', () => {
    const roller = new VolatilityDiceRollerLogic(4, 1, 10);
    const threshold = roller.getJinxThreshold(); // Should be 3
    
    expect(roller.isJinxed(1)).toBeTruthy();
    expect(roller.isJinxed(2)).toBeTruthy();
    expect(roller.isJinxed(3)).toBeTruthy();
    expect(roller.isJinxed(4)).toBeFalsy(); // Max value never jinxed
  });
  
  it('should not mark 0 or negative as jinxed', () => {
    const roller = new VolatilityDiceRollerLogic(6, 1, 3);
    
    expect(roller.isJinxed(0)).toBeFalsy();
    expect(roller.isJinxed(-1)).toBeFalsy();
  });
});

describe('Perk Slots', () => {
  it('should return 2 slots for d4', () => {
    const roller = new VolatilityDiceRollerLogic(4, 1, 0);
    expect(roller.getPerkSlots()).toBe(2);
  });
  
  it('should return 4 slots for d6', () => {
    const roller = new VolatilityDiceRollerLogic(6, 1, 0);
    expect(roller.getPerkSlots()).toBe(4);
  });
  
  it('should return 6 slots for d8', () => {
    const roller = new VolatilityDiceRollerLogic(8, 1, 0);
    expect(roller.getPerkSlots()).toBe(6);
  });
  
  it('should return 8 slots for d10', () => {
    const roller = new VolatilityDiceRollerLogic(10, 1, 0);
    expect(roller.getPerkSlots()).toBe(8);
  });
  
  it('should return 10 slots for d12', () => {
    const roller = new VolatilityDiceRollerLogic(12, 1, 0);
    expect(roller.getPerkSlots()).toBe(10);
  });
});

describe('Edge Cases', () => {
  it('should handle large pool sizes', () => {
    const roller = new VolatilityDiceRollerLogic(6, 10, 0);
    const results = roller.rollPool();
    
    expect(results.length).toBe(10);
    results.forEach(value => {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
    });
  });
  
  it('should handle very high stress values', () => {
    const roller = new VolatilityDiceRollerLogic(4, 1, 100);
    // Should still cap at die_size - 1
    expect(roller.getJinxThreshold()).toBe(3);
  });
  
  it('should handle different die sizes with same pool', () => {
    const d4Roller = new VolatilityDiceRollerLogic(4, 3, 0);
    const d12Roller = new VolatilityDiceRollerLogic(12, 3, 0);
    
    expect(d4Roller.rollPool().length).toBe(3);
    expect(d12Roller.rollPool().length).toBe(3);
  });
});

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`Tests completed: ${testsPassed} passed, ${testsFailed} failed`);
console.log('='.repeat(50));

// Exit with appropriate code
process.exit(testsFailed > 0 ? 1 : 0);
