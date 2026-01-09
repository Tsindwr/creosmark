/**
 * D20SkillRoller - A custom web element for rolling D20 skill checks with Sunder resolution
 * 
 * Features:
 * - D20 rolling with visual animation
 * - Success level determination based on Sunder "Roll Under" rules
 * - Color-coded results (Crit, Miff, Success, Mixed, Fail)
 * - Resistance-based thresholds
 * - Volatility dice support with proficiency integration
 * - Event dispatching for roll results
 */
class D20SkillRoller extends HTMLElement {
  static get observedAttributes() {
    return ['skill-name', 'potential', 'resistance', 'proficiency', 'volatility-die-size', 'stress'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._skillName = 'Skill';
    this._potential = 10;
    this._resistance = 0;
    this._proficiency = 'none'; // 'none', 'proficient', 'expert'
    this._volatilityDieSize = 4; // d4, d6, d8, d10, d12
    this._stress = 0;
    this._additionalVolatilityDice = 0; // User-selected additional dice
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
      case 'proficiency':
        if (['none', 'proficient', 'expert'].includes(newValue)) {
          this._proficiency = newValue;
        }
        break;
      case 'volatility-die-size':
        const size = parseInt(newValue, 10);
        if ([4, 6, 8, 10, 12].includes(size)) {
          this._volatilityDieSize = size;
        }
        break;
      case 'stress':
        this._stress = parseInt(newValue, 10) || 0;
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

  get proficiency() {
    return this._proficiency;
  }

  set proficiency(value) {
    this.setAttribute('proficiency', value);
  }

  get volatilityDieSize() {
    return this._volatilityDieSize;
  }

  set volatilityDieSize(value) {
    this.setAttribute('volatility-die-size', value);
  }

  get stress() {
    return this._stress;
  }

  set stress(value) {
    this.setAttribute('stress', value);
  }

  get additionalVolatilityDice() {
    return this._additionalVolatilityDice;
  }

  set additionalVolatilityDice(value) {
    this._additionalVolatilityDice = Math.max(0, parseInt(value, 10) || 0);
    this.updateVolatilityDisplay();
  }

  get lastRoll() {
    return this._lastRoll;
  }

  /**
   * Calculate the total volatility pool size based on proficiency and additional dice
   * @returns {number} Total number of volatility dice to roll
   */
  getVolatilityPoolSize() {
    let poolSize = 0;
    
    // Add dice from proficiency
    if (this._proficiency === 'proficient') {
      poolSize += 1;
    } else if (this._proficiency === 'expert') {
      poolSize += 2;
    }
    
    // Add additional dice selected by user
    poolSize += this._additionalVolatilityDice;
    
    return poolSize;
  }

  /**
   * Roll volatility dice
   * @returns {Object|null} Volatility roll result or null if no volatility dice
   */
  rollVolatility() {
    const poolSize = this.getVolatilityPoolSize();
    if (poolSize === 0) return null;
    
    const rolls = [];
    for (let i = 0; i < poolSize; i++) {
      rolls.push(Math.floor(Math.random() * this._volatilityDieSize) + 1);
    }
    
    const highestValue = Math.max(...rolls);
    const jinxThreshold = Math.min(this._stress, this._volatilityDieSize - 1);
    const isJinxed = highestValue <= jinxThreshold && highestValue > 0;
    
    return {
      rolls,
      highestValue,
      jinxThreshold,
      isJinxed,
      dieSize: this._volatilityDieSize
    };
  }

  /**
   * Apply volatility information to the result
   * Note: The actual success level modification based on volatility
   * will be implemented when the perk system is complete.
   * For now, this adds volatility info to the description.
   * 
   * @param {Object} result - The D20 roll result
   * @param {Object} volatility - The volatility roll result
   * @returns {Object} Modified result
   */
  applyVolatilityModifier(result, volatility) {
    if (!volatility) return result;
    
    // Create a copy of the result to modify
    const modifiedResult = { ...result };
    
    // Add volatility info to the result
    modifiedResult.volatility = volatility;
    
    // Add modifier info to description
    if (volatility.isJinxed) {
      modifiedResult.description += ` (Volatility Jinxed: ${volatility.highestValue})`;
    } else {
      modifiedResult.description += ` (Volatility: ${volatility.highestValue})`;
    }
    
    return modifiedResult;
  }

  /**
   * Update the volatility display in the UI
   */
  updateVolatilityDisplay() {
    const display = this.shadowRoot.querySelector('.volatility-info');
    if (display) {
      const poolSize = this.getVolatilityPoolSize();
      if (poolSize > 0) {
        display.textContent = `${poolSize}d${this._volatilityDieSize}`;
        display.style.display = 'block';
      } else {
        display.style.display = 'none';
      }
    }
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
    
    // Final D20 roll
    const roll = this.rollD20();
    let result = this.determineSuccess(roll, this._potential, this._resistance);
    
    // Roll volatility if applicable
    const volatility = this.rollVolatility();
    if (volatility) {
      result = this.applyVolatilityModifier(result, volatility);
    }
    
    this._lastRoll = {
      roll,
      potential: this._potential,
      resistance: this._resistance,
      result,
      volatility
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
        result,
        volatility,
        proficiency: this._proficiency
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
    const poolSize = this.getVolatilityPoolSize();
    const hasVolatility = poolSize > 0;
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        
        .skill-roller-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
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
        
        .volatility-controls {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          color: #9a7aca;
        }
        
        .volatility-info {
          font-weight: bold;
          font-family: 'Georgia', serif;
          display: ${hasVolatility ? 'block' : 'none'};
        }
        
        .volatility-button {
          width: 18px;
          height: 18px;
          font-size: 12px;
          padding: 0;
          background: rgba(154, 122, 202, 0.3);
          border: 1px solid #9a7aca;
          border-radius: 3px;
          cursor: pointer;
          color: #9a7aca;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .volatility-button:hover {
          background: rgba(154, 122, 202, 0.5);
          transform: scale(1.1);
        }
        
        .volatility-button:active {
          transform: scale(0.95);
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
      
      <div class="skill-roller-container">
        <div class="d20-display" role="button" tabindex="0" aria-label="Roll ${this._skillName}">
          <div class="d20-value">?</div>
        </div>
        <div class="volatility-controls">
          <button class="volatility-button" data-action="decrease" aria-label="Remove volatility die" title="Remove volatility die">-</button>
          <span class="volatility-info">${poolSize}d${this._volatilityDieSize}</span>
          <button class="volatility-button" data-action="increase" aria-label="Add volatility die" title="Add volatility die">+</button>
        </div>
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
    
    // Add event listeners for volatility buttons
    const decreaseBtn = this.shadowRoot.querySelector('[data-action="decrease"]');
    const increaseBtn = this.shadowRoot.querySelector('[data-action="increase"]');
    
    decreaseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this._additionalVolatilityDice > 0) {
        this._additionalVolatilityDice--;
        this.updateVolatilityDisplay();
      }
    });
    
    increaseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._additionalVolatilityDice++;
      this.updateVolatilityDisplay();
    });
  }
}

// Register the custom element
customElements.define('d20-skill-roller', D20SkillRoller);

export default D20SkillRoller;
