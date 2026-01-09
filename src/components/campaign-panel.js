/**
 * Campaign Panel Component
 * Collapsible side panel for managing campaign sessions
 */

class CampaignPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isOpen = false;
    this._isConnected = false;
    this._sessionId = null;
    this._isGM = false;
    this._players = [];
    this._activityLog = [];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    const styles = `
      <style>
        :host {
          --panel-width: 350px;
          --panel-bg: rgba(30, 30, 50, 0.95);
          --panel-border: #4a4a6a;
          --primary-color: #ffd700;
          --text-color: #e0e0e0;
          --success-color: #4a9a4a;
          --error-color: #9a4a4a;
        }

        .campaign-toggle {
          position: fixed;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          background: var(--panel-bg);
          border: 2px solid var(--panel-border);
          border-right: none;
          border-radius: 8px 0 0 8px;
          padding: 15px 8px;
          cursor: pointer;
          z-index: 1000;
          transition: all 0.3s ease;
          writing-mode: vertical-rl;
          font-family: 'Georgia', serif;
          color: var(--primary-color);
          font-size: 0.9rem;
          font-weight: bold;
          letter-spacing: 2px;
        }

        .campaign-toggle:hover {
          background: rgba(40, 40, 60, 0.95);
          border-color: var(--primary-color);
        }

        .campaign-toggle.connected {
          border-color: var(--success-color);
        }

        .campaign-toggle .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--panel-border);
          margin: 10px auto;
          display: block;
        }

        .campaign-toggle.connected .status-indicator {
          background: var(--success-color);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .campaign-panel {
          position: fixed;
          right: -400px;
          top: 0;
          height: 100vh;
          width: var(--panel-width);
          background: var(--panel-bg);
          border-left: 2px solid var(--panel-border);
          box-shadow: -5px 0 20px rgba(0, 0, 0, 0.5);
          z-index: 999;
          transition: right 0.3s ease;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .campaign-panel.open {
          right: 0;
        }

        .panel-header {
          padding: 20px;
          border-bottom: 2px solid var(--panel-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .panel-title {
          font-family: 'Georgia', serif;
          font-size: 1.3rem;
          color: var(--primary-color);
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          color: var(--text-color);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--primary-color);
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .connection-section {
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 0.9rem;
          color: var(--primary-color);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
          font-weight: bold;
        }

        .session-info {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--panel-border);
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
        }

        .session-code {
          font-family: 'Consolas', monospace;
          font-size: 1.5rem;
          color: var(--primary-color);
          text-align: center;
          letter-spacing: 4px;
          margin: 10px 0;
          padding: 10px;
          background: rgba(255, 215, 0, 0.1);
          border-radius: 4px;
        }

        .input-group {
          margin-bottom: 15px;
        }

        .input-group label {
          display: block;
          font-size: 0.85rem;
          color: var(--text-color);
          margin-bottom: 5px;
        }

        .input-group input {
          width: 100%;
          padding: 10px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--panel-border);
          border-radius: 4px;
          color: var(--text-color);
          font-size: 1rem;
          font-family: 'Consolas', monospace;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .input-group input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .button {
          width: 100%;
          padding: 12px;
          font-size: 0.95rem;
          font-weight: bold;
          color: #fff;
          background: linear-gradient(135deg, #4a4a9a 0%, #5a5aaa 100%);
          border: 2px solid #5a5aaa;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Georgia', serif;
        }

        .button:hover {
          background: linear-gradient(135deg, #5a5aaa 0%, #6a6aba 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(74, 74, 154, 0.4);
        }

        .button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .button.danger {
          background: linear-gradient(135deg, #9a4a4a 0%, #aa5a5a 100%);
          border-color: #aa5a5a;
        }

        .button.danger:hover {
          background: linear-gradient(135deg, #aa5a5a 0%, #ba6a6a 100%);
        }

        .players-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .player-item {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--panel-border);
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .player-avatar {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2a2a4a 0%, #3a3a6a 100%);
          border: 2px solid var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .player-info {
          flex: 1;
          min-width: 0;
        }

        .player-name {
          font-size: 0.9rem;
          color: var(--text-color);
          font-weight: bold;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .player-role {
          font-size: 0.75rem;
          color: #a0a0b0;
        }

        .activity-list {
          list-style: none;
          padding: 0;
          margin: 0;
          max-height: 300px;
          overflow-y: auto;
        }

        .activity-item {
          background: rgba(0, 0, 0, 0.3);
          border-left: 3px solid var(--panel-border);
          border-radius: 4px;
          padding: 10px;
          margin-bottom: 8px;
          font-size: 0.85rem;
        }

        .activity-item.roll {
          border-left-color: #66aaff;
        }

        .activity-player {
          color: var(--primary-color);
          font-weight: bold;
        }

        .activity-time {
          color: #808090;
          font-size: 0.75rem;
          margin-top: 4px;
        }

        .empty-state {
          text-align: center;
          padding: 30px 20px;
          color: #808090;
          font-style: italic;
        }

        .info-text {
          font-size: 0.85rem;
          color: #a0a0b0;
          line-height: 1.4;
          margin: 10px 0;
        }

        .copy-button {
          width: 100%;
          padding: 8px;
          font-size: 0.85rem;
          margin-top: 10px;
        }
      </style>
    `;

    const html = `
      <div class="campaign-toggle ${this._isConnected ? 'connected' : ''}" id="toggle-btn">
        <span class="status-indicator"></span>
        CAMPAIGN
      </div>

      <div class="campaign-panel ${this._isOpen ? 'open' : ''}" id="panel">
        <div class="panel-header">
          <h2 class="panel-title">🎲 Campaign</h2>
          <button class="close-button" id="close-btn">✕</button>
        </div>

        <div class="panel-content">
          ${this._isConnected ? this._renderConnected() : this._renderDisconnected()}
        </div>
      </div>
    `;

    this.shadowRoot.innerHTML = styles + html;
  }

  _renderDisconnected() {
    return `
      <div class="connection-section">
        <h3 class="section-title">Start a Campaign</h3>
        <p class="info-text">Create a session as GM or join an existing one as a player.</p>
        
        <button class="button" id="create-session-btn">Create Session (GM)</button>
      </div>

      <div class="connection-section">
        <h3 class="section-title">Join Session</h3>
        <div class="input-group">
          <label for="session-code">Session Code</label>
          <input type="text" id="session-code" placeholder="ABC123" maxlength="6">
        </div>
        <button class="button" id="join-session-btn">Join Session</button>
      </div>
    `;
  }

  _renderConnected() {
    return `
      <div class="connection-section">
        <h3 class="section-title">${this._isGM ? 'Your Session' : 'Connected Session'}</h3>
        <div class="session-info">
          <div style="text-align: center; color: #a0a0b0; font-size: 0.85rem;">Session Code</div>
          <div class="session-code">${this._sessionId}</div>
          ${this._isGM ? '<button class="button copy-button" id="copy-code-btn">📋 Copy Code</button>' : ''}
          <p class="info-text" style="text-align: center; margin-top: 15px;">
            ${this._isGM ? 'Share this code with your players' : 'Connected to GM'}
          </p>
        </div>
        <button class="button danger" id="leave-session-btn">Leave Session</button>
      </div>

      <div class="connection-section">
        <h3 class="section-title">Players (${this._players.length})</h3>
        ${this._players.length > 0 ? `
          <ul class="players-list">
            ${this._players.map(player => `
              <li class="player-item">
                <div class="player-avatar">${player.avatar || '🧙'}</div>
                <div class="player-info">
                  <div class="player-name">${this._escapeHtml(player.name || 'Unknown')}</div>
                  <div class="player-role">${player.isGM ? 'Game Master' : 'Player'}</div>
                </div>
              </li>
            `).join('')}
          </ul>
        ` : '<div class="empty-state">No players connected yet</div>'}
      </div>

      <div class="connection-section">
        <h3 class="section-title">Activity</h3>
        ${this._activityLog.length > 0 ? `
          <ul class="activity-list">
            ${this._activityLog.slice(0, 10).map(entry => this._renderActivity(entry)).join('')}
          </ul>
        ` : '<div class="empty-state">No activity yet</div>'}
      </div>
    `;
  }

  _renderActivity(entry) {
    const time = new Date(entry.timestamp).toLocaleTimeString();
    const playerName = entry.player?.name || 'Unknown';

    if (entry.type === 'roll-result') {
      const data = entry.data;
      return `
        <li class="activity-item roll">
          <div>
            <span class="activity-player">${this._escapeHtml(playerName)}</span>
            rolled <strong>${data.skillName || 'Skill'}</strong>
          </div>
          <div>Roll: ${data.roll} | Total: ${data.total} | Result: ${data.result?.level || 'Unknown'}</div>
          <div class="activity-time">${time}</div>
        </li>
      `;
    }

    return `
      <li class="activity-item">
        <div>${this._escapeHtml(playerName)}: ${entry.type}</div>
        <div class="activity-time">${time}</div>
      </li>
    `;
  }

  setupEventListeners() {
    const toggleBtn = this.shadowRoot.getElementById('toggle-btn');
    const closeBtn = this.shadowRoot.getElementById('close-btn');
    const createBtn = this.shadowRoot.getElementById('create-session-btn');
    const joinBtn = this.shadowRoot.getElementById('join-session-btn');
    const leaveBtn = this.shadowRoot.getElementById('leave-session-btn');
    const copyBtn = this.shadowRoot.getElementById('copy-code-btn');

    toggleBtn?.addEventListener('click', () => this.togglePanel());
    closeBtn?.addEventListener('click', () => this.closePanel());
    createBtn?.addEventListener('click', () => this.createSession());
    joinBtn?.addEventListener('click', () => this.joinSession());
    leaveBtn?.addEventListener('click', () => this.leaveSession());
    copyBtn?.addEventListener('click', () => this.copySessionCode());
  }

  togglePanel() {
    this._isOpen = !this._isOpen;
    this.render();
    this.setupEventListeners();
  }

  closePanel() {
    this._isOpen = false;
    this.render();
    this.setupEventListeners();
  }

  createSession() {
    this.dispatchEvent(new CustomEvent('create-session', { 
      bubbles: true, 
      composed: true 
    }));
  }

  joinSession() {
    const input = this.shadowRoot.getElementById('session-code');
    const code = input?.value.trim().toUpperCase();
    
    if (code && code.length === 6) {
      this.dispatchEvent(new CustomEvent('join-session', {
        bubbles: true,
        composed: true,
        detail: { sessionId: code }
      }));
    } else {
      alert('Please enter a valid 6-character session code');
    }
  }

  leaveSession() {
    if (confirm('Are you sure you want to leave this session?')) {
      this.dispatchEvent(new CustomEvent('leave-session', {
        bubbles: true,
        composed: true
      }));
    }
  }

  copySessionCode() {
    if (this._sessionId) {
      navigator.clipboard.writeText(this._sessionId).then(() => {
        const btn = this.shadowRoot.getElementById('copy-code-btn');
        if (btn) {
          const originalText = btn.textContent;
          btn.textContent = '✓ Copied!';
          setTimeout(() => {
            btn.textContent = originalText;
          }, 2000);
        }
      });
    }
  }

  // Public methods to update state
  updateConnectionStatus(isConnected, sessionId, isGM) {
    this._isConnected = isConnected;
    this._sessionId = sessionId;
    this._isGM = isGM;
    this.render();
    this.setupEventListeners();
  }

  updatePlayers(players) {
    this._players = players;
    if (this._isConnected) {
      this.render();
      this.setupEventListeners();
    }
  }

  updateActivityLog(log) {
    this._activityLog = log;
    if (this._isConnected) {
      this.render();
      this.setupEventListeners();
    }
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

customElements.define('campaign-panel', CampaignPanel);
