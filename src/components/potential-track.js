import { 
  VALID_DIE_SIZES, 
  getPerkSlotCount, 
  getAvailableSlots, 
  abbreviatePerk,
  isValidDieSize 
} from '../utils/volatility-constants.js';

/**
 * PotentialTrack - A custom web element for tracking character potential
 * 
 * Features:
 * - Main score/number displayed in the center
 * - Semi-halo of nodes equal to the score surrounding the center
 * - Stress tracking (fills from left side)
 * - Resistance tracking (fills from right side)
 * - Constraint: stress + resistance <= score
 * - Volatility view mode with perk slot indicators
 * - Flip animation between potential and volatility views
 */
class PotentialTrack extends HTMLElement {
  static get observedAttributes() {
    return ['score', 'stress', 'resistance', 'label', 'view-mode', 'die-size'];
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
    this._viewMode = 'potential'; // 'potential' or 'volatility'
    this._dieSize = 4; // D4, D6, D8, D10, D12
    this._perks = {}; // { slotNumber: perkName }
    this._isFlipping = false;
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
    
    if (name === 'view-mode') {
      const validModes = ['potential', 'volatility'];
      if (validModes.includes(newValue)) {
        this._viewMode = newValue;
        this.render();
      }
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
      case 'die-size':
        if (isValidDieSize(numValue)) {
          this._dieSize = numValue;
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
  
  get viewMode() {
    return this._viewMode;
  }
  
  set viewMode(value) {
    this.setAttribute('view-mode', value);
  }
  
  get dieSize() {
    return this._dieSize;
  }
  
  set dieSize(value) {
    this.setAttribute('die-size', value);
  }
  
  get perks() {
    return this._perks;
  }
  
  /**
   * Set perks for this track
   * @param {Object} perks - Object mapping slot numbers to perk names
   */
  setPerks(perks) {
    this._perks = perks || {};
    this.render();
  }
  
  /**
   * Toggle between potential and volatility view modes
   */
  toggleView() {
    if (this._isFlipping) return; // Prevent multiple toggles during animation
    
    this._viewMode = this._viewMode === 'potential' ? 'volatility' : 'potential';
    this._isFlipping = true;
    
    this.dispatchEvent(new CustomEvent('view-toggled', {
      detail: { viewMode: this._viewMode }
    }));
    
    this.render();
    
    // Reset flip state after animation
    setTimeout(() => {
      this._isFlipping = false;
    }, 600); // Match animation duration
  }
  
  /**
   * Get number of perk slots for current die size
   * @returns {number} Number of perk slots
   */
  getPerkSlotCount() {
    return getPerkSlotCount(this._dieSize);
  }
  
  /**
   * Get available slot numbers (excluding min and max values)
   * @returns {Array<number>} Array of available slot numbers
   */
  getAvailableSlots() {
    return getAvailableSlots(this._dieSize);
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
    if (this._viewMode === 'potential') {
      this.renderPotentialView();
    } else {
      this.renderVolatilityView();
    }
  }
  
  /**
   * Render the potential view (stress/resistance tracking)
   */
  renderPotentialView() {
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
      <link rel="stylesheet" href="src/css/potential-track.css">
      <style>
        ${this.getCommonStyles()}
        ${this.getPotentialViewStyles()}
      </style>
      
      <div class="potential-track-container ${this._isFlipping ? 'flipping' : ''}">
        <button class="view-toggle-btn" aria-label="Toggle to volatility view">⚡</button>
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
        </svg>
      </div>
    `;
    
    this.setupPotentialViewEventListeners();
  }
  
  /**
   * Render the volatility view (perk slot management)
   */
  renderVolatilityView() {
    const perkSlots = this.getAvailableSlots();
    const perkSlotCount = this.getPerkSlotCount();
    
    // Calculate positions for perk slots in a circle
    const slotPositions = this.calculatePerkSlotPositions(perkSlots);
    
    const slotsHTML = slotPositions.map((pos, index) => {
      const slotNumber = perkSlots[index];
      const perkName = this._perks[slotNumber] || null;
      const isAvailable = slotNumber <= this._score;
      const isJinxZone = slotNumber <= this._stress;
      
      return `
        <g class="perk-slot ${isAvailable ? 'available' : 'unavailable'} ${isJinxZone ? 'jinx' : ''}" 
           data-slot="${slotNumber}">
          <circle 
            class="slot-circle ${perkName ? 'filled' : 'empty'}" 
            cx="${pos.x}" 
            cy="${pos.y}" 
            r="15" 
            tabindex="0"
            role="button"
            aria-label="Slot ${slotNumber}${perkName ? ': ' + perkName : ': empty'}"
          />
          <text class="slot-number" x="${pos.x}" y="${pos.y - 15}" text-anchor="middle">${slotNumber}</text>
          ${perkName ? `<text class="perk-name" x="${pos.x}" y="${pos.y + 25}" text-anchor="middle">${this.abbreviatePerk(perkName)}</text>` : ''}
        </g>
      `;
    }).join('');

    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="src/css/potential-track.css">
      <style>
        ${this.getCommonStyles()}
        ${this.getVolatilityViewStyles()}
      </style>
      
      <div class="potential-track-container volatility-view ${this._isFlipping ? 'flipping' : ''}">
        <button class="view-toggle-btn" aria-label="Toggle to potential view">📊</button>
        <svg viewBox="0 0 200 200">
          <!-- Perk slots -->
          ${slotsHTML}
          
          <!-- Center die indicator -->
          <circle class="center-circle die-indicator" cx="100" cy="100" r="35" 
                  role="button" 
                  tabindex="0"
                  aria-label="Manage perks" />
          <text class="die-text" x="100" y="95" style="pointer-events: none;">D${this._dieSize}</text>
          <text class="die-subtext" x="100" y="108" style="pointer-events: none;">${Object.keys(this._perks).length}/${perkSlotCount}</text>
          
          <!-- Title label -->
          ${this._label ? `<text class="label title-label" x="100" y="165">${this._label}</text>` : ''}
        </svg>
      </div>
    `;
    
    this.setupVolatilityViewEventListeners();
  }
  
  /**
   * Calculate positions for perk slots in a circle
   */
  calculatePerkSlotPositions(slots) {
    const positions = [];
    const totalSlots = slots.length;
    const radius = 70;
    
    // Arc spans from 225 degrees (bottom-left) to -45 degrees (bottom-right)
    const startAngle = (225 * Math.PI) / 180;
    const endAngle = (-45 * Math.PI) / 180;
    const arcSpan = startAngle - endAngle;
    
    for (let i = 0; i < totalSlots; i++) {
      const t = totalSlots > 1 ? i / (totalSlots - 1) : 0.5;
      const angle = startAngle - (t * arcSpan);
      
      positions.push({
        x: 100 + radius * Math.cos(angle),
        y: 100 - radius * Math.sin(angle)
      });
    }
    
    return positions;
  }
  
  /**
   * Abbreviate perk names for display
   */
  abbreviatePerk(perkName) {
    return abbreviatePerk(perkName);
  }
  
  /**
   * Get common styles for both views
   */
  getCommonStyles() {
    return `
      :host {
        display: inline-block;
        width: 200px;
        height: 200px;
      }
      
      .potential-track-container {
        position: relative;
        width: 100%;
        height: 100%;
        transition: transform 0.6s;
        transform-style: preserve-3d;
      }
      
      .potential-track-container.flipping {
        animation: flip 0.6s ease-in-out;
      }
      
      @keyframes flip {
        0% { transform: rotateY(0deg); }
        50% { transform: rotateY(90deg); }
        100% { transform: rotateY(0deg); }
      }
      
      svg {
        width: 100%;
        height: 100%;
      }
      
      .view-toggle-btn {
        position: absolute;
        top: 5px;
        right: 5px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 2px solid var(--potential-center-stroke, #4a4a6a);
        background: var(--potential-center-bg, #1a1a2e);
        color: var(--potential-label-color, #cd853f);
        font-size: 16px;
        cursor: pointer;
        z-index: 10;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }
      
      .view-toggle-btn:hover {
        transform: scale(1.1);
        background: var(--potential-center-active-bg, #2a2a4e);
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
      
      .label {
        font-family: var(--potential-font, 'Georgia', serif);
        font-size: 10px;
        fill: var(--potential-label-color, #888);
        text-anchor: middle;
      }
      
      .title-label {
        fill: var(--potential-label-color, #cd853f);
        font-size: 14px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 2px;
        transition: font-size 0.2s ease;
      }
    `;
  }
  
  /**
   * Get styles specific to potential view
   */
  getPotentialViewStyles() {
    return `
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
    `;
  }
  
  /**
   * Get styles specific to volatility view
   */
  getVolatilityViewStyles() {
    return `
      .die-text {
        fill: var(--potential-score-color, #e0e0e0);
        font-family: var(--potential-font, 'Georgia', serif);
        font-size: 24px;
        font-weight: bold;
        text-anchor: middle;
        dominant-baseline: central;
      }
      
      .die-subtext {
        fill: var(--potential-label-color, #cd853f);
        font-family: var(--potential-font, 'Georgia', serif);
        font-size: 12px;
        text-anchor: middle;
        dominant-baseline: central;
      }
      
      .perk-slot {
        cursor: pointer;
      }
      
      .slot-circle {
        stroke-width: 2;
        transition: all 0.2s ease;
      }
      
      .slot-circle.empty {
        fill: var(--potential-node-empty, #2a2a4a);
        stroke: var(--potential-node-stroke, #5a5a8a);
      }
      
      .slot-circle.filled {
        fill: var(--potential-center-stroke, #4a4a6a);
        stroke: var(--potential-label-color, #cd853f);
      }
      
      .perk-slot.unavailable .slot-circle {
        opacity: 0.3;
        cursor: not-allowed;
      }
      
      .perk-slot.jinx .slot-circle {
        stroke: var(--potential-stress-stroke, #ff4444);
        stroke-width: 3;
      }
      
      .perk-slot:hover .slot-circle:not(.unavailable) {
        stroke-width: 3;
        transform: scale(1.1);
      }
      
      .slot-number {
        fill: var(--potential-score-color, #e0e0e0);
        font-family: var(--potential-font, 'Georgia', serif);
        font-size: 10px;
        font-weight: bold;
        pointer-events: none;
      }
      
      .perk-name {
        fill: var(--potential-label-color, #cd853f);
        font-family: var(--potential-font, 'Georgia', serif);
        font-size: 9px;
        font-weight: bold;
        pointer-events: none;
      }
    `;
  }
  
  /**
   * Setup event listeners for potential view
   */
  setupPotentialViewEventListeners() {
    // View toggle button
    const toggleBtn = this.shadowRoot.querySelector('.view-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleView();
      });
    }
    
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
    
    // Adjust label font size based on available space
    if (this._label) {
      this.adjustLabelSize();
    }
  }
  
  /**
   * Setup event listeners for volatility view
   */
  setupVolatilityViewEventListeners() {
    // View toggle button
    const toggleBtn = this.shadowRoot.querySelector('.view-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleView();
      });
    }
    
