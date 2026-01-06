/**
 * Tests for the D20SkillRoller web component
 * 
 * Run with: node tests/d20-skill-roller.test.js
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
    }
  };
}

// D20SkillRoller logic for testing (without DOM dependency)
class D20SkillRollerLogic {
  constructor(potential = 10, resistance = 0) {
    this._potential = potential;
    this._resistance = resistance;
  }
  
  get potential() { return this._potential; }
  get resistance() { return this._resistance; }
  
  rollD20() {
    return Math.floor(Math.random() * 20) + 1;
  }
  
  /**
   * Determine success level based on Sunder D20 "Roll Under" resolution rules
   * 
   * Sunder uses a variant "Roll Under" system with Resistance thresholds:
   * - Crit: Roll equals Potential (P)
   * - Success: Roll is between Resistance (R) and Potential (P), exclusive: R < roll < P
   * - Mixed: Roll is between 1 and Resistance (R), inclusive: 1 ≤ roll ≤ R
   * - Fail: Roll is between Potential (P) and 20, exclusive: P < roll < 20
   * - Miff: Roll equals 20 (critical failure)
   */
  determineSuccess(roll, potential, resistance) {
    // Critical failures take priority - MIFF always triggers on natural 20
    if (roll === 20) {
      return {
        level: 'MIFF',
        color: '#9966CC',
        bgColor: 'rgba(153, 102, 204, 0.2)',
        description: 'Critical Failure!',
        emoji: '💀',
        hasCost: true
      };
    }
    
    // Critical success - roll equals potential (but not 20)
    if (roll === potential) {
      return {
        level: 'CRIT',
        color: '#FFD700',
        bgColor: 'rgba(255, 215, 0, 0.2)',
        description: 'Critical Success!',
        emoji: '⭐',
        hasCost: false
      };
    }
    
    // Success: R < roll < P
    if (roll > resistance && roll < potential) {
      return {
        level: 'SUCCESS',
        color: '#44ff44',
        bgColor: 'rgba(68, 255, 68, 0.2)',
        description: 'Success!',
        emoji: '✓',
        hasCost: false
      };
    }
    
    // Mixed: 1 ≤ roll ≤ R
    if (roll >= 1 && roll <= resistance) {
      return {
        level: 'MIXED',
        color: '#FFA500',
        bgColor: 'rgba(255, 165, 0, 0.2)',
        description: 'Mixed Success',
        emoji: '~',
        flash: true,
        hasCost: true
      };
    }
    
    // Fail: P < roll < 20
    if (roll > potential && roll < 20) {
      return {
        level: 'FAIL',
        color: '#ff4444',
        bgColor: 'rgba(255, 68, 68, 0.2)',
        description: 'Failure',
        emoji: '✗',
        hasCost: true
      };
    }
    
    // Fallback
    return {
      level: 'UNKNOWN',
      color: '#888888',
      bgColor: 'rgba(136, 136, 136, 0.2)',
      description: 'Unknown Result',
      emoji: '?',
      hasCost: false
    };
  }
}

// Run tests
describe('D20SkillRoller Initialization', () => {
  it('should initialize with default potential and resistance', () => {
    const roller = new D20SkillRollerLogic();
    expect(roller.potential).toBe(10);
    expect(roller.resistance).toBe(0);
  });
  
  it('should initialize with custom potential and resistance', () => {
    const roller = new D20SkillRollerLogic(15, 3);
    expect(roller.potential).toBe(15);
    expect(roller.resistance).toBe(3);
  });
});

describe('D20 Roll', () => {
  it('should roll values between 1 and 20', () => {
    const roller = new D20SkillRollerLogic(10, 0);
    
    for (let i = 0; i < 100; i++) {
      const result = roller.rollD20();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(20);
    }
  });
});

