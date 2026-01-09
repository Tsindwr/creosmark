/**
 * App Header Component
 * Persistent header with logo, title, and login functionality
 */
class AppHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .header {
          background: linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 100%);
          backdrop-filter: blur(10px);
          border-bottom: 2px solid rgba(255, 215, 0, 0.3);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          padding: 15px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 15px;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .header-left:hover {
          transform: translateY(-2px);
        }

        .header-nav {
          display: flex;
          gap: 5px;
          align-items: center;
        }

        .nav-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: rgba(40, 40, 60, 0.4);
          border: 2px solid rgba(74, 74, 106, 0.3);
          border-radius: 8px;
          color: #a0a0b0;
          text-decoration: none;
          transition: all 0.3s ease;
          font-family: 'Georgia', serif;
          font-size: 0.95rem;
        }

        .nav-tab:hover {
          background: rgba(50, 50, 70, 0.5);
          border-color: rgba(106, 106, 154, 0.5);
          color: #e0e0e0;
          transform: translateY(-2px);
        }

        .nav-tab.active {
          background: linear-gradient(135deg, rgba(74, 74, 154, 0.6) 0%, rgba(90, 90, 170, 0.6) 100%);
          border-color: #ffd700;
          color: #ffd700;
        }

        .nav-icon {
          font-size: 1.2rem;
        }

        .nav-label {
          font-weight: 600;
        }

        .logo {
          font-size: 2rem;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
        }

        .title {
          font-family: 'Georgia', serif;
          font-size: 1.8rem;
          color: #ffd700;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          margin: 0;
        }

        .subtitle {
          font-size: 0.9rem;
          color: #a0a0b0;
          margin: 0;
          font-style: italic;
        }

        .header-right {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 15px;
          background: rgba(40, 40, 60, 0.6);
          border-radius: 20px;
          color: #e0e0e0;
          font-size: 0.9rem;
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid #ffd700;
          background: #2a2a4a;
        }

        .login-button, .logout-button {
          padding: 10px 20px;
          font-size: 14px;
          font-weight: bold;
          color: #fff;
          background: linear-gradient(135deg, #4a4a9a 0%, #6a6aba 100%);
          border: 2px solid #5a5aaa;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Georgia', serif;
        }

        .login-button:hover, .logout-button:hover {
          background: linear-gradient(135deg, #5a5aaa 0%, #7a7aca 100%);
          border-color: #6a6aba;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(74, 74, 154, 0.4);
        }

        .logout-button {
          background: linear-gradient(135deg, #9a4a4a 0%, #ba6a6a 100%);
          border-color: #aa5a5a;
        }

        .logout-button:hover {
          background: linear-gradient(135deg, #aa5a5a 0%, #ca7a7a 100%);
          border-color: #ba6a6a;
        }

        .storage-badge {
          padding: 5px 12px;
          background: rgba(106, 74, 154, 0.3);
          border: 1px solid #6a4a9a;
          border-radius: 12px;
          font-size: 0.8rem;
          color: #d0d0e0;
        }

        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            gap: 15px;
            padding: 15px;
          }

          .title {
            font-size: 1.5rem;
          }

          .subtitle {
            display: none;
          }

          .header-nav {
            width: 100%;
            justify-content: center;
          }

          .nav-label {
            display: none;
          }

          .nav-tab {
            flex: 1;
            justify-content: center;
            padding: 10px;
          }
        }
      </style>

      <header class="header">
        <div class="header-left" id="logo-area">
          <div class="logo">⚔️</div>
          <div>
            <h1 class="title">Creosmark</h1>
            <p class="subtitle">Character Management</p>
          </div>
        </div>

        <nav class="header-nav" id="header-nav">
          <a href="character-chooser.html" class="nav-tab" id="nav-characters">
            <span class="nav-icon">👤</span>
            <span class="nav-label">Characters</span>
          </a>
          <a href="campaigns.html" class="nav-tab" id="nav-campaigns">
            <span class="nav-icon">🎲</span>
            <span class="nav-label">Campaigns</span>
          </a>
        </nav>

        <div class="header-right">
          <div class="storage-badge" id="storage-badge">Local Storage</div>
          <div class="user-info" id="user-info" style="display: none;">
            <img class="avatar" id="user-avatar" src="" alt="User">
            <span id="user-name"></span>
          </div>
          <button class="login-button" id="login-button">Login</button>
          <button class="logout-button" id="logout-button" style="display: none;">Logout</button>
        </div>
      </header>
    `;
  }

  setupEventListeners() {
    const logoArea = this.shadowRoot.getElementById('logo-area');
    const loginButton = this.shadowRoot.getElementById('login-button');
    const logoutButton = this.shadowRoot.getElementById('logout-button');

    // Logo click returns to character chooser
    logoArea.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('navigate-home', { 
        bubbles: true, 
        composed: true 
      }));
    });

    // Login button
    loginButton.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('login-request', { 
        bubbles: true, 
        composed: true 
      }));
    });

    // Logout button
    logoutButton.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('logout-request', { 
        bubbles: true, 
        composed: true 
      }));
    });
  }

  // Public methods to update header state
  setUser(user) {
    const userInfo = this.shadowRoot.getElementById('user-info');
    const userName = this.shadowRoot.getElementById('user-name');
    const userAvatar = this.shadowRoot.getElementById('user-avatar');
    const loginButton = this.shadowRoot.getElementById('login-button');
    const logoutButton = this.shadowRoot.getElementById('logout-button');
    const storageBadge = this.shadowRoot.getElementById('storage-badge');

    if (user) {
      userInfo.style.display = 'flex';
      loginButton.style.display = 'none';
      logoutButton.style.display = 'block';
      userName.textContent = user.name || user.email;
      userAvatar.src = user.avatar || '';
      storageBadge.textContent = 'Cloud Storage';
      storageBadge.style.borderColor = '#4a9a4a';
    } else {
      userInfo.style.display = 'none';
      loginButton.style.display = 'block';
      logoutButton.style.display = 'none';
      storageBadge.textContent = 'Local Storage';
      storageBadge.style.borderColor = '#6a4a9a';
    }
  }

  setActiveTab(tabName) {
    const navCharacters = this.shadowRoot.getElementById('nav-characters');
    const navCampaigns = this.shadowRoot.getElementById('nav-campaigns');
    
    navCharacters.classList.remove('active');
    navCampaigns.classList.remove('active');
    
    if (tabName === 'characters') {
      navCharacters.classList.add('active');
    } else if (tabName === 'campaigns') {
      navCampaigns.classList.add('active');
    }
  }
}

customElements.define('app-header', AppHeader);
