/**
 * VolatilityDie - Manages volatility die configuration, perk slots, and rolling
 * 
 * Features:
 * - Die sizes: D4, D6, D8, D10, D12
 * - Perk slot management (slots are values between min and max, excluding them)
 * - Perk assignment to slots
 * - Charge system for exploding dice
 * - Rolling with perk activation
 */

import { PerkFactory } from './perk.js';

export class VolatilityDie {
  constructor(dieSize = 'd4') {
    this.dieSize = dieSize; // d4, d6, d8, d10, d12
    this.perkSlots = {}; // Map of slot number to perk name
    this.isCharged = false; // Whether the die has the Charge perk
    this.purchasedPerks = []; // List of perk names that have been purchased
  }

  /**
   * Get the maximum value for this die size
   */
  getMaxValue() {
    const maxValues = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12 };
    return maxValues[this.dieSize] || 4;
  }

  /**
   * Get the number of perk slots for this die size
   */
  getNumPerkSlots() {
    const slotCounts = { d4: 2, d6: 4, d8: 6, d10: 8, d12: 10 };
    return slotCounts[this.dieSize] || 2;
  }

  /**
   * Get the valid slot numbers (excluding min=1 and max values)
   */
  getValidSlotNumbers() {
    const maxValue = this.getMaxValue();
    const validSlots = [];
    
    for (let i = 2; i < maxValue; i++) {
      validSlots.push(i);
    }
    
    return validSlots;
  }

  /**
   * Check if a slot number is valid for this die
   */
  isValidSlot(slotNumber) {
    const maxValue = this.getMaxValue();
    return slotNumber > 1 && slotNumber < maxValue;
  }

  /**
   * Assign a perk to a slot
   * @param {number} slotNumber - The slot number to assign to
   * @param {string} perkName - Name of the perk to assign
   * @param {number} potentialScore - Character's potential score for this stat
   * @returns {boolean} True if assignment succeeded
   */
  assignPerk(slotNumber, perkName, potentialScore) {
    // Validate slot number
    if (!this.isValidSlot(slotNumber)) {
      throw new Error(`Invalid slot number ${slotNumber} for ${this.dieSize}`);
    }

    // Can only assign perks to slots equal to or lower than potential score
    if (slotNumber > potentialScore) {
      throw new Error(`Cannot assign perk to slot ${slotNumber} - exceeds potential score ${potentialScore}`);
    }

    // Validate perk exists
    PerkFactory.createPerk(perkName); // Will throw if invalid

    this.perkSlots[slotNumber] = perkName;
    return true;
  }

  /**
   * Remove a perk from a slot
   */
  removePerk(slotNumber) {
    delete this.perkSlots[slotNumber];
  }

  /**
   * Swap perks between two slots
   */
  swapPerks(slot1, slot2) {
    const perk1 = this.perkSlots[slot1];
    const perk2 = this.perkSlots[slot2];

    if (perk2) {
      this.perkSlots[slot1] = perk2;
    } else {
      delete this.perkSlots[slot1];
    }

    if (perk1) {
      this.perkSlots[slot2] = perk1;
    } else {
      delete this.perkSlots[slot2];
    }
  }

  /**
   * Move a perk from one slot to another
   */
  movePerk(fromSlot, toSlot, potentialScore) {
    const perk = this.perkSlots[fromSlot];
    if (!perk) {
      throw new Error(`No perk in slot ${fromSlot} to move`);
    }

    this.removePerk(fromSlot);
    this.assignPerk(toSlot, perk, potentialScore);
  }

  /**
   * Get the perk assigned to a slot
   */
  getPerkInSlot(slotNumber) {
    return this.perkSlots[slotNumber] || null;
  }

  /**
   * Check if all perk slots are filled
   */
  areAllSlotsFilled() {
    const validSlots = this.getValidSlotNumbers();
    return validSlots.every(slot => this.perkSlots[slot] !== undefined);
  }

  /**
   * Purchase a perk (adds to purchased list)
   */
  purchasePerk(perkName) {
    if (this.purchasedPerks.includes(perkName)) {
      return false; // Already purchased
    }
    this.purchasedPerks.push(perkName);
    return true;
  }

  /**
   * Purchase the Charge perk for this die
   * Can only be purchased when all slots are filled
   * Cost: Number of perk slots in Beats
   */
  purchaseCharge() {
    if (this.isCharged) {
      return false; // Already charged
    }

    if (!this.areAllSlotsFilled()) {
      throw new Error('All perk slots must be filled before purchasing Charge');
    }

    this.isCharged = true;
    return true;
  }

  /**
   * Get the cost to purchase Charge for this die
   */
  getChargeCost() {
    return this.getNumPerkSlots();
  }

  /**
   * Roll the volatility die
   * @returns {number} The rolled value
   */
  roll() {
    const maxValue = this.getMaxValue();
    return Math.floor(Math.random() * maxValue) + 1;
  }

  /**
   * Check if the die should explode (roll max when charged and at max jinx threshold)
   * @param {number} rollValue - The value rolled
   * @param {number} stress - Current stress level
   * @returns {boolean} True if die explodes
   */
  shouldExplode(rollValue, stress) {
    if (!this.isCharged) {
      return false;
    }

    const maxValue = this.getMaxValue();
    const maxJinxThreshold = maxValue - 1;

    return rollValue === maxValue && stress >= maxJinxThreshold;
  }

  /**
   * Handle die explosion - level up the die
   * @returns {Object} Explosion result with benefits
   */
  explode() {
    const dieSizes = ['d4', 'd6', 'd8', 'd10', 'd12'];
    const currentIndex = dieSizes.indexOf(this.dieSize);

    if (currentIndex >= dieSizes.length - 1) {
      return {
        exploded: false,
        message: 'Already at maximum die size (d12)',
        newDieSize: this.dieSize
      };
    }

    const oldDieSize = this.dieSize;
    this.dieSize = dieSizes[currentIndex + 1];
    this.perkSlots = {}; // Clear all perk assignments
    this.isCharged = false; // Remove charge

    return {
      exploded: true,
      oldDieSize,
      newDieSize: this.dieSize,
      benefits: {
        autoCrit: true,
        recollectAction: true, // 1 usage of Recollect bonus action
        thread: 1, // Gain 1 Thread
        shortRest: true // Benefits of a short rest
      },
      message: `Die exploded! Upgraded from ${oldDieSize} to ${this.dieSize}`
    };
  }

  /**
   * Calculate jinx threshold based on stress
   * @param {number} stress - Current stress level
   * @returns {number} Jinx threshold value
   */
  getJinxThreshold(stress) {
    const maxValue = this.getMaxValue();
    return Math.min(stress, maxValue - 1);
  }

  /**
   * Check if a roll is in the jinx threshold
   * @param {number} rollValue - The value rolled
   * @param {number} stress - Current stress level
   * @returns {boolean} True if in jinx threshold
   */
  isInJinxThreshold(rollValue, stress) {
    const jinxThreshold = this.getJinxThreshold(stress);
    return rollValue <= jinxThreshold && jinxThreshold > 0;
  }

  /**
   * Serialize to JSON for storage
   */
  toJSON() {
    return {
      dieSize: this.dieSize,
      perkSlots: this.perkSlots,
      isCharged: this.isCharged,
      purchasedPerks: this.purchasedPerks
    };
  }

  /**
   * Create from JSON data
   */
  static fromJSON(data) {
    const die = new VolatilityDie(data.dieSize);
    die.perkSlots = data.perkSlots || {};
    die.isCharged = data.isCharged || false;
    die.purchasedPerks = data.purchasedPerks || [];
    return die;
  }
}
