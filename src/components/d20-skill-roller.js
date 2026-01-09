/**
 * D20SkillRoller - A custom web element for rolling D20 skill checks with Sunder resolution
 * 
 * Features:
 * - D20 rolling with visual animation
 * - Success level determination based on Sunder "Roll Under" rules
 * - Color-coded results (Crit, Miff, Success, Mixed, Fail)
 * - Resistance-based thresholds
 * - Volatility dice support (future feature)
 * - Event dispatching for roll results
 */
class D20SkillRoller extends HTMLElement {
  static get observedAttributes() {
    return ['skill-name', 'potential', 'resistance', 'volatility'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._skillName = 'Skill';
    this._potential = 10;
    this._resistance = 0;
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
      case 'resistance':
        this._resistance = parseInt(newValue, 10) || 0;
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

  get resistance() {
    return this._resistance;
  }

  set resistance(value) {
    this.setAttribute('resistance', value);
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
   * Determine success level based on Sunder D20 "Roll Under" resolution rules
   * 
   * Sunder uses a variant "Roll Under" system with Resistance thresholds:
   * - Crit: Roll equals Potential (P)
   * - Success: Roll is between Resistance (R) and Potential (P), exclusive: R < roll < P
   * - Mixed: Roll is between 1 and Resistance (R), inclusive: 1 ≤ roll ≤ R
   * - Fail: Roll is between Potential (P) and 20, exclusive: P < roll < 20
   * - Miff: Roll equals 20 (critical failure)
   * 
   * Note: Success levels with asterisk (Mixed*, Fail*, Success*) involve some cost/caveat
   * related to the action, which may come in the form of stress, fallout, or narrative costs.
   * 
   * @param {number} roll - The D20 roll result (1-20)
   * @param {number} potential - The potential score (P)
   * @param {number} resistance - The resistance value (R)
   * @returns {Object} Result object with level, color, and description
   */
  determineSuccess(roll, potential, resistance) {
    // Critical failures take priority - MIFF always triggers on natural 20
    if (roll === 20) {
      return {
        level: 'MIFF',
        color: '#9966CC', // Sunder Purple
        bgColor: 'rgba(153, 102, 204, 0.2)',
        description: 'Critical Failure!',
        emoji: '💀',
        hasCost: true // Miff has double cost
      };
    }
    
    // Critical success - roll equals potential (but not 20)
    if (roll === potential) {
      return {
        level: 'CRIT',
        color: '#FFD700', // Sunder Yellow (gold)
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
        color: '#44ff44', // Green
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
        color: '#FFA500', // Orange (will flash)
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
        color: '#ff4444', // Red
        bgColor: 'rgba(255, 68, 68, 0.2)',
        description: 'Failure',
        emoji: '✗',
        hasCost: true
      };
    }
    
    // Fallback (should not happen with valid inputs)
    return {
      level: 'UNKNOWN',
      color: '#888888',
      bgColor: 'rgba(136, 136, 136, 0.2)',
      description: 'Unknown Result',
      emoji: '?',
      hasCost: false
    };
  }

  /**
   * Perform the roll with animation
   */
  async performRoll() {
    if (this._isRolling) return;
    
    this._isRolling = true;
    const d20Display = this.shadowRoot.querySelector('.d20-display');
    
    if (d20Display) {
      d20Display.classList.add('rolling');
      d20Display.style.pointerEvents = 'none'; // Disable clicking during roll
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
    const result = this.determineSuccess(roll, this._potential, this._resistance);
    
    this._lastRoll = {
      roll,
      potential: this._potential,
      resistance: this._resistance,
      result
    };
    
    // Display results
    this.displayD20(roll);
    this.displayResult(roll, result);
    
    if (d20Display) {
      d20Display.classList.remove('rolling');
      d20Display.style.pointerEvents = ''; // Re-enable clicking
    }
    this._isRolling = false;
    
    // Dispatch event with results
    this.dispatchEvent(new CustomEvent('roll-complete', {
      detail: {
        skillName: this._skillName,
        roll,
        potential: this._potential,
        resistance: this._resistance,
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
    const d20Display = this.shadowRoot.querySelector('.d20-display');
    const d20Value = this.shadowRoot.querySelector('.d20-value');
    
    if (!d20Display || !d20Value) return;
    
    // Remove any previous result classes
    d20Display.classList.remove('result-crit', 'result-success', 'result-mixed', 'result-fail', 'result-miff');
    
    // Add the appropriate result class
    const resultClass = `result-${result.level.toLowerCase().replace('_', '-')}`;
    d20Display.classList.add(resultClass);
    
    // Reset to default after 2.5 seconds
    setTimeout(() => {
      d20Display.classList.remove('result-crit', 'result-success', 'result-mixed', 'result-fail', 'result-miff');
      d20Value.textContent = '?';
    }, 2500);
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
          display: inline-block;
        }
        
        .d20-display {
          position: relative;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.9);
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
          cursor: pointer;
          transition: all 0.3s ease;
          border: 3px solid rgba(100, 100, 120, 0.5);
        }
        
        .d20-display:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .d20-display.rolling {
          animation: spin 0.1s linear infinite;
        }
        
        .d20-value {
          font-size: 28px;
          font-weight: bold;
          color: #2a2a4a;
          font-family: 'Georgia', serif;
          transition: color 0.3s ease;
        }
        
        /* Result state colors - applied dynamically */
        .d20-display.result-crit {
          background: rgba(255, 215, 0, 0.9);
          border-color: #FFD700;
        }
        
        .d20-display.result-crit .d20-value {
          color: #1a1a2e;
        }
        
        .d20-display.result-success {
          background: rgba(68, 255, 68, 0.9);
          border-color: #44ff44;
        }
        
        .d20-display.result-success .d20-value {
          color: #1a1a2e;
        }
        
        .d20-display.result-mixed {
          background: rgba(255, 165, 0, 0.9);
          border-color: #FFA500;
          animation: flash 0.5s ease-in-out 4;
        }
        
        .d20-display.result-mixed .d20-value {
          color: #1a1a2e;
        }
        
        .d20-display.result-fail {
          background: rgba(255, 68, 68, 0.9);
          border-color: #ff4444;
        }
        
        .d20-display.result-fail .d20-value {
          color: #fff;
        }
        
        .d20-display.result-miff {
          background: rgba(153, 102, 204, 0.9);
          border-color: #9966CC;
        }
        
        .d20-display.result-miff .d20-value {
          color: #fff;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      </style>
      
      <div class="d20-display" role="button" tabindex="0" aria-label="Roll ${this._skillName}">
        <div class="d20-value">?</div>
      </div>
    `;

    // Add event listeners for clicking the die itself
    const display = this.shadowRoot.querySelector('.d20-display');
    display.addEventListener('click', () => this.performRoll());
    display.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.performRoll();
      }
    });
  }
}

// Register the custom element
customElements.define('d20-skill-roller', D20SkillRoller);

export default D20SkillRoller;