    // Perk slot click handlers
    this.shadowRoot.querySelectorAll('.perk-slot').forEach(slot => {
      const slotNumber = parseInt(slot.dataset.slot, 10);
      const isAvailable = slotNumber <= this._score;
      
      if (isAvailable) {
        slot.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handlePerkSlotClick(slotNumber);
        });
      }
    });
    
    // Center die click - open perk management
    const centerCircle = this.shadowRoot.querySelector('.center-circle');
    if (centerCircle) {
      centerCircle.addEventListener('click', (e) => {
        e.preventDefault();
        this.openPerkManagement();
      });
    }
  }
  
  /**
   * Handle perk slot click
   */
  handlePerkSlotClick(slotNumber) {
    this.dispatchEvent(new CustomEvent('perk-slot-clicked', {
      detail: { 
        slotNumber,
        currentPerk: this._perks[slotNumber] || null,
        potentialName: this._label
      }
    }));
  }
  
  /**
   * Open perk management interface
   */
  openPerkManagement() {
    this.dispatchEvent(new CustomEvent('perk-management-requested', {
      detail: { 
        dieSize: this._dieSize,
        perks: this._perks,
        potentialScore: this._score,
        potentialName: this._label
      }
    }));
  }
  
  /**
   * Adjust label font size to prevent overlap with nodes
   */
  adjustLabelSize() {
    const labelElement = this.shadowRoot.querySelector('.title-label');
    if (!labelElement) return;
    
    // Constants for font sizing
    const DEFAULT_FONT_SIZE = 14;
    const MIN_FONT_SIZE = 8;
    const NODE_RADIUS = 12;
    const NODE_MARGIN_MULTIPLIER = 4; // Extra margin to account for node radius and spacing
    
    // Get the label's bounding box
    const bbox = labelElement.getBBox();
    const labelWidth = bbox.width;
    
    // Calculate available space between the leftmost and rightmost nodes
    const positions = this.calculateNodePositions();
    
    if (positions.length >= 2) {
      const leftNode = positions[0];
      const rightNode = positions[positions.length - 1];
      
      // Available space is between the right edge of left node and left edge of right node
      const availableSpace = rightNode.x - leftNode.x - (NODE_RADIUS * NODE_MARGIN_MULTIPLIER);
      
      // If label is too wide, scale it down proportionally
      if (labelWidth > availableSpace) {
        const scaleFactor = availableSpace / labelWidth;
        const newFontSize = Math.max(MIN_FONT_SIZE, DEFAULT_FONT_SIZE * scaleFactor);
        labelElement.style.fontSize = `${newFontSize}px`;
      }
    }
  }
}

// Register the custom element
customElements.define('potential-track', PotentialTrack);

export default PotentialTrack;
