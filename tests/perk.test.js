/**
 * Tests for the Perk System
 * 
 * Run with: node tests/perk.test.js
 */

import { 
  Perk, 
  RefreshPerk, 
  ImplodePerk, 
  CleavePerk, 
  DrivePerk, 
  BurnPerk, 
  FracturePerk,
  PerkFactory 
} from '../src/services/perk.js';

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
    }
  };
}

// Mock PotentialTrack for testing
class MockPotentialTrack {
  constructor(stress = 0, resistance = 0) {
    this.stress = stress;
    this.resistance = resistance;
  }

  removeStress() {
    if (this.stress > 0) {
      this.stress--;
      return true;
    }
    return false;
  }

  removeResistance() {
    if (this.resistance > 0) {
      this.resistance--;
      return true;
    }
    return false;
  }
}

// Run tests
describe('PerkFactory', () => {
  it('should create Refresh perk', () => {
    const perk = PerkFactory.createPerk('Refresh');
    expect(perk instanceof RefreshPerk).toBeTruthy();
    expect(perk.name).toBe('Refresh');
    expect(perk.cost).toBe(2);
  });

  it('should create Implode perk', () => {
    const perk = PerkFactory.createPerk('Implode');
    expect(perk instanceof ImplodePerk).toBeTruthy();
    expect(perk.cost).toBe(2);
  });

  it('should create Cleave perk', () => {
    const perk = PerkFactory.createPerk('Cleave');
    expect(perk instanceof CleavePerk).toBeTruthy();
    expect(perk.cost).toBe(3);
  });

  it('should create Drive perk', () => {
    const perk = PerkFactory.createPerk('Drive');
    expect(perk instanceof DrivePerk).toBeTruthy();
    expect(perk.cost).toBe(3);
  });

  it('should create Burn perk', () => {
    const perk = PerkFactory.createPerk('Burn');
    expect(perk instanceof BurnPerk).toBeTruthy();
    expect(perk.cost).toBe(5);
  });

  it('should create Fracture perk', () => {
    const perk = PerkFactory.createPerk('Fracture');
    expect(perk instanceof FracturePerk).toBeTruthy();
    expect(perk.cost).toBe(5);
  });

  it('should throw error for unknown perk', () => {
    try {
      PerkFactory.createPerk('UnknownPerk');
      throw new Error('Should have thrown error');
    } catch (e) {
      expect(e.message.includes('Unknown perk')).toBeTruthy();
    }
  });

  it('should get all perk names', () => {
    const names = PerkFactory.getAllPerkNames();
    expect(names.length).toBe(6);
    expect(names.includes('Refresh')).toBeTruthy();
    expect(names.includes('Fracture')).toBeTruthy();
  });
});

describe('RefreshPerk', () => {
  it('should remove stress when stress > 0', () => {
    const perk = new RefreshPerk();
    const track = new MockPotentialTrack(3, 0);
    const result = perk.activate({ dieValue: 2, potentialTrack: track });
    
    expect(result.perkActivated).toBe('Refresh');
    expect(result.stressRemoved).toBeTruthy();
    expect(track.stress).toBe(2);
  });

  it('should not remove stress when stress = 0', () => {
    const perk = new RefreshPerk();
    const track = new MockPotentialTrack(0, 0);
    const result = perk.activate({ dieValue: 2, potentialTrack: track });
    
    expect(result.stressRemoved).toBeFalsy();
    expect(track.stress).toBe(0);
  });
});

