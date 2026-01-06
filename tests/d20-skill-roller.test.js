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
  constructor(potential = 10) {
    this._potential = potential;
  }
  
  get potential() { return this._potential; }
  
  rollD20() {
    return Math.floor(Math.random() * 20) + 1;
  }
  
  determineSuccess(roll, potential) {
    // Critical results override everything
    if (roll === 20) {
      return {
        level: 'CRIT',
        color: '#FFD700',
        bgColor: 'rgba(255, 215, 0, 0.2)',
        description: 'Critical Success!',
        emoji: '⭐'
      };
    }
    
    if (roll === 1) {
      return {
        level: 'MIFF',
        color: '#9966CC',
        bgColor: 'rgba(153, 102, 204, 0.2)',
        description: 'Critical Failure!',
        emoji: '💀'
      };
    }
    
    // Calculate success thresholds
    const successThreshold = potential;
    const costThreshold = potential - 3;
    const mixedThreshold = potential - 6;
    
    if (roll >= successThreshold) {
      return {
        level: 'SUCCESS',
        color: '#44ff44',
        bgColor: 'rgba(68, 255, 68, 0.2)',
        description: 'Success!',
        emoji: '✓'
      };
    }
    
    if (roll >= costThreshold) {
      return {
        level: 'SUCCESS_WITH_COST',
        color: '#FFA500',
        bgColor: 'rgba(255, 165, 0, 0.2)',
        description: 'Success with Cost',
        emoji: '⚠'
      };
    }
    
    if (roll >= mixedThreshold) {
      return {
        level: 'MIXED',
        color: '#FFA500',
        bgColor: 'rgba(255, 165, 0, 0.2)',
        description: 'Mixed Success',
        emoji: '~',
        flash: true
      };
    }
    
    return {
      level: 'FAIL',
      color: '#ff4444',
      bgColor: 'rgba(255, 68, 68, 0.2)',
      description: 'Failure',
      emoji: '✗'
    };
  }
}

// Run tests
describe('D20SkillRoller Initialization', () => {
  it('should initialize with default potential', () => {
    const roller = new D20SkillRollerLogic();
    expect(roller.potential).toBe(10);
  });
  
  it('should initialize with custom potential', () => {
    const roller = new D20SkillRollerLogic(15);
    expect(roller.potential).toBe(15);
  });
});

describe('D20 Roll', () => {
  it('should roll values between 1 and 20', () => {
    const roller = new D20SkillRollerLogic(10);
    
    for (let i = 0; i < 100; i++) {
      const result = roller.rollD20();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(20);
    }
  });
});

describe('Success Level Determination - Critical Results', () => {
  const roller = new D20SkillRollerLogic(10);
  
  it('should return CRIT for natural 20', () => {
    const result = roller.determineSuccess(20, 10);
    expect(result.level).toBe('CRIT');
    expect(result.color).toBe('#FFD700');
    expect(result.description).toBe('Critical Success!');
  });
  
  it('should return MIFF for natural 1', () => {
    const result = roller.determineSuccess(1, 10);
    expect(result.level).toBe('MIFF');
    expect(result.color).toBe('#9966CC');
    expect(result.description).toBe('Critical Failure!');
  });
  
  it('should return CRIT even if potential is low', () => {
    const result = roller.determineSuccess(20, 5);
    expect(result.level).toBe('CRIT');
  });
  
  it('should return MIFF even if potential is high', () => {
    const result = roller.determineSuccess(1, 18);
    expect(result.level).toBe('MIFF');
  });
});

describe('Success Level Determination - Regular Success', () => {
  const roller = new D20SkillRollerLogic(10);
  
  it('should return SUCCESS when roll equals potential', () => {
    const result = roller.determineSuccess(10, 10);
    expect(result.level).toBe('SUCCESS');
    expect(result.color).toBe('#44ff44');
  });
  
  it('should return SUCCESS when roll exceeds potential', () => {
    const result = roller.determineSuccess(15, 10);
    expect(result.level).toBe('SUCCESS');
  });
  
  it('should return SUCCESS when roll is just at threshold', () => {
    const result = roller.determineSuccess(12, 12);
    expect(result.level).toBe('SUCCESS');
  });
});

describe('Success Level Determination - Success with Cost', () => {
  const roller = new D20SkillRollerLogic(10);
  
  it('should return SUCCESS_WITH_COST when roll is 1-3 below potential', () => {
    // Potential 10, cost threshold is 7
    let result = roller.determineSuccess(9, 10);
    expect(result.level).toBe('SUCCESS_WITH_COST');
    expect(result.color).toBe('#FFA500');
    
    result = roller.determineSuccess(8, 10);
    expect(result.level).toBe('SUCCESS_WITH_COST');
    
    result = roller.determineSuccess(7, 10);
    expect(result.level).toBe('SUCCESS_WITH_COST');
  });
  
  it('should return SUCCESS_WITH_COST at exact cost threshold', () => {
    const result = roller.determineSuccess(12, 15); // 15 - 3 = 12
    expect(result.level).toBe('SUCCESS_WITH_COST');
  });
});

