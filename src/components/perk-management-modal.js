import { 
  PERKS,
  getPerkSlotCount,
  getAvailableSlots 
} from '../utils/volatility-constants.js';

/**
 * PerkManagementModal - A custom web element for managing perks on volatility dice
 * 
 * Features:
 * - Modal dialog for perk management
 * - List of available perks with costs and descriptions
 * - Visual representation of current perk assignments
 * - Drag-and-drop or click-to-assign interface
 * - Beat cost tracking
 */

class PerkManagementModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isOpen = false;
    this._potentialName = '';
    this._dieSize = 4;
    this._potentialScore = 10;
    this._perks = {}; // Current perk assignments { slotNumber: perkName }
    this._selectedSlot = null; // Currently selected slot for assignment
    this._draggedPerk = null; // Perk being dragged
  }

  connectedCallback() {
    this.render();
  }

  /**
   * Open the modal with the given configuration
   */
  open(config) {
    this._isOpen = true;
    this._potentialName = config.potentialName || '';
    this._dieSize = config.dieSize || 4;
    this._potentialScore = config.potentialScore || 10;
    this._perks = { ...(config.perks || {}) };
    this._selectedSlot = null;
    this.render();
  }

  /**
   * Close the modal
   */
  close() {
    this._isOpen = false;
    this.render();
  }

  /**
   * Get available slots for the current die size
   */
  getAvailableSlots() {
    return getAvailableSlots(this._dieSize);
  }

  /**
   * Get perk slot count
   */
  getPerkSlotCount() {
    return getPerkSlotCount(this._dieSize);
  }

  /**
   * Assign a perk to a slot
   */
  assignPerk(slotNumber, perkName) {
    // Check if slot is available (≤ potential score)
    if (slotNumber > this._potentialScore) {
      this.showMessage('This slot is not yet available. Increase your potential score first.');
      return false;
    }

    // Check if perk is already assigned to another slot
    const existingSlot = Object.entries(this._perks).find(([, name]) => name === perkName);
    if (existingSlot) {
      this.showMessage(`${perkName} is already assigned to slot ${existingSlot[0]}`);
      return false;
    }

    this._perks[slotNumber] = perkName;
    this.render();
    this.notifyChange('assign', slotNumber, perkName);
    return true;
  }

  /**
   * Remove a perk from a slot
   */
  removePerk(slotNumber) {
    const perkName = this._perks[slotNumber];
    if (perkName) {
      delete this._perks[slotNumber];
      this.render();
      this.notifyChange('remove', slotNumber, perkName);
      return true;
    }
    return false;
  }

  /**
   * Swap perks between two slots
   */
  swapPerks(slot1, slot2) {
    const perk1 = this._perks[slot1];
    const perk2 = this._perks[slot2];

    if (perk1) {
      this._perks[slot2] = perk1;
    } else {
      delete this._perks[slot2];
    }

    if (perk2) {
      this._perks[slot1] = perk2;
    } else {
      delete this._perks[slot1];
    }

    this.render();
    this.notifyChange('swap', [slot1, slot2], [perk1, perk2]);
  }

  /**
   * Notify parent of changes
   */
  notifyChange(action, slot, perk) {
    this.dispatchEvent(new CustomEvent('perk-changed', {
      detail: {
        action,
        slot,
        perk,
        perks: { ...this._perks },
        potentialName: this._potentialName
      }
    }));
  }

  /**
   * Show a temporary message
   */
  showMessage(text) {
    const messageEl = this.shadowRoot.querySelector('.message');
    if (messageEl) {
      messageEl.textContent = text;
      messageEl.style.display = 'block';
      setTimeout(() => {
        messageEl.style.display = 'none';
      }, 3000);
    }
  }

  /**
   * Handle slot click
   */
  handleSlotClick(slotNumber) {
    const perkName = this._perks[slotNumber];
    
    if (this._selectedSlot === slotNumber) {
      // Deselect if clicking the same slot
      this._selectedSlot = null;
      this.render();
    } else if (this._selectedSlot !== null) {
      // Swap with selected slot
      this.swapPerks(this._selectedSlot, slotNumber);
      this._selectedSlot = null;
    } else if (perkName) {
      // Select this slot for swapping
      this._selectedSlot = slotNumber;
      this.render();
    } else {
      // Empty slot - select it for assignment
      this._selectedSlot = slotNumber;
      this.render();
    }
  }

  /**
   * Handle perk selection from library
   */
  handlePerkSelect(perkName) {
    if (this._selectedSlot !== null) {
      this.assignPerk(this._selectedSlot, perkName);
      this._selectedSlot = null;
    } else {
      this.showMessage('Please select a slot first');
    }
  }

  render() {
    if (!this._isOpen) {
      this.shadowRoot.innerHTML = '';
      return;
    }

    const availableSlots = this.getAvailableSlots();
    const perkSlotCount = this.getPerkSlotCount();

    const slotsHTML = availableSlots.map(slotNumber => {
      const perkName = this._perks[slotNumber] || null;
      const isAvailable = slotNumber <= this._potentialScore;
      const isSelected = this._selectedSlot === slotNumber;

      return `
        <div class="slot-item ${isAvailable ? 'available' : 'unavailable'} ${isSelected ? 'selected' : ''}" 
             data-slot="${slotNumber}">
          <div class="slot-header">
            <span class="slot-number">Slot ${slotNumber}</span>
            ${perkName && isAvailable ? `<button class="remove-btn" data-slot="${slotNumber}">✕</button>` : ''}
          </div>
          <div class="slot-content">
            ${perkName ? `
              <div class="assigned-perk">
                <strong>${perkName}</strong>
                <p class="perk-desc">${PERKS[perkName]?.description || 'Description not available'}</p>
              </div>
            ` : `
              <div class="empty-slot">
                ${isAvailable ? 'Click to assign' : 'Not available'}
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');

    const perksHTML = Object.entries(PERKS).map(([name, info]) => {
      const isAssigned = Object.values(this._perks).includes(name);
      return `
        <div class="perk-item ${isAssigned ? 'assigned' : ''}" data-perk="${name}">
          <div class="perk-header">
            <strong>${name}</strong>
            <span class="perk-cost">${info.cost} beats</span>
          </div>
          <p class="perk-desc">${info.description}</p>
          ${isAssigned ? '<span class="assigned-badge">Assigned</span>' : ''}
        </div>
      `;
    }).join('');

    this.shadowRoot.innerHTML = `
      <style>
        ${this.getStyles()}
      </style>
      
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Manage Perks: ${this._potentialName}</h2>
            <button class="close-btn" aria-label="Close">✕</button>
          </div>
          
          <div class="modal-body">
            <div class="info-section">
              <p><strong>Volatility Die:</strong> D${this._dieSize} (${Object.keys(this._perks).length}/${perkSlotCount} slots filled)</p>
              <p><strong>Potential Score:</strong> ${this._potentialScore} (slots ≤ ${this._potentialScore} are available)</p>
              <div class="message"></div>
            </div>
            
            <div class="sections-container">
              <div class="slots-section">
                <h3>Perk Slots</h3>
                <p class="section-hint">Click a slot to select it, then click a perk to assign. Click two filled slots to swap.</p>
                <div class="slots-grid">
                  ${slotsHTML}
                </div>
              </div>
              
              <div class="perks-section">
                <h3>Available Perks</h3>
                <p class="section-hint">Select a slot first, then click a perk to assign it. Cost: 1 beat to assign/move/swap.</p>
                <div class="perks-list">
                  ${perksHTML}
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="save-btn">Save Changes</button>
            <button class="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Close button
    const closeBtn = this.shadowRoot.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.handleCancel());
    }

    // Overlay click
    const overlay = this.shadowRoot.querySelector('.modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.handleCancel();
        }
      });
    }

    // Cancel button
    const cancelBtn = this.shadowRoot.querySelector('.cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.handleCancel());
    }

    // Save button
    const saveBtn = this.shadowRoot.querySelector('.save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.handleSave());
    }

    // Slot clicks
    this.shadowRoot.querySelectorAll('.slot-item.available').forEach(slot => {
      const slotNumber = parseInt(slot.dataset.slot, 10);
      slot.addEventListener('click', (e) => {
        // Don't trigger if clicking remove button
        if (e.target.classList.contains('remove-btn')) return;
        this.handleSlotClick(slotNumber);
      });
    });

    // Remove buttons
    this.shadowRoot.querySelectorAll('.remove-btn').forEach(btn => {
      const slotNumber = parseInt(btn.dataset.slot, 10);
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removePerk(slotNumber);
      });
    });

    // Perk clicks
    this.shadowRoot.querySelectorAll('.perk-item:not(.assigned)').forEach(perk => {
      const perkName = perk.dataset.perk;
      perk.addEventListener('click', () => {
        this.handlePerkSelect(perkName);
      });
    });
  }

  handleCancel() {
    this.dispatchEvent(new CustomEvent('modal-cancelled'));
    this.close();
  }

  handleSave() {
    this.dispatchEvent(new CustomEvent('modal-saved', {
      detail: {
        perks: { ...this._perks },
        potentialName: this._potentialName
      }
    }));
    this.close();
  }

  getStyles() {
    return `
      * {
        box-sizing: border-box;
      }
      
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
      }
      
      .modal-content {
        background: linear-gradient(135deg, rgba(30, 30, 50, 0.98) 0%, rgba(40, 40, 60, 0.98) 100%);
        border: 2px solid rgba(255, 215, 0, 0.3);
        border-radius: 15px;
        max-width: 900px;
        width: 100%;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      }
      
      .modal-header {
        padding: 20px 25px;
        border-bottom: 2px solid rgba(255, 215, 0, 0.2);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .modal-header h2 {
        margin: 0;
        color: #ffd700;
        font-family: 'Georgia', serif;
        font-size: 1.5rem;
      }
      
      .close-btn {
        background: none;
        border: none;
        color: #e0e0e0;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        transition: all 0.2s ease;
      }
      
      .close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffd700;
      }
      
      .modal-body {
        padding: 20px 25px;
        overflow-y: auto;
        flex: 1;
        color: #e0e0e0;
      }
      
      .info-section {
        margin-bottom: 20px;
        padding: 15px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        border: 1px solid rgba(255, 215, 0, 0.2);
      }
      
      .info-section p {
        margin: 5px 0;
        font-size: 0.95rem;
      }
      
      .message {
        display: none;
        margin-top: 10px;
        padding: 10px;
        background: rgba(255, 100, 100, 0.2);
        border: 1px solid #ff6666;
        border-radius: 5px;
        color: #ff6666;
        font-size: 0.9rem;
      }
      
      .sections-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      
      @media (max-width: 768px) {
        .sections-container {
          grid-template-columns: 1fr;
        }
      }
      
      .slots-section, .perks-section {
        display: flex;
        flex-direction: column;
      }
      
      .slots-section h3, .perks-section h3 {
        margin: 0 0 10px 0;
        color: #ffd700;
        font-family: 'Georgia', serif;
        font-size: 1.2rem;
      }
      
      .section-hint {
        margin: 0 0 15px 0;
        font-size: 0.85rem;
        color: #a0a0b0;
        font-style: italic;
      }
      
      .slots-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .slot-item {
        padding: 12px;
        background: rgba(40, 40, 60, 0.6);
        border: 2px solid rgba(74, 74, 106, 0.5);
        border-radius: 8px;
        transition: all 0.2s ease;
      }
      
      .slot-item.available {
        cursor: pointer;
      }
      
      .slot-item.available:hover {
        background: rgba(50, 50, 70, 0.7);
        border-color: #6a6a9a;
      }
      
      .slot-item.selected {
        border-color: #ffd700;
        box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
      }
      
      .slot-item.unavailable {
        opacity: 0.4;
        cursor: not-allowed;
      }
      
      .slot-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      
      .slot-number {
        font-weight: bold;
        color: #ffd700;
        font-size: 0.9rem;
      }
      
      .remove-btn {
        background: rgba(255, 68, 68, 0.2);
        border: 1px solid #ff4444;
        color: #ff4444;
        border-radius: 50%;
        width: 22px;
        height: 22px;
        cursor: pointer;
        font-size: 0.9rem;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      .remove-btn:hover {
        background: rgba(255, 68, 68, 0.4);
        transform: scale(1.1);
      }
      
      .slot-content {
        font-size: 0.9rem;
      }
      
      .assigned-perk strong {
        color: #cd853f;
      }
      
      .empty-slot {
        color: #808090;
        font-style: italic;
        font-size: 0.85rem;
      }
      
      .perks-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .perk-item {
        padding: 12px;
        background: rgba(40, 40, 60, 0.6);
        border: 2px solid rgba(74, 74, 106, 0.5);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
      }
      
      .perk-item:not(.assigned):hover {
        background: rgba(50, 50, 70, 0.7);
        border-color: #6a6a9a;
      }
      
      .perk-item.assigned {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .perk-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }
      
      .perk-header strong {
        color: #cd853f;
        font-size: 0.95rem;
      }
      
      .perk-cost {
        color: #a0a0b0;
        font-size: 0.85rem;
      }
      
      .perk-desc {
        margin: 0;
        font-size: 0.85rem;
        color: #c0c0c0;
        line-height: 1.4;
      }
      
      .assigned-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(205, 133, 63, 0.3);
        color: #cd853f;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: bold;
      }
      
      .modal-footer {
        padding: 15px 25px;
        border-top: 2px solid rgba(255, 215, 0, 0.2);
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }
      
      .save-btn, .cancel-btn {
        padding: 10px 20px;
        font-size: 1rem;
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: 'Georgia', serif;
      }
      
      .save-btn {
        background: linear-gradient(135deg, #4a9a4a 0%, #5aaa5a 100%);
        border: 2px solid #5aaa5a;
        color: #fff;
      }
      
      .save-btn:hover {
        background: linear-gradient(135deg, #5aaa5a 0%, #6aba6a 100%);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(74, 154, 74, 0.4);
      }
      
      .cancel-btn {
        background: linear-gradient(135deg, #666 0%, #777 100%);
        border: 2px solid #777;
        color: #fff;
      }
      
      .cancel-btn:hover {
        background: linear-gradient(135deg, #777 0%, #888 100%);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(100, 100, 100, 0.4);
      }
    `;
  }
}

// Register the custom element
customElements.define('perk-management-modal', PerkManagementModal);

export default PerkManagementModal;