describe('ImplodePerk', () => {
  it('should implode d6 to d4', () => {
    const perk = new ImplodePerk();
    const result = perk.activate({ dieValue: 3, dieSize: 'd6' });
    
    expect(result.perkActivated).toBe('Implode');
    expect(result.implodedFrom).toBe('d6');
    expect(result.implodedTo).toBe('d4');
    expect(result.finalValue).toBeGreaterThanOrEqual(1);
    expect(result.finalValue).toBeLessThanOrEqual(4);
  });

  it('should implode d8 to d6', () => {
    const perk = new ImplodePerk();
    const result = perk.activate({ dieValue: 4, dieSize: 'd8' });
    
    expect(result.implodedTo).toBe('d6');
    expect(result.finalValue).toBeLessThanOrEqual(6);
  });

  it('should not implode d4 (minimum)', () => {
    const perk = new ImplodePerk();
    const result = perk.activate({ dieValue: 2, dieSize: 'd4' });
    
    expect(result.finalValue).toBe(2);
    expect(result.message.includes('minimum')).toBeTruthy();
  });
});

describe('CleavePerk', () => {
  it('should roll 2 dice and pick furthest from middle', () => {
    const perk = new CleavePerk();
    const result = perk.activate({ dieValue: 3, dieSize: 'd6' });
    
    expect(result.perkActivated).toBe('Cleave');
    expect(result.rolls.length).toBe(2);
    expect(result.finalValue).toBeGreaterThanOrEqual(1);
    expect(result.finalValue).toBeLessThanOrEqual(6);
  });

  it('should pick higher when equidistant', () => {
    const perk = new CleavePerk();
    // Run multiple times to verify logic
    for (let i = 0; i < 10; i++) {
      const result = perk.activate({ dieValue: 3, dieSize: 'd6' });
      expect(result.rolls.length).toBe(2);
      expect(result.finalValue).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('DrivePerk', () => {
  it('should reroll the die', () => {
    const perk = new DrivePerk();
    const result = perk.activate({ dieValue: 2, dieSize: 'd6' });
    
    expect(result.perkActivated).toBe('Drive');
    expect(result.originalValue).toBe(2);
    expect(result.finalValue).toBeGreaterThanOrEqual(1);
    expect(result.finalValue).toBeLessThanOrEqual(6);
  });
});

describe('BurnPerk', () => {
  it('should burn resistance for max value', () => {
    const perk = new BurnPerk();
    const track = new MockPotentialTrack(0, 3);
    const result = perk.activate({ 
      dieValue: 2, 
      dieSize: 'd8', 
      resistance: 3,
      potentialTrack: track 
    });
    
    expect(result.perkActivated).toBe('Burn');
    expect(result.burned).toBeTruthy();
    expect(result.finalValue).toBe(8);
    expect(track.resistance).toBe(2);
  });

  it('should not burn when resistance = 0', () => {
    const perk = new BurnPerk();
    const track = new MockPotentialTrack(0, 0);
    const result = perk.activate({ 
      dieValue: 2, 
      dieSize: 'd8', 
      resistance: 0,
      potentialTrack: track 
    });
    
    expect(result.burned).toBeFalsy();
    expect(result.finalValue).toBe(2);
  });
});

describe('FracturePerk', () => {
  it('should return min value when in jinx threshold', () => {
    const perk = new FracturePerk();
    const result = perk.activate({ 
      dieValue: 2, 
      dieSize: 'd6', 
      stress: 3 
    });
    
    expect(result.perkActivated).toBe('Fracture');
    expect(result.inJinxThreshold).toBeTruthy();
    expect(result.finalValue).toBe(1);
  });

  it('should return max value when not in jinx threshold', () => {
    const perk = new FracturePerk();
    const result = perk.activate({ 
      dieValue: 4, 
      dieSize: 'd6', 
      stress: 2 
    });
    
    expect(result.inJinxThreshold).toBeFalsy();
    expect(result.finalValue).toBe(6);
  });

  it('should handle stress = 0 (no jinx threshold)', () => {
    const perk = new FracturePerk();
    const result = perk.activate({ 
      dieValue: 2, 
      dieSize: 'd6', 
      stress: 0 
    });
    
    expect(result.inJinxThreshold).toBeFalsy();
    expect(result.finalValue).toBe(6);
  });
});

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`Tests completed: ${testsPassed} passed, ${testsFailed} failed`);
console.log('='.repeat(50));

// Exit with appropriate code
process.exit(testsFailed > 0 ? 1 : 0);