describe('Success Level Determination - Mixed Success', () => {
  const roller = new D20SkillRollerLogic(10);
  
  it('should return MIXED when roll is 4-6 below potential', () => {
    // Potential 10, mixed threshold is 4
    let result = roller.determineSuccess(6, 10);
    expect(result.level).toBe('MIXED');
    expect(result.flash).toBeTruthy();
    
    result = roller.determineSuccess(5, 10);
    expect(result.level).toBe('MIXED');
    
    result = roller.determineSuccess(4, 10);
    expect(result.level).toBe('MIXED');
  });
  
  it('should have flash property for mixed success', () => {
    const result = roller.determineSuccess(5, 10);
    expect(result.flash).toBeTruthy();
  });
});

describe('Success Level Determination - Failure', () => {
  const roller = new D20SkillRollerLogic(10);
  
  it('should return FAIL when roll is more than 6 below potential', () => {
    const result = roller.determineSuccess(3, 10); // 10 - 7 = 3
    expect(result.level).toBe('FAIL');
    expect(result.color).toBe('#ff4444');
  });
  
  it('should return FAIL for very low rolls', () => {
    const result = roller.determineSuccess(2, 10);
    expect(result.level).toBe('FAIL');
  });
  
  it('should not return FAIL for natural 1 (should be MIFF)', () => {
    const result = roller.determineSuccess(1, 10);
    expect(result.level).toBe('MIFF');
  });
});

describe('Success Level Determination - Various Potentials', () => {
  it('should work correctly with low potential (5)', () => {
    const roller = new D20SkillRollerLogic(5);
    
    expect(roller.determineSuccess(5, 5).level).toBe('SUCCESS');
    expect(roller.determineSuccess(4, 5).level).toBe('SUCCESS_WITH_COST');
    expect(roller.determineSuccess(2, 5).level).toBe('SUCCESS_WITH_COST');
    expect(roller.determineSuccess(1, 5).level).toBe('MIFF'); // Natural 1
    expect(roller.determineSuccess(20, 5).level).toBe('CRIT'); // Natural 20
  });
  
  it('should work correctly with high potential (18)', () => {
    const roller = new D20SkillRollerLogic(18);
    
    expect(roller.determineSuccess(18, 18).level).toBe('SUCCESS');
    expect(roller.determineSuccess(19, 18).level).toBe('SUCCESS');
    expect(roller.determineSuccess(17, 18).level).toBe('SUCCESS_WITH_COST');
    expect(roller.determineSuccess(15, 18).level).toBe('SUCCESS_WITH_COST');
    expect(roller.determineSuccess(14, 18).level).toBe('MIXED');
    expect(roller.determineSuccess(12, 18).level).toBe('MIXED');
    expect(roller.determineSuccess(11, 18).level).toBe('FAIL');
  });
  
  it('should work correctly with medium potential (12)', () => {
    const roller = new D20SkillRollerLogic(12);
    
    expect(roller.determineSuccess(12, 12).level).toBe('SUCCESS');
    expect(roller.determineSuccess(11, 12).level).toBe('SUCCESS_WITH_COST');
    expect(roller.determineSuccess(9, 12).level).toBe('SUCCESS_WITH_COST');
    expect(roller.determineSuccess(8, 12).level).toBe('MIXED');
    expect(roller.determineSuccess(6, 12).level).toBe('MIXED');
    expect(roller.determineSuccess(5, 12).level).toBe('FAIL');
  });
});

describe('Edge Cases', () => {
  it('should handle potential of 1', () => {
    const roller = new D20SkillRollerLogic(1);
    
    expect(roller.determineSuccess(1, 1).level).toBe('MIFF'); // Natural 1
    expect(roller.determineSuccess(2, 1).level).toBe('SUCCESS');
    expect(roller.determineSuccess(20, 1).level).toBe('CRIT'); // Natural 20
  });
  
  it('should handle potential of 20', () => {
    const roller = new D20SkillRollerLogic(20);
    
    expect(roller.determineSuccess(20, 20).level).toBe('CRIT'); // Natural 20
    expect(roller.determineSuccess(19, 20).level).toBe('SUCCESS_WITH_COST');
    expect(roller.determineSuccess(1, 20).level).toBe('MIFF'); // Natural 1
  });
});

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`Tests completed: ${testsPassed} passed, ${testsFailed} failed`);
console.log('='.repeat(50));

// Exit with appropriate code
process.exit(testsFailed > 0 ? 1 : 0);
