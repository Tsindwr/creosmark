/**
 * Tests for the VolatilityDie System
 * 
 * Run with: node tests/volatility-die.test.js
 */

import { VolatilityDie } from '../src/services/volatility-die.js';

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
    toBeGreaterThan(expected) {
      if (!(actual > expected)) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeGreaterThanOrEqual(expected) {
      if (!(actual >= expected)) {
        throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
      }
    },
    toBeLessThan(expected) {
      if (!(actual < expected)) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
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
    toThrow() {
      let threw = false;
      try {
        actual();
      } catch (e) {
        threw = true;
      }
      if (!threw) {
        throw new Error('Expected function to throw an error');
      }
    }
  };
}

// Run tests
describe('VolatilityDie Initialization', () => {
  it('should initialize with default d4', () => {
    const die = new VolatilityDie();
    expect(die.dieSize).toBe('d4');
    expect(die.getMaxValue()).toBe(4);
    expect(die.getNumPerkSlots()).toBe(2);
    expect(die.isCharged).toBeFalsy();
  });

  it('should initialize with specified die size', () => {
    const die = new VolatilityDie('d8');
    expect(die.dieSize).toBe('d8');
    expect(die.getMaxValue()).toBe(8);
    expect(die.getNumPerkSlots()).toBe(6);
  });
});

describe('Perk Slots', () => {
  it('should return correct number of slots for each die size', () => {
    expect(new VolatilityDie('d4').getNumPerkSlots()).toBe(2);
    expect(new VolatilityDie('d6').getNumPerkSlots()).toBe(4);
    expect(new VolatilityDie('d8').getNumPerkSlots()).toBe(6);
    expect(new VolatilityDie('d10').getNumPerkSlots()).toBe(8);
    expect(new VolatilityDie('d12').getNumPerkSlots()).toBe(10);
  });

  it('should return valid slot numbers (excluding min and max)', () => {
    const d4 = new VolatilityDie('d4');
    const validSlots = d4.getValidSlotNumbers();
    expect(validSlots.length).toBe(2);
    expect(validSlots).toEqual([2, 3]);
  });

  it('should validate slot numbers correctly', () => {
    const die = new VolatilityDie('d6');
    expect(die.isValidSlot(1)).toBeFalsy(); // min value
    expect(die.isValidSlot(2)).toBeTruthy();
    expect(die.isValidSlot(5)).toBeTruthy();
    expect(die.isValidSlot(6)).toBeFalsy(); // max value
    expect(die.isValidSlot(7)).toBeFalsy(); // out of range
  });
});

describe('Perk Assignment', () => {
  it('should assign perk to valid slot', () => {
    const die = new VolatilityDie('d6');
    const result = die.assignPerk(3, 'Refresh', 10);
    expect(result).toBeTruthy();
    expect(die.getPerkInSlot(3)).toBe('Refresh');
  });

  it('should not assign perk to invalid slot', () => {
    const die = new VolatilityDie('d6');
    expect(() => die.assignPerk(1, 'Refresh', 10)).toThrow();
    expect(() => die.assignPerk(6, 'Refresh', 10)).toThrow();
  });

  it('should not assign perk to slot > potential score', () => {
    const die = new VolatilityDie('d8');
    expect(() => die.assignPerk(6, 'Refresh', 5)).toThrow();
  });

  it('should assign perk to slot <= potential score', () => {
    const die = new VolatilityDie('d8');
    die.assignPerk(5, 'Refresh', 5);
    expect(die.getPerkInSlot(5)).toBe('Refresh');
  });

  it('should throw error for unknown perk', () => {
    const die = new VolatilityDie('d6');
    expect(() => die.assignPerk(3, 'UnknownPerk', 10)).toThrow();
  });
});

describe('Perk Management', () => {
  it('should remove perk from slot', () => {
    const die = new VolatilityDie('d6');
    die.assignPerk(3, 'Refresh', 10);
    die.removePerk(3);
    expect(die.getPerkInSlot(3)).toBe(null);
  });

  it('should swap perks between slots', () => {
    const die = new VolatilityDie('d8');
    die.assignPerk(3, 'Refresh', 10);
    die.assignPerk(5, 'Drive', 10);
    
    die.swapPerks(3, 5);
    
    expect(die.getPerkInSlot(3)).toBe('Drive');
    expect(die.getPerkInSlot(5)).toBe('Refresh');
  });

  it('should move perk from one slot to another', () => {
    const die = new VolatilityDie('d8');
    die.assignPerk(3, 'Refresh', 10);
    
    die.movePerk(3, 5, 10);
    
    expect(die.getPerkInSlot(3)).toBe(null);
    expect(die.getPerkInSlot(5)).toBe('Refresh');
  });

  it('should throw error when moving from empty slot', () => {
    const die = new VolatilityDie('d8');
    expect(() => die.movePerk(3, 5, 10)).toThrow();
  });
});

describe('All Slots Filled Check', () => {
  it('should return false when slots are empty', () => {
    const die = new VolatilityDie('d4');
    expect(die.areAllSlotsFilled()).toBeFalsy();
  });

  it('should return false when some slots are filled', () => {
    const die = new VolatilityDie('d4');
    die.assignPerk(2, 'Refresh', 10);
    expect(die.areAllSlotsFilled()).toBeFalsy();
  });

  it('should return true when all slots are filled', () => {
    const die = new VolatilityDie('d4');
    die.assignPerk(2, 'Refresh', 10);
    die.assignPerk(3, 'Drive', 10);
    expect(die.areAllSlotsFilled()).toBeTruthy();
  });
});