describe('Success Level Determination - Critical Results', () => {
  it('should return CRIT when roll equals potential', () => {
    const roller = new D20SkillRollerLogic(10, 0);
    const result = roller.determineSuccess(10, 10, 0);
    expect(result.level).toBe('CRIT');
    expect(result.color).toBe('#FFD700');
    expect(result.description).toBe('Critical Success!');
    expect(result.hasCost).toBe(false);
  });
  
  it('should return MIFF for natural 20', () => {
    const roller = new D20SkillRollerLogic(10, 0);
    const result = roller.determineSuccess(20, 10, 0);
    expect(result.level).toBe('MIFF');
    expect(result.color).toBe('#9966CC');
    expect(result.description).toBe('Critical Failure!');
    expect(result.hasCost).toBe(true);
  });
  
  it('should return CRIT for any potential value when roll equals it', () => {
    const roller = new D20SkillRollerLogic(5, 0);
    expect(roller.determineSuccess(5, 5, 0).level).toBe('CRIT');
    
    expect(roller.determineSuccess(15, 15, 3).level).toBe('CRIT');
    expect(roller.determineSuccess(18, 18, 5).level).toBe('CRIT');
  });
  
  it('should return MIFF for 20 regardless of potential', () => {
    const roller = new D20SkillRollerLogic(5, 0);
    expect(roller.determineSuccess(20, 5, 0).level).toBe('MIFF');
    expect(roller.determineSuccess(20, 18, 5).level).toBe('MIFF');
  });
});

describe('Success Level Determination - Success (R < roll < P)', () => {
  it('should return SUCCESS when roll is between resistance and potential', () => {
    const roller = new D20SkillRollerLogic(10, 3);
    
    // Roll of 5: 3 < 5 < 10 → SUCCESS
    const result = roller.determineSuccess(5, 10, 3);
    expect(result.level).toBe('SUCCESS');
    expect(result.color).toBe('#44ff44');
    expect(result.hasCost).toBe(false);
  });
  
  it('should return SUCCESS for roll just above resistance', () => {
    const roller = new D20SkillRollerLogic(10, 3);
    // Roll of 4: 3 < 4 < 10 → SUCCESS
    expect(roller.determineSuccess(4, 10, 3).level).toBe('SUCCESS');
  });
  
  it('should return SUCCESS for roll just below potential', () => {
    const roller = new D20SkillRollerLogic(10, 3);
    // Roll of 9: 3 < 9 < 10 → SUCCESS
    expect(roller.determineSuccess(9, 10, 3).level).toBe('SUCCESS');
  });
  
  it('should work with resistance of 0', () => {
    const roller = new D20SkillRollerLogic(10, 0);
    // Roll of 5: 0 < 5 < 10 → SUCCESS
    expect(roller.determineSuccess(5, 10, 0).level).toBe('SUCCESS');
    expect(roller.determineSuccess(1, 10, 0).level).toBe('SUCCESS'); // Edge case: 0 < 1 < 10
  });
});

describe('Success Level Determination - Mixed (1 ≤ roll ≤ R)', () => {
  it('should return MIXED when roll is at or below resistance', () => {
    const roller = new D20SkillRollerLogic(10, 5);
    
    // Roll of 3: 1 ≤ 3 ≤ 5 → MIXED
    const result = roller.determineSuccess(3, 10, 5);
    expect(result.level).toBe('MIXED');
    expect(result.color).toBe('#FFA500');
    expect(result.flash).toBe(true);
    expect(result.hasCost).toBe(true);
  });
  
  it('should return MIXED when roll equals resistance', () => {
    const roller = new D20SkillRollerLogic(10, 5);
    // Roll of 5: 1 ≤ 5 ≤ 5 → MIXED
    expect(roller.determineSuccess(5, 10, 5).level).toBe('MIXED');
  });
  
  it('should return MIXED for roll of 1 when resistance > 0', () => {
    const roller = new D20SkillRollerLogic(10, 5);
    // Roll of 1: 1 ≤ 1 ≤ 5 → MIXED
    expect(roller.determineSuccess(1, 10, 5).level).toBe('MIXED');
  });
  
  it('should have flash property for mixed success', () => {
    const roller = new D20SkillRollerLogic(10, 3);
    const result = roller.determineSuccess(2, 10, 3);
    expect(result.flash).toBeTruthy();
  });
});

