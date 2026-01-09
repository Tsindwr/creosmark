/**
 * Session Service
 * Handles peer-to-peer session connections for campaigns
 * Uses PeerJS for WebRTC abstraction
 */

class SessionService {
  constructor() {
    this.peer = null;
    this.connections = new Map(); // playerId -> connection
    this.players = new Map(); // playerId -> player info
    this.isGM = false;
    this.sessionId = null;
    this.playerInfo = null;
    this.listeners = [];
    this.activityLog = [];
  }

  /**
   * Initialize as GM (host)
   */
  async initAsGM(playerInfo) {
    return new Promise((resolve, reject) => {
      try {
        // Generate a readable session ID
        this.sessionId = this._generateSessionId();
        this.isGM = true;
        this.playerInfo = playerInfo;

        // Initialize PeerJS
        this.peer = new Peer(this.sessionId, {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        this.peer.on('open', (id) => {
          console.log('GM session opened with ID:', id);
          this._saveSession();
          this._notifyListeners('session-created', { sessionId: id, isGM: true });
          resolve(id);
        });

        this.peer.on('connection', (conn) => {
          this._handleIncomingConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.error('Peer error:', err);
          this._notifyListeners('error', { error: err.message });
          reject(err);
        });

        // Cleanup on disconnect
        this.peer.on('disconnected', () => {
          console.log('Peer disconnected');
          this._notifyListeners('disconnected', {});
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Join existing session as player
   */
  async joinSession(sessionId, playerInfo) {
    return new Promise((resolve, reject) => {
      try {
        this.sessionId = sessionId;
        this.isGM = false;
        this.playerInfo = playerInfo;

        // Generate unique player ID
        const playerId = 'player_' + Math.random().toString(36).substr(2, 9);

        this.peer = new Peer(playerId, {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        this.peer.on('open', (id) => {
          console.log('Player peer opened with ID:', id);
          
          // Connect to GM
          const conn = this.peer.connect(sessionId);
          
          conn.on('open', () => {
            console.log('Connected to GM');
            this.connections.set(sessionId, conn);
            
            // Send player info to GM
            this._sendData(conn, {
              type: 'player-joined',
              player: this.playerInfo
            });

            this._saveSession();
            this._notifyListeners('session-joined', { sessionId, isGM: false });
            resolve(sessionId);
          });

          conn.on('data', (data) => {
            this._handleData(data, conn);
          });

          conn.on('close', () => {
            console.log('Connection to GM closed');
            this.connections.delete(sessionId);
            this._notifyListeners('connection-closed', { playerId: sessionId });
          });

          conn.on('error', (err) => {
            console.error('Connection error:', err);
            reject(err);
          });
        });

        this.peer.on('error', (err) => {
          console.error('Peer error:', err);
          this._notifyListeners('error', { error: err.message });
          reject(err);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Leave current session
   */
  leaveSession() {
    // Close all connections
    this.connections.forEach(conn => conn.close());
    this.connections.clear();
    this.players.clear();

    // Destroy peer
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    // Clear session storage
    this._clearSession();

    // Reset state
    this.sessionId = null;
    this.isGM = false;
    this.playerInfo = null;
    this.activityLog = [];

    this._notifyListeners('session-left', {});
  }

  /**
   * Send roll result to all connected players
   */
  broadcastRoll(rollData) {
    const message = {
      type: 'roll-result',
      player: this.playerInfo,
      data: rollData,
      timestamp: Date.now()
    };

    this._broadcast(message);
    this._addToActivityLog(message);
  }

  /**
   * Request a skill check from a player (GM only)
   */
  requestSkillCheck(playerId, skillData) {
    if (!this.isGM) {
      console.error('Only GM can request skill checks');
      return;
    }

    const connection = this.connections.get(playerId);
    if (connection) {
      this._sendData(connection, {
        type: 'skill-check-request',
        skill: skillData,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Get current session info
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      isGM: this.isGM,
      playerInfo: this.playerInfo,
      connectedPlayers: Array.from(this.connections.keys()),
      isConnected: this.peer && !this.peer.destroyed
    };
  }

  /**
   * Get list of all players in session (including self)
   */
  getPlayerList() {
    if (!this.peer || this.peer.destroyed) {
      return [];
    }
    return this._getPlayerList();
  }

  /**
   * Get activity log
   */
  getActivityLog() {
    return [...this.activityLog];
  }

  /**
   * Add listener for session events
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Try to restore session from storage
   */
  restoreSession() {
    const sessionData = this._loadSession();
    if (!sessionData) return null;

    // Check if session is still valid (less than 24 hours old)
    const age = Date.now() - sessionData.timestamp;
    if (age > 24 * 60 * 60 * 1000) {
      this._clearSession();
      return null;
    }

    return sessionData;
  }

  // ============ Private Methods ============

  _handleIncomingConnection(conn) {
    console.log('Incoming connection from:', conn.peer);

    conn.on('open', () => {
      console.log('Connection opened with:', conn.peer);
      this.connections.set(conn.peer, conn);
    });

    conn.on('data', (data) => {
      this._handleData(data, conn);
    });

    conn.on('close', () => {
      console.log('Connection closed with:', conn.peer);
      this.connections.delete(conn.peer);
      this.players.delete(conn.peer);
      this._notifyListeners('player-left', { playerId: conn.peer });
      
      // GM broadcasts updated player list
      if (this.isGM) {
        this._broadcast({
          type: 'player-list-update',
          players: this._getPlayerList()
        });
      }
    });

    conn.on('error', (err) => {
      console.error('Connection error with', conn.peer, ':', err);
    });
  }

  _handleData(data, conn) {
    console.log('Received data:', data);

    switch (data.type) {
      case 'player-joined':
        // Store player info
        this.players.set(conn.peer, data.player);
        
        this._notifyListeners('player-joined', { 
          playerId: conn.peer, 
          player: data.player 
        });
        
        // GM sends updated player list to everyone
        if (this.isGM) {
          this._broadcast({
            type: 'player-list-update',
            players: this._getPlayerList()
          });
        }
        break;

      case 'roll-result':
        this._addToActivityLog(data);
        this._notifyListeners('roll-received', data);
        
        // GM rebroadcasts to all players
        if (this.isGM) {
          this._broadcast(data, conn.peer);
        }
        break;

      case 'skill-check-request':
        this._notifyListeners('skill-check-requested', data);
        break;

      case 'player-list-update':
        // Update local player list
        if (data.players) {
          this.players.clear();
          data.players.forEach(p => {
            this.players.set(p.id, p.info);
          });
        }
        this._notifyListeners('player-list-updated', data);
        break;

      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  _broadcast(message, excludePeer = null) {
    this.connections.forEach((conn, peerId) => {
      if (peerId !== excludePeer && conn.open) {
        this._sendData(conn, message);
      }
    });
  }

  _sendData(connection, data) {
    try {
      if (connection.open) {
        connection.send(data);
      }
    } catch (error) {
      console.error('Error sending data:', error);
    }
  }

  _addToActivityLog(entry) {
    this.activityLog.unshift(entry);
    
    // Keep only last 100 entries
    if (this.activityLog.length > 100) {
      this.activityLog.pop();
    }

    this._notifyListeners('activity-added', entry);
  }

  _getPlayerList() {
    const players = [
      {
        id: this.peer.id,
        info: this.playerInfo,
        isGM: this.isGM
      }
    ];

    // Add connected players with their info
    this.players.forEach((info, peerId) => {
      players.push({
        id: peerId,
        info: info,
        isGM: false
      });
    });

    return players;
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
    // Generate a readable 6-character session code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoiding ambiguous characters
    let id = '';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  _saveSession() {
    const sessionData = {
      sessionId: this.sessionId,
      isGM: this.isGM,
      playerInfo: this.playerInfo,
      timestamp: Date.now()
    };
    localStorage.setItem('campaign_session', JSON.stringify(sessionData));
  }

  _loadSession() {
    const data = localStorage.getItem('campaign_session');
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse session data:', e);
      return null;
    }
  }

  _clearSession() {
    localStorage.removeItem('campaign_session');
  }
}

// Create singleton instance
const sessionService = new SessionService();
export default sessionService;
