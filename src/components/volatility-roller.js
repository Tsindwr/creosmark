/**
 * VolatilityRollerComponent - A custom web element for rolling volatility dice with perk display
 * 
 * Features:
 * - Visual representation of volatility die with perk slots
 * - Roll animation with perk activation
 * - Display of perks assigned to slots
 * - Exploding die effects
 * - Integration with stress/jinx threshold
 */

import { VolatilityDie } from '../services/volatility-die.js';
import { VolatilityRoller } from '../services/volatility-roller.js';
import { PerkFactory } from '../services/perk.js';

class VolatilityRollerComponent extends HTMLElement {
  static get observedAttributes() {
    return ['potential-name', 'stress', 'resistance'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._potentialName = 'Potential';
    this._stress = 0;
    this._resistance = 0;
    this._volatilityDie = new VolatilityDie('d4');
    this._isRolling = false;
    this._lastRoll = null;
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'potential-name':
        this._potentialName = newValue || 'Potential';
        break;
      case 'stress':
        this._stress = parseInt(newValue, 10) || 0;
        break;
      case 'resistance':
        this._resistance = parseInt(newValue, 10) || 0;
        break;
    }
    
    this.render();
  }

  get potentialName() {
    return this._potentialName;
  }

  set potentialName(value) {
    this.setAttribute('potential-name', value);
  }

  get stress() {
    return this._stress;
  }

  set stress(value) {
    this.setAttribute('stress', value);
  }

  get resistance() {
    return this._resistance;
  }

  set resistance(value) {
    this.setAttribute('resistance', value);
  }

  get volatilityDie() {
    return this._volatilityDie;
  }

  set volatilityDie(die) {
    this._volatilityDie = die;
    this.render();
  }

  /**
   * Roll the volatility die
   */
  async roll(potentialTrack = null) {
    if (this._isRolling) return;
    
    this._isRolling = true;
    const dieDisplay = this.shadowRoot.querySelector('.volatility-die-display');
    
    if (dieDisplay) {
      dieDisplay.classList.add('rolling');
    }

    // Animate rolling for 1 second
    const animationDuration = 1000;
    const frameInterval = 50;
    const frames = animationDuration / frameInterval;
    
    for (let i = 0; i < frames; i++) {
      const tempRoll = this._volatilityDie.roll();
      this.displayValue(tempRoll);
      await this.sleep(frameInterval);
    }

    // Final roll with perk activation
    const context = {
      stress: this._stress,
      resistance: this._resistance,
      potentialTrack: potentialTrack
    };

    const result = VolatilityRoller.rollSingle(this._volatilityDie, context);
    this._lastRoll = result;

    // Display final result
    this.displayValue(result.finalValue);
    this.displayResult(result);

    if (dieDisplay) {
      dieDisplay.classList.remove('rolling');
    }
    this._isRolling = false;

    // Dispatch event with results
    this.dispatchEvent(new CustomEvent('volatility-roll-complete', {
      detail: {
        potentialName: this._potentialName,
        result: result
      },
      bubbles: true,
      composed: true
    }));

    return result;
  }

  /**
   * Display a value on the die
   */
  displayValue(value) {
    const valueDisplay = this.shadowRoot.querySelector('.die-value');
    if (valueDisplay) {
      valueDisplay.textContent = value;
    }
  }

  /**
   * Display the result with perk info
   */
  displayResult(result) {
    const resultDisplay = this.shadowRoot.querySelector('.result-display');
    if (!resultDisplay) return;

    let resultText = `Rolled: ${result.finalValue}`;
    
    if (result.perkActivated) {
      resultText += ` (${result.perkActivated})`;
    }

    if (result.exploded) {
      resultText = `💥 EXPLODED! ${result.explosionResult.message}`;
    }

    resultDisplay.textContent = resultText;
    resultDisplay.classList.add('show');

    // Reset after delay
    setTimeout(() => {
      resultDisplay.classList.remove('show');
    }, 3000);
  }

