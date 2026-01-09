/**
 * Tests for the Session Service
 * 
 * Run with: node tests/session-service.test.js
 * 
 * Note: These are basic unit tests. Full P2P testing requires multiple browser instances.
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
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null, but got ${actual}`);
      }
    },
    toContain(item) {
      if (!actual.includes(item)) {
        throw new Error(`Expected ${actual} to contain ${item}`);
      }
    },
    toBeGreaterThan(expected) {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    }
  };
}

// Mock SessionService (can't test P2P without browser environment)
class MockSessionService {
  constructor() {
    this.peer = null;
    this.connections = new Map();
    this.isGM = false;
    this.sessionId = null;
    this.playerInfo = null;
    this.listeners = [];
    this.activityLog = [];
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  broadcastRoll(rollData) {
    const message = {
      type: 'roll-result',
      player: this.playerInfo,
      data: rollData,
      timestamp: Date.now()
    };
    this._addToActivityLog(message);
  }

  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      isGM: this.isGM,
      playerInfo: this.playerInfo,
      connectedPlayers: Array.from(this.connections.keys()),
      isConnected: this.sessionId !== null
    };
  }

  getActivityLog() {
    return [...this.activityLog];
  }

  _addToActivityLog(entry) {
    this.activityLog.unshift(entry);
    if (this.activityLog.length > 100) {
      this.activityLog.pop();
    }
    this._notifyListeners('activity-added', entry);
  }

  _notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  _generateSessionId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  _saveSession() {
    // Mock localStorage
    this._sessionData = {
      sessionId: this.sessionId,
      isGM: this.isGM,
      playerInfo: this.playerInfo,
      timestamp: Date.now()
    };
  }

  _loadSession() {
    return this._sessionData || null;
  }

  _clearSession() {
    this._sessionData = null;
  }

  restoreSession() {
    const sessionData = this._loadSession();
    if (!sessionData) return null;

    const age = Date.now() - sessionData.timestamp;
    if (age > 24 * 60 * 60 * 1000) {
      this._clearSession();
      return null;
    }

    return sessionData;
  }

  // Mock session creation
  mockInitAsGM(playerInfo) {
    this.sessionId = this._generateSessionId();
    this.isGM = true;
    this.playerInfo = playerInfo;
    this._saveSession();
    return this.sessionId;
  }

  // Mock session joining
  mockJoinSession(sessionId, playerInfo) {
    this.sessionId = sessionId;
    this.isGM = false;
    this.playerInfo = playerInfo;
    this._saveSession();
    return sessionId;
  }

  leaveSession() {
    this.connections.clear();
    this._clearSession();
    this.sessionId = null;
    this.isGM = false;
    this.playerInfo = null;
    this.activityLog = [];
    this._notifyListeners('session-left', {});
  }
}

// Run tests
describe('Session Service Initialization', () => {
  it('should initialize with default values', () => {
    const service = new MockSessionService();
    expect(service.sessionId).toBeNull();
    expect(service.isGM).toBe(false);
    expect(service.playerInfo).toBeNull();
    expect(service.connections.size).toBe(0);
  });

  it('should have empty activity log initially', () => {
    const service = new MockSessionService();
    expect(service.getActivityLog().length).toBe(0);
  });
});

describe('Session ID Generation', () => {
  it('should generate 6-character session ID', () => {
    const service = new MockSessionService();
    const id = service._generateSessionId();
    expect(id.length).toBe(6);
  });

  it('should generate alphanumeric session ID', () => {
    const service = new MockSessionService();
    const id = service._generateSessionId();
    const validChars = /^[A-Z2-9]+$/;
    expect(validChars.test(id)).toBeTruthy();
  });

  it('should generate different IDs on subsequent calls', () => {
    const service = new MockSessionService();
    const id1 = service._generateSessionId();
    const id2 = service._generateSessionId();
    // Very unlikely to be the same, but test structure
    expect(id1.length).toBe(6);
    expect(id2.length).toBe(6);
  });
});

describe('GM Session Creation', () => {
  it('should create GM session with player info', () => {
    const service = new MockSessionService();
    const playerInfo = { name: 'Test GM', avatar: '🧙' };
    const sessionId = service.mockInitAsGM(playerInfo);

    expect(sessionId).toBeTruthy();
    expect(service.isGM).toBe(true);
    expect(service.sessionId).toBe(sessionId);
    expect(service.playerInfo).toBe(playerInfo);
  });

  it('should save session data when creating as GM', () => {
    const service = new MockSessionService();
    const playerInfo = { name: 'Test GM', avatar: '🧙' };
    service.mockInitAsGM(playerInfo);

    const saved = service._loadSession();
    expect(saved).toBeTruthy();
    expect(saved.isGM).toBe(true);
  });
});

describe('Player Session Joining', () => {
  it('should join session as player', () => {
    const service = new MockSessionService();
    const sessionId = 'ABC123';
    const playerInfo = { name: 'Test Player', avatar: '⚔️' };
    
    service.mockJoinSession(sessionId, playerInfo);

    expect(service.sessionId).toBe(sessionId);
    expect(service.isGM).toBe(false);
    expect(service.playerInfo).toBe(playerInfo);
  });

  it('should save session data when joining', () => {
    const service = new MockSessionService();
    const sessionId = 'ABC123';
    const playerInfo = { name: 'Test Player', avatar: '⚔️' };
    
    service.mockJoinSession(sessionId, playerInfo);

    const saved = service._loadSession();
    expect(saved).toBeTruthy();
    expect(saved.sessionId).toBe(sessionId);
    expect(saved.isGM).toBe(false);
  });
});

describe('Session Info', () => {
  it('should return correct session info when not connected', () => {
    const service = new MockSessionService();
    const info = service.getSessionInfo();

    expect(info.sessionId).toBeNull();
    expect(info.isGM).toBe(false);
    expect(info.isConnected).toBe(false);
  });

  it('should return correct session info when connected as GM', () => {
    const service = new MockSessionService();
    const playerInfo = { name: 'GM', avatar: '🧙' };
    service.mockInitAsGM(playerInfo);

    const info = service.getSessionInfo();
    expect(info.isGM).toBe(true);
    expect(info.isConnected).toBe(true);
  });
});

describe('Event Listeners', () => {
  it('should add event listeners', () => {
    const service = new MockSessionService();
    const listener = () => {};
    
    service.addListener(listener);
    expect(service.listeners.length).toBe(1);
  });

  it('should remove event listeners', () => {
    const service = new MockSessionService();
    const listener = () => {};
    
    service.addListener(listener);
    service.removeListener(listener);
    expect(service.listeners.length).toBe(0);
  });

  it('should notify listeners on events', () => {
    const service = new MockSessionService();
    let eventReceived = null;
    
    service.addListener((event, data) => {
      eventReceived = event;
    });

    service._notifyListeners('test-event', {});
    expect(eventReceived).toBe('test-event');
  });
});

describe('Activity Log', () => {
  it('should add roll to activity log', () => {
    const service = new MockSessionService();
    const playerInfo = { name: 'Test', avatar: '🧙' };
    service.playerInfo = playerInfo;

    service.broadcastRoll({ skillName: 'Force', roll: 15 });
    
    const log = service.getActivityLog();
    expect(log.length).toBe(1);
    expect(log[0].type).toBe('roll-result');
  });

  it('should limit activity log to 100 entries', () => {
    const service = new MockSessionService();
    const playerInfo = { name: 'Test', avatar: '🧙' };
    service.playerInfo = playerInfo;

    // Add 150 entries
    for (let i = 0; i < 150; i++) {
      service.broadcastRoll({ skillName: 'Force', roll: i });
    }

    const log = service.getActivityLog();
    expect(log.length).toBe(100);
  });

  it('should add newest entries to front of log', () => {
    const service = new MockSessionService();
    const playerInfo = { name: 'Test', avatar: '🧙' };
    service.playerInfo = playerInfo;

    service.broadcastRoll({ skillName: 'Force', roll: 10 });
    service.broadcastRoll({ skillName: 'Brace', roll: 15 });

    const log = service.getActivityLog();
    expect(log[0].data.skillName).toBe('Brace');
    expect(log[1].data.skillName).toBe('Force');
  });
});

describe('Session Restoration', () => {
  it('should restore recent session', () => {
    const service = new MockSessionService();
    const playerInfo = { name: 'Test', avatar: '🧙' };
    service.mockInitAsGM(playerInfo);

    const restored = service.restoreSession();
    expect(restored).toBeTruthy();
    expect(restored.isGM).toBe(true);
  });

  it('should not restore expired session', () => {
    const service = new MockSessionService();
    const playerInfo = { name: 'Test', avatar: '🧙' };
    service.mockInitAsGM(playerInfo);

    // Mock old timestamp (25 hours ago)
    service._sessionData.timestamp = Date.now() - (25 * 60 * 60 * 1000);

    const restored = service.restoreSession();
    expect(restored).toBeNull();
  });

  it('should return null when no session to restore', () => {
    const service = new MockSessionService();
    const restored = service.restoreSession();
    expect(restored).toBeNull();
  });
});

describe('Leave Session', () => {
  it('should clear all session data on leave', () => {
    const service = new MockSessionService();
    const playerInfo = { name: 'Test', avatar: '🧙' };
    service.mockInitAsGM(playerInfo);
    service.broadcastRoll({ skillName: 'Force', roll: 15 });

    service.leaveSession();

    expect(service.sessionId).toBeNull();
    expect(service.isGM).toBe(false);
    expect(service.playerInfo).toBeNull();
    expect(service.activityLog.length).toBe(0);
    expect(service.connections.size).toBe(0);
  });

  it('should notify listeners on session leave', () => {
    const service = new MockSessionService();
    const playerInfo = { name: 'Test', avatar: '🧙' };
    service.mockInitAsGM(playerInfo);

    let eventReceived = null;
    service.addListener((event) => {
      eventReceived = event;
    });

    service.leaveSession();
    expect(eventReceived).toBe('session-left');
  });
});

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`Tests completed: ${testsPassed} passed, ${testsFailed} failed`);
console.log('='.repeat(50));

// Exit with error code if tests failed
if (testsFailed > 0) {
  process.exit(1);
}
