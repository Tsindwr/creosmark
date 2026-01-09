/**
 * Volatility System Constants
 * 
 * Shared constants for the volatility die system used across components
 */

// Valid die sizes for volatility dice
export const VALID_DIE_SIZES = [4, 6, 8, 10, 12];

// Perk slot count per die size
export const PERK_SLOT_MAP = {
  4: 2,
  6: 4,
  8: 6,
  10: 8,
  12: 10
};

// Purchasable perks with their properties
export const PERKS = {
  'Refresh': {
    cost: 2,
    description: 'Remove 1 Stress from this Potential\'s track'
  },
  'Implode': {
    cost: 2,
    description: 'If your Volatility Die is not already a D4, roll one Die level below your current Die size and take the resulting value.'
  },
  'Cleave': {
    cost: 3,
    description: 'Roll 2 Volatility Dice instead, taking the result furthest from the middle. If they are equidistant, take the higher.'
  },
  'Drive': {
    cost: 3,
    description: 'Reroll the kept die and take the resulting value.'
  },
  'Burn': {
    cost: 5,
    description: 'Spend 1 Resistance for an automatic max Volatility value.'
  },
  'Fracture': {
    cost: 5,
    description: 'When activating this Perk while its slot is in the jinx threshold, its result is considered the lowest value on the Die. Otherwise, it is considered the highest value.'
  }
};

// Perk abbreviations for display
export const PERK_ABBREVIATIONS = {
  'Refresh': 'Ref',
  'Implode': 'Imp',
  'Cleave': 'Clv',
  'Drive': 'Drv',
  'Burn': 'Brn',
  'Fracture': 'Frc'
};

/**
 * Get the number of perk slots for a given die size
 * @param {number} dieSize - The die size (4, 6, 8, 10, or 12)
 * @returns {number} Number of perk slots
 */
export function getPerkSlotCount(dieSize) {
  return PERK_SLOT_MAP[dieSize] || 2;
}

/**
 * Get available slot numbers for a given die size (excluding min and max values)
 * @param {number} dieSize - The die size (4, 6, 8, 10, or 12)
 * @returns {Array<number>} Array of available slot numbers
 */
export function getAvailableSlots(dieSize) {
  const slots = [];
  for (let i = 2; i < dieSize; i++) {
    slots.push(i);
  }
  return slots;
}

/**
 * Abbreviate a perk name for display
 * @param {string} perkName - The full perk name
 * @returns {string} Abbreviated perk name
 */
export function abbreviatePerk(perkName) {
  return PERK_ABBREVIATIONS[perkName] || perkName.substring(0, 3);
}

/**
 * Validate a die size
 * @param {number} dieSize - The die size to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidDieSize(dieSize) {
  return VALID_DIE_SIZES.includes(dieSize);
}
