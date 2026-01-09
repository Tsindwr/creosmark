/**
 * Tests for the Command Manager service
 * 
 * Run with: node tests/command-manager.test.js
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

// Mock DOM element for testing
class MockElement {
  constructor() {
    this.attributes = {};
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  getAttribute(name) {
    return this.attributes[name];
  }
}

// Mock document.getElementById
const mockElements = {};
global.document = {
  getElementById(id) {
    if (!mockElements[id]) {
      mockElements[id] = new MockElement();
    }
    return mockElements[id];
  }
};

// Import the command manager
import commandManager from '../src/services/command-manager.js';

describe('CommandManager Initialization', () => {
  it('should start with empty queue', () => {
    expect(commandManager.getQueueSize()).toBe(0);
  });

  it('should not be able to undo initially', () => {
    expect(commandManager.canUndo()).toBe(false);
  });
});

describe('Stress Command', () => {
  it('should execute stress command', () => {
    commandManager.clear();
    mockElements['test-track'] = new MockElement();
    mockElements['test-track'].setAttribute('stress', 0);
    const track = document.getElementById('test-track');
    
    let saved = false;
    const saveCallback = () => { saved = true; };
    const command = commandManager.createStressCommand('test-track', 'test', 0, 2, saveCallback);
    
    command.execute();
    expect(track.getAttribute('stress')).toBe(2);
    expect(saved).toBe(true);
  });

  it('should undo stress command', () => {
    commandManager.clear();
    mockElements['test-track'] = new MockElement();
    mockElements['test-track'].setAttribute('stress', 0);
    const track = document.getElementById('test-track');
    
    const command = commandManager.createStressCommand('test-track', 'test', 0, 2, null);
    
    command.execute();
    expect(track.getAttribute('stress')).toBe(2);
    
    command.undo();
    expect(track.getAttribute('stress')).toBe(0);
  });
});

describe('Resistance Command', () => {
  it('should execute resistance command', () => {
    commandManager.clear();
    mockElements['test-track'] = new MockElement();
    mockElements['test-track'].setAttribute('resistance', 0);
    const track = document.getElementById('test-track');
    
    let saved = false;
    const saveCallback = () => { saved = true; };
    const command = commandManager.createResistanceCommand('test-track', 'test', 0, 3, saveCallback);
    
    command.execute();
    expect(track.getAttribute('resistance')).toBe(3);
    expect(saved).toBe(true);
  });

  it('should undo resistance command', () => {
    commandManager.clear();
    mockElements['test-track'] = new MockElement();
    mockElements['test-track'].setAttribute('resistance', 0);
    const track = document.getElementById('test-track');
    const command = commandManager.createResistanceCommand('test-track', 'test', 0, 3, null);
    
    command.execute();
    expect(track.getAttribute('resistance')).toBe(3);
    
    command.undo();
    expect(track.getAttribute('resistance')).toBe(0);
  });
});

describe('Command Queue Management', () => {
  it('should add command to queue when executed', () => {
    commandManager.clear();
    mockElements['test-track'] = new MockElement();
    const command = commandManager.createStressCommand('test-track', 'test', 0, 1, null);
    commandManager.executeCommand(command);
    
    expect(commandManager.getQueueSize()).toBe(1);
    expect(commandManager.canUndo()).toBe(true);
  });

  it('should handle multiple commands', () => {
    commandManager.clear();
    mockElements['test-track'] = new MockElement();
    const cmd1 = commandManager.createStressCommand('test-track', 'test', 0, 1, null);
    const cmd2 = commandManager.createStressCommand('test-track', 'test', 1, 2, null);
    const cmd3 = commandManager.createResistanceCommand('test-track', 'test', 0, 1, null);
    
    commandManager.executeCommand(cmd1);
    commandManager.executeCommand(cmd2);
    commandManager.executeCommand(cmd3);
    
    expect(commandManager.getQueueSize()).toBe(3);
  });

  it('should undo commands in reverse order', () => {
    commandManager.clear();
    mockElements['test-track'] = new MockElement();
    const track = document.getElementById('test-track');
    track.setAttribute('stress', 0);
    
    const cmd1 = commandManager.createStressCommand('test-track', 'test', 0, 1, null);
    const cmd2 = commandManager.createStressCommand('test-track', 'test', 1, 2, null);
    
    commandManager.executeCommand(cmd1);
    commandManager.executeCommand(cmd2);
    
    expect(track.getAttribute('stress')).toBe(2);
    
    commandManager.undo();
    expect(track.getAttribute('stress')).toBe(1);
    
    commandManager.undo();
    expect(track.getAttribute('stress')).toBe(0);
  });

  it('should clear queue', () => {
    commandManager.clear();
    mockElements['test-track'] = new MockElement();
    const cmd = commandManager.createStressCommand('test-track', 'test', 0, 1, null);
    commandManager.executeCommand(cmd);
    
    expect(commandManager.getQueueSize()).toBe(1);
    
    commandManager.clear();
    expect(commandManager.getQueueSize()).toBe(0);
    expect(commandManager.canUndo()).toBe(false);
  });

  it('should return false when trying to undo empty queue', () => {
    commandManager.clear();
    expect(commandManager.undo()).toBe(false);
  });
});

describe('Character Switching', () => {
  it('should clear queue when character changes', () => {
    commandManager.clear();
    commandManager.setCharacter('char1');
    const cmd = commandManager.createStressCommand('test-track', 'test', 0, 1, null);
    commandManager.executeCommand(cmd);
    
    expect(commandManager.getQueueSize()).toBe(1);
    
    // Switch to different character should clear
    commandManager.setCharacter('char2');
    expect(commandManager.getQueueSize()).toBe(0);
  });

  it('should not clear queue when same character is set', () => {
    commandManager.clear();
    commandManager.setCharacter('char1');
    
    const cmd = commandManager.createStressCommand('test-track', 'test', 0, 1, null);
    commandManager.executeCommand(cmd);
    
    expect(commandManager.getQueueSize()).toBe(1);
    
    // Setting same character should not clear
    commandManager.setCharacter('char1');
    expect(commandManager.getQueueSize()).toBe(1);
  });
});

describe('Listener Notifications', () => {
  it('should notify listeners when queue changes', () => {
    commandManager.clear();
    let notified = false;
    let canUndo = false;
    let queueSize = 0;
    
    const listener = (can, size) => {
      notified = true;
      canUndo = can;
      queueSize = size;
    };
    
    commandManager.addListener(listener);
    
    const cmd = commandManager.createStressCommand('test-track', 'test', 0, 1, null);
    commandManager.executeCommand(cmd);
    
    expect(notified).toBe(true);
    expect(canUndo).toBe(true);
    expect(queueSize).toBe(1);
    
    commandManager.removeListener(listener);
  });

  it('should notify listeners when undo is performed', () => {
    commandManager.clear();
    let notificationCount = 0;
    
    const listener = () => {
      notificationCount++;
    };
    
    commandManager.addListener(listener);
    
    const cmd = commandManager.createStressCommand('test-track', 'test', 0, 1, null);
    commandManager.executeCommand(cmd);
    commandManager.undo();
    
    // Should be notified twice: once for execute, once for undo
    expect(notificationCount).toBe(2);
    
    commandManager.removeListener(listener);
  });
});

// Run all tests
console.log('\n' + '='.repeat(50));
console.log(`Tests completed: ${testsPassed} passed, ${testsFailed} failed`);
console.log('='.repeat(50));

// Exit with error code if tests failed
if (testsFailed > 0) {
  process.exit(1);
}