describe('Success Level Determination - Fail (P < roll < 20)', () => {
  it('should return FAIL when roll is above potential but below 20', () => {
    const roller = new D20SkillRollerLogic(10, 3);
    
    // Roll of 15: 10 < 15 < 20 → FAIL
    const result = roller.determineSuccess(15, 10, 3);
    expect(result.level).toBe('FAIL');
    expect(result.color).toBe('#ff4444');
    expect(result.hasCost).toBe(true);
  });
  
  it('should return FAIL for roll just above potential', () => {
    const roller = new D20SkillRollerLogic(10, 3);
    // Roll of 11: 10 < 11 < 20 → FAIL
    expect(roller.determineSuccess(11, 10, 3).level).toBe('FAIL');
  });
  
  it('should return FAIL for roll of 19', () => {
    const roller = new D20SkillRollerLogic(10, 3);
    // Roll of 19: 10 < 19 < 20 → FAIL
    expect(roller.determineSuccess(19, 10, 3).level).toBe('FAIL');
  });
  
  it('should not return FAIL for roll of 20 (should be MIFF)', () => {
    const roller = new D20SkillRollerLogic(10, 3);
    expect(roller.determineSuccess(20, 10, 3).level).toBe('MIFF');
  });
});

describe('Success Level Determination - Various Potential/Resistance Combinations', () => {
  it('should work correctly with P=10, R=0', () => {
    const roller = new D20SkillRollerLogic(10, 0);
    
    // No resistance means no mixed range
    expect(roller.determineSuccess(1, 10, 0).level).toBe('SUCCESS'); // 0 < 1 < 10
    expect(roller.determineSuccess(5, 10, 0).level).toBe('SUCCESS'); // 0 < 5 < 10
    expect(roller.determineSuccess(9, 10, 0).level).toBe('SUCCESS'); // 0 < 9 < 10
    expect(roller.determineSuccess(10, 10, 0).level).toBe('CRIT');   // roll = P
    expect(roller.determineSuccess(11, 10, 0).level).toBe('FAIL');   // 10 < 11 < 20
    expect(roller.determineSuccess(20, 10, 0).level).toBe('MIFF');   // roll = 20
  });
  
  it('should work correctly with P=15, R=5', () => {
    const roller = new D20SkillRollerLogic(15, 5);
    
    expect(roller.determineSuccess(3, 15, 5).level).toBe('MIXED');   // 1 ≤ 3 ≤ 5
    expect(roller.determineSuccess(5, 15, 5).level).toBe('MIXED');   // 1 ≤ 5 ≤ 5
    expect(roller.determineSuccess(6, 15, 5).level).toBe('SUCCESS'); // 5 < 6 < 15
    expect(roller.determineSuccess(10, 15, 5).level).toBe('SUCCESS'); // 5 < 10 < 15
    expect(roller.determineSuccess(14, 15, 5).level).toBe('SUCCESS'); // 5 < 14 < 15
    expect(roller.determineSuccess(15, 15, 5).level).toBe('CRIT');   // roll = P
    expect(roller.determineSuccess(16, 15, 5).level).toBe('FAIL');   // 15 < 16 < 20
    expect(roller.determineSuccess(20, 15, 5).level).toBe('MIFF');   // roll = 20
  });
  
  it('should work correctly with P=5, R=2', () => {
    const roller = new D20SkillRollerLogic(5, 2);
    
    expect(roller.determineSuccess(1, 5, 2).level).toBe('MIXED');    // 1 ≤ 1 ≤ 2
    expect(roller.determineSuccess(2, 5, 2).level).toBe('MIXED');    // 1 ≤ 2 ≤ 2
    expect(roller.determineSuccess(3, 5, 2).level).toBe('SUCCESS');  // 2 < 3 < 5
    expect(roller.determineSuccess(4, 5, 2).level).toBe('SUCCESS');  // 2 < 4 < 5
    expect(roller.determineSuccess(5, 5, 2).level).toBe('CRIT');     // roll = P
    expect(roller.determineSuccess(6, 5, 2).level).toBe('FAIL');     // 5 < 6 < 20
    expect(roller.determineSuccess(20, 5, 2).level).toBe('MIFF');    // roll = 20
  });
  
  it('should work correctly with high P=18, R=8', () => {
    const roller = new D20SkillRollerLogic(18, 8);
    
    expect(roller.determineSuccess(5, 18, 8).level).toBe('MIXED');   // 1 ≤ 5 ≤ 8
    expect(roller.determineSuccess(8, 18, 8).level).toBe('MIXED');   // 1 ≤ 8 ≤ 8
    expect(roller.determineSuccess(9, 18, 8).level).toBe('SUCCESS'); // 8 < 9 < 18
    expect(roller.determineSuccess(15, 18, 8).level).toBe('SUCCESS'); // 8 < 15 < 18
    expect(roller.determineSuccess(17, 18, 8).level).toBe('SUCCESS'); // 8 < 17 < 18
    expect(roller.determineSuccess(18, 18, 8).level).toBe('CRIT');   // roll = P
    expect(roller.determineSuccess(19, 18, 8).level).toBe('FAIL');   // 18 < 19 < 20
    expect(roller.determineSuccess(20, 18, 8).level).toBe('MIFF');   // roll = 20
  });
});

