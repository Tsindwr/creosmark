/**
 * VolatilityDiceRoller - A custom web element for rolling volatility dice pools
 * 
 * Features:
 * - Roll multiple volatility dice of the same size
 * - Select highest die from the pool
 * - Support for different die sizes (d4, d6, d8, d10, d12)
 * - Jinx threshold calculation based on stress
 * - Exploding dice detection
 * - Perk activation on specific die values
 * - Event dispatching for roll results
 */
class VolatilityDiceRoller extends HTMLElement {
  static get observedAttributes() {
    return ['die-size', 'pool-size', 'stress', 'label'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._dieSize = 4; // d4, d6, d8, d10, d12
    this._poolSize = 1; // Number of dice in the pool
    this._stress = 0; // Stress level for jinx threshold
    this._label = 'Volatility';
    this._isRolling = false;
    this._results = [];
    this._highestResult = null;
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'die-size':
        const size = parseInt(newValue, 10);
        if ([4, 6, 8, 10, 12].includes(size)) {
          this._dieSize = size;
        }
        break;
      case 'pool-size':
        this._poolSize = Math.max(1, parseInt(newValue, 10) || 1);
        break;
      case 'stress':
        this._stress = Math.max(0, parseInt(newValue, 10) || 0);
        break;
      case 'label':
        this._label = newValue || 'Volatility';
        break;
    }
    
    this.render();
  }

  get dieSize() {
    return this._dieSize;
  }

  set dieSize(value) {
    this.setAttribute('die-size', value);
  }

  get poolSize() {
    return this._poolSize;
  }

  set poolSize(value) {
    this.setAttribute('pool-size', value);
  }

  get stress() {
    return this._stress;
  }

  set stress(value) {
    this.setAttribute('stress', value);
  }

  get label() {
    return this._label;
  }

  set label(value) {
    this.setAttribute('label', value);
  }

  get results() {
    return this._results;
  }

  get highestResult() {
    return this._highestResult;
  }

  /**
   * Public method to trigger a roll programmatically
   */
  roll() {
    this.performRoll();
  }

  /**
   * Roll a single die
   * @returns {number} Random number between 1 and die size
   */
  rollDie() {
    return Math.floor(Math.random() * this._dieSize) + 1;
  }

  /**
   * Roll the entire volatility pool
   * @returns {Array<number>} Array of roll results
   */
  rollPool() {
    const results = [];
    for (let i = 0; i < this._poolSize; i++) {
      results.push(this.rollDie());
    }
    return results;
  }

  /**
   * Calculate jinx threshold based on stress
   * Jinx threshold cannot be more than one less than the max value on the die
   * @returns {number} Jinx threshold (values <= this trigger jinx effects)
   */
  getJinxThreshold() {
    // Jinx threshold = min(stress, die_size - 1)
    return Math.min(this._stress, this._dieSize - 1);
  }

  /**
   * Check if the die can explode (max value when jinx threshold is maxed)
   * A die explodes when:
   * - It rolls max value
   * - Jinx threshold equals die_size - 1
   * Note: Requires the Charge perk to be purchased (not yet implemented)
   * @returns {boolean} True if conditions allow exploding
   */
  canExplode() {
    return this.getJinxThreshold() === (this._dieSize - 1);
  }

  /**
   * Check if a roll is in the jinx threshold
   * @param {number} value - The die value
   * @returns {boolean} True if value is in jinx threshold
   */
  isJinxed(value) {
    return value <= this.getJinxThreshold() && value > 0;
  }

  /**
   * Get the number of perk slots for the current die size
   * @returns {number} Number of perk slots
   */
  getPerkSlots() {
    const slots = {
      4: 2,
      6: 4,
      8: 6,
      10: 8,
      12: 10
    };
    return slots[this._dieSize] || 0;
  }