describe('Charge System', () => {
  it('should get correct charge cost for each die size', () => {
    expect(new VolatilityDie('d4').getChargeCost()).toBe(2);
    expect(new VolatilityDie('d6').getChargeCost()).toBe(4);
    expect(new VolatilityDie('d8').getChargeCost()).toBe(6);
  });

  it('should not purchase charge when slots not filled', () => {
    const die = new VolatilityDie('d4');
    expect(() => die.purchaseCharge()).toThrow();
  });

  it('should purchase charge when all slots filled', () => {
    const die = new VolatilityDie('d4');
    die.assignPerk(2, 'Refresh', 10);
    die.assignPerk(3, 'Drive', 10);
    
    const result = die.purchaseCharge();
    expect(result).toBeTruthy();
    expect(die.isCharged).toBeTruthy();
  });

  it('should not purchase charge twice', () => {
    const die = new VolatilityDie('d4');
    die.assignPerk(2, 'Refresh', 10);
    die.assignPerk(3, 'Drive', 10);
    die.purchaseCharge();
    
    const result = die.purchaseCharge();
    expect(result).toBeFalsy();
  });
});

describe('Die Rolling', () => {
  it('should roll values in valid range', () => {
    const die = new VolatilityDie('d6');
    for (let i = 0; i < 20; i++) {
      const roll = die.roll();
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(6);
    }
  });
});

describe('Exploding Die', () => {
  it('should explode when charged, max value, and max jinx threshold', () => {
    const die = new VolatilityDie('d4');
    die.assignPerk(2, 'Refresh', 10);
    die.assignPerk(3, 'Drive', 10);
    die.purchaseCharge();
    
    expect(die.shouldExplode(4, 3)).toBeTruthy(); // max value, max jinx
  });

  it('should not explode when not charged', () => {
    const die = new VolatilityDie('d4');
    expect(die.shouldExplode(4, 3)).toBeFalsy();
  });

  it('should not explode when not max value', () => {
    const die = new VolatilityDie('d4');
    die.assignPerk(2, 'Refresh', 10);
    die.assignPerk(3, 'Drive', 10);
    die.purchaseCharge();
    
    expect(die.shouldExplode(3, 3)).toBeFalsy();
  });

  it('should not explode when stress < max jinx threshold', () => {
    const die = new VolatilityDie('d4');
    die.assignPerk(2, 'Refresh', 10);
    die.assignPerk(3, 'Drive', 10);
    die.purchaseCharge();
    
    expect(die.shouldExplode(4, 2)).toBeFalsy(); // stress < 3
  });

  it('should upgrade die size when exploding', () => {
    const die = new VolatilityDie('d4');
    die.assignPerk(2, 'Refresh', 10);
    die.assignPerk(3, 'Drive', 10);
    die.purchaseCharge();
    
    const result = die.explode();
    
    expect(result.exploded).toBeTruthy();
    expect(result.oldDieSize).toBe('d4');
    expect(result.newDieSize).toBe('d6');
    expect(die.dieSize).toBe('d6');
  });

  it('should clear perks and charge when exploding', () => {
    const die = new VolatilityDie('d4');
    die.assignPerk(2, 'Refresh', 10);
    die.assignPerk(3, 'Drive', 10);
    die.purchaseCharge();
    
    die.explode();
    
    expect(die.getPerkInSlot(2)).toBe(null);
    expect(die.getPerkInSlot(3)).toBe(null);
    expect(die.isCharged).toBeFalsy();
  });

  it('should not explode d12 (already max)', () => {
    const die = new VolatilityDie('d12');
    const result = die.explode();
    
    expect(result.exploded).toBeFalsy();
    expect(die.dieSize).toBe('d12');
  });
});

describe('Jinx Threshold', () => {
  it('should calculate jinx threshold correctly', () => {
    const die = new VolatilityDie('d6');
    expect(die.getJinxThreshold(2)).toBe(2);
    expect(die.getJinxThreshold(4)).toBe(4);
    expect(die.getJinxThreshold(10)).toBe(5); // capped at max-1
  });

  it('should check if value is in jinx threshold', () => {
    const die = new VolatilityDie('d6');
    expect(die.isInJinxThreshold(2, 3)).toBeTruthy();
    expect(die.isInJinxThreshold(4, 3)).toBeFalsy();
    expect(die.isInJinxThreshold(3, 0)).toBeFalsy(); // no jinx when stress=0
  });
});

describe('JSON Serialization', () => {
  it('should serialize to JSON', () => {
    const die = new VolatilityDie('d6');
    die.assignPerk(3, 'Refresh', 10);
    die.assignPerk(4, 'Drive', 10);
    
    const json = die.toJSON();
    
    expect(json.dieSize).toBe('d6');
    expect(json.perkSlots[3]).toBe('Refresh');
    expect(json.perkSlots[4]).toBe('Drive');
  });

  it('should deserialize from JSON', () => {
    const data = {
      dieSize: 'd8',
      perkSlots: { 3: 'Refresh', 5: 'Burn' },
      isCharged: true,
      purchasedPerks: ['Refresh', 'Burn']
    };
    
    const die = VolatilityDie.fromJSON(data);
    
    expect(die.dieSize).toBe('d8');
    expect(die.getPerkInSlot(3)).toBe('Refresh');
    expect(die.getPerkInSlot(5)).toBe('Burn');
    expect(die.isCharged).toBeTruthy();
  });
});

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`Tests completed: ${testsPassed} passed, ${testsFailed} failed`);
console.log('='.repeat(50));

// Exit with appropriate code
process.exit(testsFailed > 0 ? 1 : 0);
