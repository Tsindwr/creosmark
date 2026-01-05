/**
 * PotentialTrack - A custom web element for tracking character potential
 * 
 * Features:
 * - Main score/number displayed in the center
 * - Semi-halo of nodes equal to the score surrounding the center
 * - Stress tracking (fills from left side)
 * - Resistance tracking (fills from right side)
 * - Constraint: stress + resistance <= score
 */
class PotentialTrack extends HTMLElement {
  static get observedAttributes() {
    return ['score', 'stress', 'resistance', 'label'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._score = 10;
    this._stress = 0;
    this._resistance = 0;
    this._label = '';
    this._longPressTimer = null;
    this._isLongPress = false;
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    if (name === 'label') {
      this._label = newValue || '';
      this.render();
      return;
    }
    
    const numValue = parseInt(newValue, 10);
    if (isNaN(numValue) || numValue < 0) return;

    switch (name) {
      case 'score':
        this._score = numValue;
        // Reset stress and resistance if they exceed the new score
        if (this._stress + this._resistance > this._score) {
          this._stress = 0;
          this._resistance = 0;
        }
        break;
      case 'stress':
        if (numValue + this._resistance <= this._score) {
          this._stress = numValue;
        }
        break;
      case 'resistance':
        if (this._stress + numValue <= this._score) {
          this._resistance = numValue;
        }
        break;
    }
    
    this.render();
  }

  get label() {
    return this._label;
  }

  set label(value) {
    this.setAttribute('label', value);
  }

  get score() {
    return this._score;
  }

  set score(value) {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      this.setAttribute('score', numValue);
    }
  }

  get stress() {
    return this._stress;
  }

