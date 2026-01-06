/**
 * D20SkillRoller - A custom web element for rolling D20 skill checks with Sunder resolution
 * 
 * Features:
 * - D20 rolling with visual animation
 * - Success level determination based on Sunder rules
 * - Color-coded results (Crit, Miff, Success, Fail, Success with Cost, Mixed)
 * - Volatility dice support (future feature)
 * - Event dispatching for roll results
 */
class D20SkillRoller extends HTMLElement {
  static get observedAttributes() {
    return ['skill-name', 'potential', 'volatility'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._skillName = 'Skill';
    this._potential = 10;
    this._volatility = 0; // For future implementation
    this._isRolling = false;
    this._lastRoll = null;
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'skill-name':
        this._skillName = newValue || 'Skill';
        break;
      case 'potential':
        this._potential = parseInt(newValue, 10) || 10;
        break;
      case 'volatility':
        this._volatility = parseInt(newValue, 10) || 0;
        break;
    }
    
    this.render();
  }

  get skillName() {
    return this._skillName;
  }

  set skillName(value) {
    this.setAttribute('skill-name', value);
  }

  get potential() {
    return this._potential;
  }

  set potential(value) {
    this.setAttribute('potential', value);
  }

  get volatility() {
    return this._volatility;
  }

  set volatility(value) {
    this.setAttribute('volatility', value);
  }

  get lastRoll() {
    return this._lastRoll;
  }

  /**
   * Public method to trigger a roll programmatically
   */
  roll() {
    this.performRoll();
  }

  /**
   * Roll a D20
   * @returns {number} Random number between 1 and 20
   */
  rollD20() {
    return Math.floor(Math.random() * 20) + 1;
  }

  /**
   * Determine success level based on Sunder D20 resolution rules
   * 
   * Success Levels:
   * - CRIT: Natural 20 (automatic critical success)
   * - MIFF: Natural 1 (automatic critical failure)
   * - SUCCESS: Roll >= Potential
   * - SUCCESS_WITH_COST: Roll >= (Potential - 3) but < Potential
   * - MIXED: Roll >= (Potential - 6) but < (Potential - 3) 
   * - FAIL: Roll < (Potential - 6)
   * 
   * @param {number} roll - The D20 roll result (1-20)
   * @param {number} potential - The potential score (target)
   * @returns {Object} Result object with level, color, and description
   */
  determineSuccess(roll, potential) {
    // Critical results override everything
    if (roll === 20) {
      return {
        level: 'CRIT',
        color: '#FFD700', // Sunder Yellow (gold)
        bgColor: 'rgba(255, 215, 0, 0.2)',
        description: 'Critical Success!',
        emoji: '⭐'
      };
    }
    
    if (roll === 1) {
      return {
        level: 'MIFF',
        color: '#9966CC', // Sunder Purple
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
        color: '#44ff44', // Green
        bgColor: 'rgba(68, 255, 68, 0.2)',
        description: 'Success!',
        emoji: '✓'
      };
    }
    
    if (roll >= costThreshold) {
      return {
        level: 'SUCCESS_WITH_COST',
        color: '#FFA500', // Orange
        bgColor: 'rgba(255, 165, 0, 0.2)',
        description: 'Success with Cost',
        emoji: '⚠'
      };
    }
    
    if (roll >= mixedThreshold) {
      return {
        level: 'MIXED',
        color: '#FFA500', // Orange (will flash)
        bgColor: 'rgba(255, 165, 0, 0.2)',
        description: 'Mixed Success',
        emoji: '~',
        flash: true
      };
    }
    
    return {
      level: 'FAIL',
      color: '#ff4444', // Red
      bgColor: 'rgba(255, 68, 68, 0.2)',
      description: 'Failure',
      emoji: '✗'
    };
  }

