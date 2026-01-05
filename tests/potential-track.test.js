/**
 * Tests for the PotentialTrack web component
 * 
 * Run with: node tests/potential-track.test.js
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
    toBeGreaterThan(expected) {
      if (!(actual > expected)) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
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
    }
  };
}

// Mock DOM environment for Node.js testing
class MockElement {
  constructor() {
    this.innerHTML = '';
    this.attributes = {};
    this._eventListeners = {};
  }
  
  querySelectorAll() {
    return [];
  }
  
  addEventListener(event, handler) {
    if (!this._eventListeners[event]) {
      this._eventListeners[event] = [];
    }
    this._eventListeners[event].push(handler);
  }
  
  dispatchEvent(event) {
    const listeners = this._eventListeners[event.type] || [];
    listeners.forEach(handler => handler(event));
  }
}

class MockShadowRoot extends MockElement {
  constructor() {
    super();
  }
}

// Simple PotentialTrack logic tests (without DOM dependency)
class PotentialTrackLogic {
  constructor(score = 10, stress = 0, resistance = 0) {
    this._score = score;
    this._stress = stress;
    this._resistance = resistance;
  }
  
  get score() { return this._score; }
  get stress() { return this._stress; }
  get resistance() { return this._resistance; }
  
  set score(value) {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      this._score = numValue;
      if (this._stress + this._resistance > this._score) {
        this._stress = 0;
        this._resistance = 0;
      }
    }
  }
  
  addStress() {
    if (this._stress + this._resistance < this._score) {
      this._stress++;
      return true;
    }
    return false;
  }
  
  removeStress() {
    if (this._stress > 0) {
      this._stress--;
      return true;
    }
    return false;
  }
  
  addResistance() {
    if (this._stress + this._resistance < this._score) {
      this._resistance++;
      return true;
    }
    return false;
  }
  
  removeResistance() {
    if (this._resistance > 0) {
      this._resistance--;
      return true;
    }
    return false;
  }
  
  getNodeState(index) {
    if (index < this._stress) {
      return 'stress';
    }
    const resistanceStartIndex = this._score - this._resistance;
    if (index >= resistanceStartIndex) {
      return 'resistance';
    }
    return 'empty';
  }
  
  calculateNodePositions() {
    const positions = [];
    const totalNodes = this._score;
    const startAngle = (225 * Math.PI) / 180;
    const endAngle = (-45 * Math.PI) / 180;
    const arcSpan = startAngle - endAngle;
    const radius = 70;
    
    for (let i = 0; i < totalNodes; i++) {
      const t = totalNodes > 1 ? i / (totalNodes - 1) : 0.5;
      const angle = startAngle - (t * arcSpan);
      
      positions.push({
        x: 100 + radius * Math.cos(angle),
        y: 100 - radius * Math.sin(angle),
        angle: angle
      });
    }
    
    return positions;
  }
}

// Run tests
describe('PotentialTrack Initialization', () => {
  it('should initialize with default values', () => {
    const track = new PotentialTrackLogic();
    expect(track.score).toBe(10);
    expect(track.stress).toBe(0);
    expect(track.resistance).toBe(0);
  });
  
  it('should initialize with custom values', () => {
    const track = new PotentialTrackLogic(8, 2, 1);
    expect(track.score).toBe(8);
    expect(track.stress).toBe(2);
    expect(track.resistance).toBe(1);
  });
});

describe('Stress Management', () => {
  it('should add stress when there is room', () => {
    const track = new PotentialTrackLogic(10, 0, 0);
    const result = track.addStress();
    expect(result).toBe(true);
    expect(track.stress).toBe(1);
  });
  
  it('should not add stress when at maximum', () => {
    const track = new PotentialTrackLogic(5, 5, 0);
    const result = track.addStress();
    expect(result).toBe(false);
    expect(track.stress).toBe(5);
  });
  
  it('should not add stress when combined with resistance exceeds score', () => {
    const track = new PotentialTrackLogic(5, 2, 3);
    const result = track.addStress();
    expect(result).toBe(false);
    expect(track.stress).toBe(2);
  });
  
  it('should remove stress when stress > 0', () => {
    const track = new PotentialTrackLogic(10, 3, 0);
    const result = track.removeStress();
    expect(result).toBe(true);
    expect(track.stress).toBe(2);
  });
  
  it('should not remove stress when stress = 0', () => {
    const track = new PotentialTrackLogic(10, 0, 0);
    const result = track.removeStress();
    expect(result).toBe(false);
    expect(track.stress).toBe(0);
  });
});

describe('Resistance Management', () => {
  it('should add resistance when there is room', () => {
    const track = new PotentialTrackLogic(10, 0, 0);
    const result = track.addResistance();
    expect(result).toBe(true);
    expect(track.resistance).toBe(1);
  });
  
  it('should not add resistance when at maximum', () => {
    const track = new PotentialTrackLogic(5, 0, 5);
    const result = track.addResistance();
    expect(result).toBe(false);
    expect(track.resistance).toBe(5);
  });
  
  it('should not add resistance when combined with stress exceeds score', () => {
    const track = new PotentialTrackLogic(5, 3, 2);
    const result = track.addResistance();
    expect(result).toBe(false);
    expect(track.resistance).toBe(2);
  });
  
  it('should remove resistance when resistance > 0', () => {
    const track = new PotentialTrackLogic(10, 0, 3);
    const result = track.removeResistance();
    expect(result).toBe(true);
    expect(track.resistance).toBe(2);
  });
  
  it('should not remove resistance when resistance = 0', () => {
    const track = new PotentialTrackLogic(10, 0, 0);
    const result = track.removeResistance();
    expect(result).toBe(false);
    expect(track.resistance).toBe(0);
  });
});

describe('Constraint: stress + resistance <= score', () => {
  it('should maintain constraint when adding stress', () => {
    const track = new PotentialTrackLogic(10, 0, 0);
    for (let i = 0; i < 15; i++) {
      track.addStress();
    }
    expect(track.stress + track.resistance).toBeLessThanOrEqual(track.score);
  });
  
  it('should maintain constraint when adding resistance', () => {
    const track = new PotentialTrackLogic(10, 0, 0);
    for (let i = 0; i < 15; i++) {
      track.addResistance();
    }
    expect(track.stress + track.resistance).toBeLessThanOrEqual(track.score);
  });
  
  it('should maintain constraint when adding both stress and resistance', () => {
    const track = new PotentialTrackLogic(10, 0, 0);
    for (let i = 0; i < 20; i++) {
      if (i % 2 === 0) {
        track.addStress();
      } else {
        track.addResistance();
      }
    }
    expect(track.stress + track.resistance).toBeLessThanOrEqual(track.score);
  });
  
  it('should reset stress and resistance when score is reduced below current values', () => {
    const track = new PotentialTrackLogic(10, 5, 4);
    track.score = 5;
    expect(track.stress).toBe(0);
    expect(track.resistance).toBe(0);
  });
});

describe('Node State Calculation', () => {
  it('should mark nodes as stress from the left', () => {
    const track = new PotentialTrackLogic(10, 3, 0);
    expect(track.getNodeState(0)).toBe('stress');
    expect(track.getNodeState(1)).toBe('stress');
    expect(track.getNodeState(2)).toBe('stress');
    expect(track.getNodeState(3)).toBe('empty');
  });
  
  it('should mark nodes as resistance from the right', () => {
    const track = new PotentialTrackLogic(10, 0, 3);
    expect(track.getNodeState(9)).toBe('resistance');
    expect(track.getNodeState(8)).toBe('resistance');
    expect(track.getNodeState(7)).toBe('resistance');
    expect(track.getNodeState(6)).toBe('empty');
  });
  
  it('should handle both stress and resistance correctly', () => {
    const track = new PotentialTrackLogic(10, 2, 3);
    // Stress nodes
    expect(track.getNodeState(0)).toBe('stress');
    expect(track.getNodeState(1)).toBe('stress');
    // Empty nodes
    expect(track.getNodeState(2)).toBe('empty');
    expect(track.getNodeState(6)).toBe('empty');
    // Resistance nodes
    expect(track.getNodeState(7)).toBe('resistance');
    expect(track.getNodeState(8)).toBe('resistance');
    expect(track.getNodeState(9)).toBe('resistance');
  });
});

describe('Node Position Calculation', () => {
  it('should calculate correct number of node positions', () => {
    const track = new PotentialTrackLogic(8, 0, 0);
    const positions = track.calculateNodePositions();
    expect(positions.length).toBe(8);
  });
  
  it('should position nodes in a semi-circle', () => {
    const track = new PotentialTrackLogic(5, 0, 0);
    const positions = track.calculateNodePositions();
    
    // First node should be on the left side (x < 100)
    expect(positions[0].x < 100).toBeTruthy();
    
    // Last node should be on the right side (x > 100)
    expect(positions[positions.length - 1].x > 100).toBeTruthy();
    
    // Middle node should be roughly centered (for odd count)
    const middleIndex = Math.floor(positions.length / 2);
    expect(Math.abs(positions[middleIndex].x - 100) < 10).toBeTruthy();
  });
  
  it('should handle single node case', () => {
    const track = new PotentialTrackLogic(1, 0, 0);
    const positions = track.calculateNodePositions();
    expect(positions.length).toBe(1);
  });
});

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`Tests completed: ${testsPassed} passed, ${testsFailed} failed`);
console.log('='.repeat(50));

// Exit with appropriate code
process.exit(testsFailed > 0 ? 1 : 0);