  set stress(value) {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue + this._resistance <= this._score) {
      this.setAttribute('stress', numValue);
    }
  }

  get resistance() {
    return this._resistance;
  }

  set resistance(value) {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && this._stress + numValue <= this._score) {
      this.setAttribute('resistance', numValue);
    }
  }

  /**
   * Add stress to the track (queue pushing from left)
   * @returns {boolean} True if stress was added, false if not possible
   */
  addStress() {
    if (this._stress + this._resistance < this._score) {
      this._stress++;
      this.setAttribute('stress', this._stress);
      this.dispatchEvent(new CustomEvent('stress-changed', { 
        detail: { stress: this._stress, resistance: this._resistance, score: this._score }
      }));
      return true;
    }
    return false;
  }

  /**
   * Remove stress from the track
   * @returns {boolean} True if stress was removed, false if not possible
   */
  removeStress() {
    if (this._stress > 0) {
      this._stress--;
      this.setAttribute('stress', this._stress);
      this.dispatchEvent(new CustomEvent('stress-changed', { 
        detail: { stress: this._stress, resistance: this._resistance, score: this._score }
      }));
      return true;
    }
    return false;
  }

  /**
   * Add resistance to the track (queue pushing from right)
   * @returns {boolean} True if resistance was added, false if not possible
   */
  addResistance() {
    if (this._stress + this._resistance < this._score) {
      this._resistance++;
      this.setAttribute('resistance', this._resistance);
      this.dispatchEvent(new CustomEvent('resistance-changed', { 
        detail: { stress: this._stress, resistance: this._resistance, score: this._score }
      }));
      return true;
    }
    return false;
  }

  /**
   * Remove resistance from the track
   * @returns {boolean} True if resistance was removed, false if not possible
   */
  removeResistance() {
    if (this._resistance > 0) {
      this._resistance--;
      this.setAttribute('resistance', this._resistance);
      this.dispatchEvent(new CustomEvent('resistance-changed', { 
        detail: { stress: this._stress, resistance: this._resistance, score: this._score }
      }));
      return true;
    }
    return false;
  }

  /**
   * Handle node click events
   * @param {number} index - The index of the clicked node
   */
  handleNodeClick(index) {
    const midpoint = Math.floor(this._score / 2);
    
    // Left half handles stress (0 to midpoint-1)
    // Right half handles resistance (midpoint to score-1)
    if (index < midpoint) {
      // Clicking on the left side increments or decrements stress by 1
      if (index < this._stress) {
        // Node is already filled with stress - decrement by 1
        this.removeStress();
      } else {
        // Node is empty - increment stress by 1
        this.addStress();
      }
    } else {
      // Clicking on the right side increments or decrements resistance by 1
      const resistanceStartIndex = this._score - this._resistance;
      if (index >= resistanceStartIndex) {
        // Node is already filled with resistance - decrement by 1
        this.removeResistance();
      } else {
        // Node is empty - increment resistance by 1
        this.addResistance();
      }
    }
  }

  /**
   * Calculate node positions in a semi-circle (arc) around the center
   * @returns {Array} Array of {x, y, angle} positions for each node
   */
  calculateNodePositions() {
    const positions = [];
    const totalNodes = this._score;
    
    // Arc spans from 225 degrees (bottom-left) to -45 degrees (bottom-right)
    // Going counterclockwise around the top
    const startAngle = (225 * Math.PI) / 180; // Start angle in radians
    const endAngle = (-45 * Math.PI) / 180;   // End angle in radians
    const arcSpan = startAngle - endAngle;     // Total arc span
    
    // Radius for the node positions
    const radius = 70;
    
    for (let i = 0; i < totalNodes; i++) {
      // Distribute nodes evenly along the arc
      const t = totalNodes > 1 ? i / (totalNodes - 1) : 0.5;
      const angle = startAngle - (t * arcSpan);
      
      positions.push({
        x: 100 + radius * Math.cos(angle),
        y: 100 - radius * Math.sin(angle),
        angle: angle
      });
    }
    
    return positions;
  }

  /**
   * Get the state of a node based on stress and resistance values
   * @param {number} index - The node index
   * @returns {string} 'stress' | 'resistance' | 'empty'
   */
  getNodeState(index) {
    // Stress fills from left (index 0 onwards)
    if (index < this._stress) {
      return 'stress';
    }
    
    // Resistance fills from right (index score-1 backwards)
    const resistanceStartIndex = this._score - this._resistance;
    if (index >= resistanceStartIndex) {
      return 'resistance';
    }
    
    return 'empty';
  }

  render() {
    const positions = this.calculateNodePositions();
    
    const nodesHTML = positions.map((pos, index) => {
      const state = this.getNodeState(index);
      const stateClass = state !== 'empty' ? state : '';
      return `
        <circle 
          class="node ${stateClass}" 
          cx="${pos.x}" 
          cy="${pos.y}" 
          r="12" 
          data-index="${index}"
          tabindex="0"
          role="button"
          aria-label="Node ${index + 1}: ${state === 'empty' ? 'empty' : state}"
        />
      `;
    }).join('');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          width: 200px;
          height: 200px;
        }
        
        .potential-track-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        svg {
          width: 100%;
          height: 100%;
        }
        
        .center-circle {
          fill: var(--potential-center-bg, #1a1a2e);
          stroke: var(--potential-center-stroke, #4a4a6a);
          stroke-width: 3;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .center-circle:hover {
          stroke: var(--potential-center-hover-stroke, #6a6a9a);
          stroke-width: 4;
        }
        
        .center-circle:active {
          fill: var(--potential-center-active-bg, #2a2a4e);
        }
        
        .score-text {
          fill: var(--potential-score-color, #e0e0e0);
          font-family: var(--potential-font, 'Georgia', serif);
          font-size: 32px;
          font-weight: bold;
          text-anchor: middle;
          dominant-baseline: central;
        }
        
        .node {
          fill: var(--potential-node-empty, #2a2a4a);
          stroke: var(--potential-node-stroke, #5a5a8a);
          stroke-width: 2;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .node:hover {
          stroke: var(--potential-node-hover-stroke, #8a8aba);
          stroke-width: 3;
          transform-origin: center;
        }
        
        .node:focus {
          outline: none;
          stroke: var(--potential-node-focus-stroke, #aaaaff);
          stroke-width: 3;
        }
        
        .node.stress {
          fill: var(--potential-stress-fill, #8b0000);
          stroke: var(--potential-stress-stroke, #ff4444);
        }
        
        .node.resistance {
          fill: var(--potential-resistance-fill, #004d00);
          stroke: var(--potential-resistance-stroke, #44ff44);
        }
        
        .label {
          font-family: var(--potential-font, 'Georgia', serif);
          font-size: 10px;
          fill: var(--potential-label-color, #888);
          text-anchor: middle;
        }
        
        .stress-label {
          fill: var(--potential-stress-stroke, #ff4444);
        }
        
        .resistance-label {
          fill: var(--potential-resistance-stroke, #44ff44);
        }
        
        .title-label {
          fill: var(--potential-label-color, #c0c0d0);
          font-size: 14px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
      </style>
      
      <div class="potential-track-container">
        <svg viewBox="0 0 200 200">
          <!-- Semi-circle arc of nodes -->
          ${nodesHTML}
          
          <!-- Center circle with score (interactive) -->
          <circle class="center-circle" cx="100" cy="100" r="40" 
                  role="button" 
                  tabindex="0"
                  aria-label="Interact to add stress or resistance" />
          <text class="score-text" x="100" y="100" style="pointer-events: none;">${this._score}</text>
          
          <!-- Title label below the stat, between nodes -->
          ${this._label ? `<text class="label title-label" x="100" y="165">${this._label}</text>` : ''}
          
          <!-- Labels -->
<!--          <text class="label stress-label" x="30" y="190">Stress: ${this._stress}</text>-->
<!--          <text class="label resistance-label" x="170" y="190">Res: ${this._resistance}</text>-->
        </svg>
      </div>
    `;

    // Add click event listeners to nodes
    this.shadowRoot.querySelectorAll('.node').forEach(node => {
      node.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index, 10);
        this.handleNodeClick(index);
      });
      
      // Keyboard accessibility
      node.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const index = parseInt(e.target.dataset.index, 10);
          this.handleNodeClick(index);
        }
      });
    });
    
    // Add event listeners to center circle
    const centerCircle = this.shadowRoot.querySelector('.center-circle');
    
    // Left click - add stress
    centerCircle.addEventListener('click', (e) => {
      e.preventDefault();
      if (!this._isLongPress) {
        this.addStress();
      }
    });
    
    // Right click - add resistance
    centerCircle.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.addResistance();
    });
    
    // Touch events for mobile
    centerCircle.addEventListener('touchstart', (e) => {
      this._isLongPress = false;
      this._longPressTimer = setTimeout(() => {
        this._isLongPress = true;
        this.addResistance();
        // Haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }, 500); // 500ms for long press
    });
    
    centerCircle.addEventListener('touchend', (e) => {
      e.preventDefault(); // Prevent synthetic click event
      if (this._longPressTimer) {
        clearTimeout(this._longPressTimer);
      }
      if (!this._isLongPress) {
        this.addStress();
      }
      this._isLongPress = false;
    });
    
    centerCircle.addEventListener('touchcancel', (e) => {
      if (this._longPressTimer) {
        clearTimeout(this._longPressTimer);
      }
      this._isLongPress = false;
    });
    
    // Keyboard accessibility for center circle
    centerCircle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // Default to adding stress on keyboard
        this.addStress();
      } else if (e.key === 'r' || e.key === 'R') {
        // Allow 'R' key to add resistance
        e.preventDefault();
        this.addResistance();
      }
    });
  }
}

// Register the custom element
customElements.define('potential-track', PotentialTrack);

export default PotentialTrack;