  /**
   * Get the shape of the die based on size
   */
  getDieShape() {
    const shapes = {
      'd4': 'polygon(50% 0%, 0% 100%, 100% 100%)', // Triangle
      'd6': 'none', // Square (default)
      'd8': 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', // Diamond
      'd10': 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)', // Pentagon
      'd12': 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' // Hexagon
    };
    return shapes[this._volatilityDie.dieSize] || 'none';
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  render() {
    const dieShape = this.getDieShape();
    const maxValue = this._volatilityDie.getMaxValue();
    const validSlots = this._volatilityDie.getValidSlotNumbers();
    const jinxThreshold = this._volatilityDie.getJinxThreshold(this._stress);

    // Generate slot displays
    const slotsHTML = validSlots.map(slot => {
      const perk = this._volatilityDie.getPerkInSlot(slot);
      const isInJinx = slot <= jinxThreshold && jinxThreshold > 0;
      const jinxClass = isInJinx ? 'jinx' : '';
      
      return `
        <div class="perk-slot ${jinxClass}" data-slot="${slot}">
          <span class="slot-number">${slot}</span>
          ${perk ? `<span class="perk-name">${perk}</span>` : '<span class="empty-slot">Empty</span>'}
        </div>
      `;
    }).join('');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }

        .volatility-roller-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 15px;
          background: rgba(30, 30, 50, 0.7);
          border-radius: 10px;
          border: 2px solid rgba(74, 74, 106, 0.8);
          min-width: 200px;
        }

        .die-info {
          font-size: 12px;
          color: #888;
          text-align: center;
        }

        .volatility-die-display {
          position: relative;
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          clip-path: ${dieShape};
          cursor: pointer;
          transition: all 0.3s ease;
          border: 3px solid rgba(200, 200, 255, 0.5);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .volatility-die-display:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
        }

        .volatility-die-display.rolling {
          animation: spin 0.1s linear infinite;
        }

        .die-value {
          font-size: 32px;
          font-weight: bold;
          color: #fff;
          font-family: 'Georgia', serif;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        .perk-slots {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
        }

        .perk-slot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          background: rgba(40, 40, 60, 0.6);
          border-radius: 4px;
          border: 1px solid rgba(80, 80, 100, 0.5);
          font-size: 11px;
        }

        .perk-slot.jinx {
          border-color: rgba(255, 68, 68, 0.8);
          background: rgba(139, 0, 0, 0.2);
        }

        .slot-number {
          font-weight: bold;
          color: #aaa;
          min-width: 20px;
        }

        .perk-name {
          color: #ffd700;
          font-weight: bold;
        }

        .empty-slot {
          color: #666;
          font-style: italic;
        }

        .charge-indicator {
          padding: 4px 8px;
          background: rgba(255, 215, 0, 0.2);
          border: 1px solid rgba(255, 215, 0, 0.5);
          border-radius: 4px;
          font-size: 10px;
          color: #ffd700;
          text-align: center;
        }

        .result-display {
          min-height: 20px;
          font-size: 12px;
          color: #ffd700;
          text-align: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .result-display.show {
          opacity: 1;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>

      <div class="volatility-roller-container">
        <div class="die-info">
          ${this._potentialName} - ${this._volatilityDie.dieSize.toUpperCase()}
          ${this._stress > 0 ? `(Jinx: ≤${jinxThreshold})` : ''}
        </div>

        <div class="volatility-die-display" role="button" tabindex="0" aria-label="Roll ${this._potentialName} volatility die">
          <div class="die-value">?</div>
        </div>

        ${this._volatilityDie.isCharged ? '<div class="charge-indicator">⚡ CHARGED</div>' : ''}

        <div class="perk-slots">
          ${slotsHTML}
        </div>

        <div class="result-display" role="status" aria-live="polite"></div>
      </div>
    `;

    // Add click event to roll
    const display = this.shadowRoot.querySelector('.volatility-die-display');
    if (display) {
      display.addEventListener('click', () => this.roll());
      display.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.roll();
        }
      });
    }
  }
}

// Register the custom element
customElements.define('volatility-roller', VolatilityRollerComponent);

export default VolatilityRollerComponent;