  /**
   * Perform the roll with animation
   */
  async performRoll() {
    if (this._isRolling) return;
    
    this._isRolling = true;
    const button = this.shadowRoot.querySelector('.roll-button');
    const d20Display = this.shadowRoot.querySelector('.d20-display');
    const resultDisplay = this.shadowRoot.querySelector('.result-display');
    
    if (button) button.disabled = true;
    if (d20Display) d20Display.classList.add('rolling');
    if (resultDisplay) {
      resultDisplay.textContent = '';
      resultDisplay.className = 'result-display';
    }
    
    // Animate rolling for 1 second
    const animationDuration = 1000;
    const frameInterval = 50;
    const frames = animationDuration / frameInterval;
    
    for (let i = 0; i < frames; i++) {
      const tempRoll = this.rollD20();
      this.displayD20(tempRoll);
      await this.sleep(frameInterval);
    }
    
    // Final roll
    const roll = this.rollD20();
    const result = this.determineSuccess(roll, this._potential);
    
    this._lastRoll = {
      roll,
      potential: this._potential,
      result
    };
    
    // Display results
    this.displayD20(roll);
    this.displayResult(roll, result);
    
    if (d20Display) d20Display.classList.remove('rolling');
    if (button) button.disabled = false;
    this._isRolling = false;
    
    // Dispatch event with results
    this.dispatchEvent(new CustomEvent('roll-complete', {
      detail: {
        skillName: this._skillName,
        roll,
        potential: this._potential,
        result
      },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Display the D20 value
   * @param {number} value - The D20 value to display
   */
  displayD20(value) {
    const d20Display = this.shadowRoot.querySelector('.d20-value');
    if (d20Display) {
      d20Display.textContent = value;
    }
  }

  /**
   * Display the result with color and animation
   * @param {number} roll - The roll value
   * @param {Object} result - The result object
   */
  displayResult(roll, result) {
    const resultDisplay = this.shadowRoot.querySelector('.result-display');
    if (resultDisplay) {
      resultDisplay.textContent = `${result.emoji} ${result.description}`;
      resultDisplay.style.color = result.color;
      resultDisplay.style.backgroundColor = result.bgColor;
      resultDisplay.classList.add('show');
      
      if (result.flash) {
        resultDisplay.classList.add('flash');
      }
    }
    
    // Update info display
    const infoDisplay = this.shadowRoot.querySelector('.info-display');
    if (infoDisplay) {
      infoDisplay.textContent = `Roll: ${roll} vs Potential: ${this._potential}`;
    }
  }

  /**
   * Sleep helper for animation
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .skill-roller-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          padding: 20px;
          background: var(--skill-roller-bg, rgba(30, 30, 50, 0.8));
          border-radius: 15px;
          border: 2px solid var(--skill-roller-border, #4a4a6a);
          transition: all 0.3s ease;
        }
        
        .skill-roller-container:hover {
          border-color: var(--skill-roller-border-hover, #6a6a9a);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }
        
        .skill-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 10px;
        }
        
        .skill-name {
          font-size: 18px;
          font-weight: bold;
          color: var(--skill-roller-name-color, #ffd700);
          font-family: var(--skill-roller-font, 'Georgia', serif);
        }
        
        .potential-badge {
          padding: 4px 12px;
          background: var(--skill-roller-badge-bg, rgba(70, 70, 110, 0.8));
          border: 1px solid var(--skill-roller-badge-border, #5a5a8a);
          border-radius: 12px;
          font-size: 14px;
          font-weight: bold;
          color: var(--skill-roller-badge-color, #a0a0d0);
          font-family: var(--skill-roller-font, 'Georgia', serif);
        }
        
        .d20-display {
          position: relative;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fff 0%, #e0e0e0 100%);
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
          transition: all 0.3s ease;
        }
        
        .d20-display.rolling {
          animation: spin 0.1s linear infinite;
        }
        
        .d20-value {
          font-size: 48px;
          font-weight: bold;
          color: #1a1a2e;
          font-family: var(--skill-roller-font, 'Georgia', serif);
          text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
        }
        
        .roll-button {
          padding: 12px 30px;
          font-size: 16px;
          font-weight: bold;
          color: var(--skill-roller-button-color, #fff);
          background: var(--skill-roller-button-bg, #4a4a9a);
          border: 2px solid var(--skill-roller-button-border, #6a6aba);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: var(--skill-roller-font, 'Georgia', serif);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .roll-button:hover:not(:disabled) {
          background: var(--skill-roller-button-hover-bg, #5a5aaa);
          border-color: var(--skill-roller-button-hover-border, #7a7aca);
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(74, 74, 154, 0.4);
        }
        
        .roll-button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 3px 6px rgba(74, 74, 154, 0.4);
        }
        
        .roll-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .result-display {
          min-height: 40px;
          padding: 10px 20px;
          font-size: 20px;
          font-weight: bold;
          border-radius: 8px;
          opacity: 0;
          transition: opacity 0.3s ease;
          font-family: var(--skill-roller-font, 'Georgia', serif);
          text-align: center;
          border: 2px solid currentColor;
        }
        
        .result-display.show {
          opacity: 1;
        }
        
        .result-display.flash {
          animation: flash 0.5s ease-in-out infinite;
        }
        
        .info-display {
          font-size: 14px;
          color: var(--skill-roller-info-color, #a0a0b0);
          font-family: var(--skill-roller-font, 'Georgia', serif);
          text-align: center;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
      
      <div class="skill-roller-container">
        <div class="skill-header">
          <span class="skill-name">${this._skillName}</span>
          <span class="potential-badge">Potential: ${this._potential}</span>
        </div>
        
        <div class="d20-display">
          <div class="d20-value">?</div>
        </div>
        
        <button class="roll-button" aria-label="Roll ${this._skillName}">🎲 Roll D20</button>
        
        <div class="result-display" role="status" aria-live="polite"></div>
        <div class="info-display"></div>
      </div>
    `;

    // Add event listener to button
    const button = this.shadowRoot.querySelector('.roll-button');
    button.addEventListener('click', () => this.performRoll());
  }
}

// Register the custom element
customElements.define('d20-skill-roller', D20SkillRoller);

export default D20SkillRoller;