describe('Edge Cases', () => {
  it('should handle P=1, R=0 (minimum values)', () => {
    const roller = new D20SkillRollerLogic(1, 0);
    
    expect(roller.determineSuccess(1, 1, 0).level).toBe('CRIT');     // roll = P
    expect(roller.determineSuccess(2, 1, 0).level).toBe('FAIL');     // 1 < 2 < 20
    expect(roller.determineSuccess(20, 1, 0).level).toBe('MIFF');    // roll = 20
  });
  
  it('should handle P=19, R=0 (high potential)', () => {
    const roller = new D20SkillRollerLogic(19, 0);
    
    expect(roller.determineSuccess(1, 19, 0).level).toBe('SUCCESS'); // 0 < 1 < 19
    expect(roller.determineSuccess(10, 19, 0).level).toBe('SUCCESS'); // 0 < 10 < 19
    expect(roller.determineSuccess(18, 19, 0).level).toBe('SUCCESS'); // 0 < 18 < 19
    expect(roller.determineSuccess(19, 19, 0).level).toBe('CRIT');   // roll = P
    expect(roller.determineSuccess(20, 19, 0).level).toBe('MIFF');   // roll = 20
  });
  
  it('should handle P=20 (maximum potential)', () => {
    const roller = new D20SkillRollerLogic(20, 5);
    
    expect(roller.determineSuccess(3, 20, 5).level).toBe('MIXED');   // 1 ≤ 3 ≤ 5
    expect(roller.determineSuccess(10, 20, 5).level).toBe('SUCCESS'); // 5 < 10 < 20
    expect(roller.determineSuccess(19, 20, 5).level).toBe('SUCCESS'); // 5 < 19 < 20
    expect(roller.determineSuccess(20, 20, 5).level).toBe('MIFF');   // roll = 20 (MIFF overrides P=20)
  });
  
  it('should handle R equal to P-1 (minimal success range)', () => {
    const roller = new D20SkillRollerLogic(10, 9);
    
    expect(roller.determineSuccess(5, 10, 9).level).toBe('MIXED');   // 1 ≤ 5 ≤ 9
    expect(roller.determineSuccess(9, 10, 9).level).toBe('MIXED');   // 1 ≤ 9 ≤ 9
    // No success range since R=9, P=10, so no values between them
    expect(roller.determineSuccess(10, 10, 9).level).toBe('CRIT');   // roll = P
    expect(roller.determineSuccess(11, 10, 9).level).toBe('FAIL');   // 10 < 11 < 20
  });
});

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`Tests completed: ${testsPassed} passed, ${testsFailed} failed`);
console.log('='.repeat(50));

// Exit with appropriate code
process.exit(testsFailed > 0 ? 1 : 0);