  /**
   * Perform the roll with animation
   */
  async performRoll() {
    if (this._isRolling) return;
    
    this._isRolling = true;
    const button = this.shadowRoot.querySelector('.roll-button');
    const diceContainer = this.shadowRoot.querySelector('.dice-container');
    const resultDisplay = this.shadowRoot.querySelector('.result-display');
    
    if (button) button.disabled = true;
    if (diceContainer) diceContainer.classList.add('rolling');
    if (resultDisplay) {
      resultDisplay.textContent = '';
      resultDisplay.classList.remove('show');
    }
    
    // Animate rolling for 1 second
    const animationDuration = 1000;
    const frameInterval = 100;
    const frames = animationDuration / frameInterval;
    
    for (let i = 0; i < frames; i++) {
      const tempRolls = this.rollPool();
      this.displayDice(tempRolls, true);
      await this.sleep(frameInterval);
    }
    
    // Final roll
    this._results = this.rollPool();
    this._highestResult = Math.max(...this._results);
    
    const jinxThreshold = this.getJinxThreshold();
    const isJinxed = this.isJinxed(this._highestResult);
    const isExploding = this._highestResult === this._dieSize && this.canExplode();
    
    // Display results
    this.displayDice(this._results, false);
    if (resultDisplay) {
      resultDisplay.textContent = `Highest: ${this._highestResult}`;
      if (isJinxed) {
        resultDisplay.textContent += ' (Jinxed!)';
      }
      if (isExploding) {
        resultDisplay.textContent += ' 💥 EXPLODING!';
      }
      resultDisplay.classList.add('show');
    }
    
    if (diceContainer) diceContainer.classList.remove('rolling');
    if (button) button.disabled = false;
    this._isRolling = false;
    
    // Dispatch event with results
    this.dispatchEvent(new CustomEvent('volatility-roll-complete', {
      detail: {
        dieSize: this._dieSize,
        poolSize: this._poolSize,
        rolls: this._results,
        highestValue: this._highestResult,
        stress: this._stress,
        jinxThreshold: jinxThreshold,
        isJinxed: isJinxed,
        isExploding: isExploding,
        perkSlots: this.getPerkSlots()
      },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Display dice values
   * @param {Array<number>} rolls - Array of dice values
   * @param {boolean} isAnimating - Whether this is part of animation
   */
  displayDice(rolls, isAnimating) {
    const diceElements = this.shadowRoot.querySelectorAll('.volatility-die');
    const maxValue = Math.max(...rolls);
    
    rolls.forEach((value, index) => {
      if (diceElements[index]) {
        diceElements[index].textContent = value;
        if (!isAnimating) {
          // Highlight the highest die
          if (value === maxValue) {
            diceElements[index].classList.add('highest');
          } else {
            diceElements[index].classList.remove('highest');
          }
          
          // Mark jinxed dice
          if (this.isJinxed(value)) {
            diceElements[index].classList.add('jinxed');
          } else {
            diceElements[index].classList.remove('jinxed');
          }
        }
      }
    });
  }

  /**
   * Get CSS class for die shape based on sides
   * @returns {string} CSS class name for the die shape
   */
  getDieShapeClass() {
    switch(this._dieSize) {
      case 4: return 'die-d4'; // triangle
      case 6: return 'die-d6'; // square
      case 8: return 'die-d8'; // diamond
      case 10: return 'die-d10'; // pentagon-like
      case 12: return 'die-d12'; // pentagon
      default: return 'die-d6';
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
    const shapeClass = this.getDieShapeClass();
    const diceHTML = Array.from({ length: this._poolSize }, (_, i) => `
      <div class="volatility-die ${shapeClass}" data-index="${i}">?</div>
    `).join('');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        
        .volatility-roller-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: var(--volatility-bg, rgba(50, 30, 70, 0.6));
          border-radius: 10px;
          border: 2px solid var(--volatility-border, #6a4a8a);
        }
        
        .roll-button {
          padding: 8px 16px;
          font-size: 14px;
          font-weight: bold;
          color: var(--volatility-button-color, #fff);
          background: var(--volatility-button-bg, #6a4a9a);
          border: 2px solid var(--volatility-button-border, #8a6aba);
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: var(--volatility-font, 'Georgia', serif);
        }
        
        .roll-button:hover:not(:disabled) {
          background: var(--volatility-button-hover-bg, #7a5aaa);
          border-color: var(--volatility-button-hover-border, #9a7aca);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .roll-button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .roll-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .dice-container {
          display: flex;
          gap: 8px;
          min-height: 50px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .dice-container.rolling .volatility-die {
          animation: shake 0.1s infinite;
        }
        
        /* Base die styling */
        .volatility-die {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: bold;
          background: var(--volatility-die-bg, #9a7aca);
          color: var(--volatility-die-color, #fff);
          border: 2px solid var(--volatility-die-border, #6a4a8a);
          box-shadow: 0 3px 5px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
          font-family: var(--volatility-font, 'Georgia', serif);
        }
        
        /* d4 - Triangle */
        .die-d4 {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
          border-radius: 3px;
        }
        
        /* d6 - Square */
        .die-d6 {
          border-radius: 8px;
        }
        
        /* d8 - Diamond */
        .die-d8 {
          border-radius: 4px;
          position: relative;
        }
        
        .die-d8::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border: 2px solid var(--volatility-die-border, #6a4a8a);
          transform: rotate(45deg);
          border-radius: 4px;
          z-index: -1;
          background: var(--volatility-die-bg, #9a7aca);
        }
        
        /* d10 - Pentagon-like */
        .die-d10 {
          clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
          border-radius: 3px;
        }
        
        /* d12 - Pentagon */
        .die-d12 {
          clip-path: polygon(50% 0%, 100% 35%, 85% 100%, 15% 100%, 0% 35%);
          border-radius: 3px;
        }
        
        .volatility-die.highest {
          background: var(--volatility-die-highest-bg, #ffd700);
          color: var(--volatility-die-highest-color, #000);
          border-color: var(--volatility-die-highest-border, #ffaa00);
          transform: scale(1.1);
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
        }
        
        .volatility-die.jinxed {
          background: var(--volatility-die-jinxed-bg, #8b0000);
          border-color: var(--volatility-die-jinxed-border, #ff4444);
        }
        
        .result-display {
          font-size: 16px;
          font-weight: bold;
          color: var(--volatility-result-color, #d0b0ff);
          min-height: 20px;
          opacity: 0;
          transition: opacity 0.3s ease;
          font-family: var(--volatility-font, 'Georgia', serif);
          text-align: center;
        }
        
        .result-display.show {
          opacity: 1;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          width: 100%;
          font-size: 12px;
          color: var(--volatility-info-color, #b090d0);
          font-family: var(--volatility-font, 'Georgia', serif);
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-2px) rotate(-5deg); }
          75% { transform: translateX(2px) rotate(5deg); }
        }
      </style>
      
      <div class="volatility-roller-container">
        <div class="info-row">
          <span>D${this._dieSize} Pool: ${this._poolSize}</span>
          <span>Jinx: ≤${this.getJinxThreshold()}</span>
        </div>
        <button class="roll-button" aria-label="${this._label}">${this._label}</button>
        <div class="dice-container">
          ${diceHTML}
        </div>
        <div class="result-display" role="status" aria-live="polite"></div>
      </div>
    `;

    // Add event listener to button
    const button = this.shadowRoot.querySelector('.roll-button');
    button.addEventListener('click', () => this.performRoll());
  }
}

// Register the custom element
customElements.define('volatility-dice-roller', VolatilityDiceRoller);

export default VolatilityDiceRoller;
