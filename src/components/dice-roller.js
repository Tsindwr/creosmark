/**
 * DiceRoller - A custom web element for rolling dice with animation
 * 
 * Features:
 * - Configurable number of dice and sides
 * - Visual animation for rolling
 * - Custom roll logic support (e.g., drop highest/lowest)
 * - Event dispatching for roll results
 */
class DiceRoller extends HTMLElement {
  static get observedAttributes() {
    return ['dice', 'sides', 'label'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._dice = 3;
    this._sides = 4; // Changing dice equation to keep the average closer to 5 for initial stats of a level 1 character
    this._label = 'Roll';
    this._isRolling = false;
    this._results = [];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'dice':
        this._dice = parseInt(newValue, 10) || 3;
        break;
      case 'sides':
        this._sides = parseInt(newValue, 10) || 6;
        break;
      case 'label':
        this._label = newValue || 'Roll';
        break;
    }
    
    this.render();
  }

  get dice() {
    return this._dice;
  }

  set dice(value) {
    this.setAttribute('dice', value);
  }

  get sides() {
    return this._sides;
  }

  set sides(value) {
    this.setAttribute('sides', value);
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

  /**
   * Public method to trigger a roll programmatically
   */
  roll() {
    this.performRoll();
  }

  /**
   * Roll a single die
   * @returns {number} Random number between 1 and sides
   */
  rollDie() {
    return Math.floor(Math.random() * this._sides) + 1;
  }

  /**
   * Roll multiple dice
   * @returns {Array<number>} Array of roll results
   */
  rollDice() {
    const results = [];
    for (let i = 0; i < this._dice; i++) {
      results.push(this.rollDie());
    }
    return results;
  }

  /**
   * Calculate result using Sunder rules: 3d4 drop the highest
   * Special case: if all 3 dice roll 1, the result is 1
   * @param {Array<number>} rolls - Array of dice rolls
   * @returns {number} Final calculated result
   */
  calculateSunderResult(rolls) {
    // Input validation
    if (!Array.isArray(rolls) || rolls.length === 0) {
      return 0;
    }
    
    // Validate all values are numbers
    if (rolls.some(roll => typeof roll !== 'number' || isNaN(roll))) {
      return 0;
    }
    
    // Special case: all dice are 1
    if (rolls.every(roll => roll === 1)) {
      return 1;
    }
    
    // Drop the highest
    const sorted = [...rolls].sort((a, b) => a - b);
    sorted.pop(); // Remove highest
    
    // Sum remaining dice
    return sorted.reduce((sum, roll) => sum + roll, 0);
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
    if (resultDisplay) resultDisplay.textContent = '';
    
    // Animate rolling for 1 second with intermediate values
    const animationDuration = 1000;
    const frameInterval = 100;
    const frames = animationDuration / frameInterval;
    
    for (let i = 0; i < frames; i++) {
      const tempRolls = this.rollDice();
      this.displayDice(tempRolls, true);
      await this.sleep(frameInterval);
    }
    
    // Final roll
    this._results = this.rollDice();
    const finalResult = this.calculateSunderResult(this._results);
    
    // Display results
    this.displayDice(this._results, false);
    if (resultDisplay) {
      resultDisplay.textContent = `Result: ${finalResult}`;
      resultDisplay.classList.add('show');
    }
    
    if (diceContainer) diceContainer.classList.remove('rolling');
    if (button) button.disabled = false;
    this._isRolling = false;
    
    // Dispatch event with results
    this.dispatchEvent(new CustomEvent('roll-complete', {
      detail: {
        rolls: this._results,
        result: finalResult,
        droppedHighest: Math.max(...this._results)
      },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Display dice values
   * @param {Array<number>} rolls - Array of dice values
   * @param {boolean} isAnimating - Whether this is part of animation
   * 
   * Note: When multiple dice show the same highest value (e.g., [4, 6, 6]),
   * only the FIRST occurrence is visually marked as dropped, since the
   * calculation only removes one die from the total.
   */
  displayDice(rolls, isAnimating) {
    const diceElements = this.shadowRoot.querySelectorAll('.die');
    const allOnes = rolls.every(r => r === 1);
    const maxValue = Math.max(...rolls);
    let droppedIndex = -1;
    
    // Find the first occurrence of the highest value to mark as dropped
    if (!allOnes) {
      droppedIndex = rolls.indexOf(maxValue);
    }
    
    rolls.forEach((value, index) => {
      if (diceElements[index]) {
        diceElements[index].textContent = value;
        if (!isAnimating) {
          // Only mark the first highest die as dropped
          if (index === droppedIndex) {
            diceElements[index].classList.add('dropped');
          } else {
            diceElements[index].classList.remove('dropped');
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
    switch(this._sides) {
      case 2: return 'die-d2'; // circle
      case 4: return 'die-d4'; // triangle
      case 6: return 'die-d6'; // square
      case 8: return 'die-d8'; // diamond
      case 10: return 'die-d10'; // d10 shape
      case 12: return 'die-d12'; // pentagon
      case 20: return 'die-d20'; // hexagon
      default: return 'die-d6'; // default to square
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
    const diceHTML = Array.from({ length: this._dice }, (_, i) => `
      <div class="die ${shapeClass}" data-index="${i}">?</div>
    `).join('');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        
        .dice-roller-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: var(--dice-roller-bg, rgba(30, 30, 50, 0.6));
          border-radius: 10px;
          border: 2px solid var(--dice-roller-border, #4a4a6a);
        }
        
        .roll-button {
          padding: 8px 16px;
          font-size: 14px;
          font-weight: bold;
          color: var(--dice-roller-button-color, #fff);
          background: var(--dice-roller-button-bg, #4a4a9a);
          border: 2px solid var(--dice-roller-button-border, #6a6aba);
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: var(--dice-roller-font, 'Georgia', serif);
        }
        
        .roll-button:hover:not(:disabled) {
          background: var(--dice-roller-button-hover-bg, #5a5aaa);
          border-color: var(--dice-roller-button-hover-border, #7a7aca);
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
        }
        
        .dice-container.rolling .die {
          animation: shake 0.1s infinite;
        }
        
        /* Base die styling */
        .die {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: bold;
          background: var(--dice-roller-die-bg, #fff);
          color: var(--dice-roller-die-color, #000);
          border: 2px solid var(--dice-roller-die-border, #333);
          box-shadow: 0 3px 5px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
          font-family: var(--dice-roller-font, 'Georgia', serif);
        }
        
        /* d2 - Circle */
        .die-d2 {
          border-radius: 50%;
        }
        
        /* d4 - Triangle - using clip-path */
        .die-d4 {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
          border-radius: 3px;
        }
        
        /* d6 - Square */
        .die-d6 {
          border-radius: 8px;
        }
        
        /* d8 - Diamond (rotated square) - keep text upright */
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
          border: 2px solid var(--dice-roller-die-border, #333);
          transform: rotate(45deg);
          border-radius: 4px;
          z-index: -1;
          background: var(--dice-roller-die-bg, #fff);
        }
        
        /* d10 - Pentagon-like shape */
        .die-d10 {
          clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
          border-radius: 3px;
        }
        
        /* d12 - Pentagon */
        .die-d12 {
          clip-path: polygon(50% 0%, 100% 35%, 85% 100%, 15% 100%, 0% 35%);
          border-radius: 3px;
        }
        
        /* d20 - Hexagon */
        .die-d20 {
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
          border-radius: 2px;
        }
        
        .die.dropped {
          opacity: 0.4;
          background: var(--dice-roller-die-dropped-bg, #999);
          text-decoration: line-through;
        }
        
        .result-display {
          font-size: 16px;
          font-weight: bold;
          color: var(--dice-roller-result-color, #ffd700);
          min-height: 20px;
          opacity: 0;
          transition: opacity 0.3s ease;
          font-family: var(--dice-roller-font, 'Georgia', serif);
        }
        
        .result-display.show {
          opacity: 1;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-2px) rotate(-5deg); }
          75% { transform: translateX(2px) rotate(5deg); }
        }
      </style>
      
      <div class="dice-roller-container">
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
customElements.define('dice-roller', DiceRoller);

export default DiceRoller;
