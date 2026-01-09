/**
 * VolatilityRoller - Service for rolling volatility dice with perk activation
 * 
 * Handles:
 * - Rolling volatility dice
 * - Activating perks when rolled value matches a slot
 * - Managing volatility pools (multiple dice)
 * - Selecting the highest die from the pool
 * - Checking for explosions and jinx effects
 */

import { VolatilityDie } from './volatility-die.js';
import { PerkFactory } from './perk.js';

export class VolatilityRoller {
  /**
   * Roll a single volatility die with perk activation
   * @param {VolatilityDie} volatilityDie - The volatility die to roll
   * @param {Object} context - Rolling context
   * @param {number} context.stress - Current stress level
   * @param {number} context.resistance - Current resistance level
   * @param {Object} context.potentialTrack - Reference to potential track component
   * @returns {Object} Roll result with perk activation
   */
  static rollSingle(volatilityDie, context) {
    const initialRoll = volatilityDie.roll();
    let result = {
      initialRoll,
      dieSize: volatilityDie.dieSize,
      finalValue: initialRoll,
      perkActivated: null,
      perkResult: null
    };

    // Check if this roll should explode
    const shouldExplode = volatilityDie.shouldExplode(initialRoll, context.stress);
    if (shouldExplode) {
      const explosionResult = volatilityDie.explode();
      result.exploded = true;
      result.explosionResult = explosionResult;
      return result;
    }

    // Check if a perk is assigned to this slot
    const perkName = volatilityDie.getPerkInSlot(initialRoll);
    if (perkName) {
      try {
        const perk = PerkFactory.createPerk(perkName);
        const perkContext = {
          dieValue: initialRoll,
          dieSize: volatilityDie.dieSize,
          stress: context.stress,
          resistance: context.resistance,
          potentialTrack: context.potentialTrack
        };
        
        const perkResult = perk.activate(perkContext);
        result.perkActivated = perkName;
        result.perkResult = perkResult;
        result.finalValue = perkResult.finalValue;
      } catch (error) {
        console.error(`Error activating perk ${perkName}:`, error);
      }
    }

    return result;
  }

  /**
   * Roll a volatility pool (multiple dice) and select the highest
   * @param {Array<VolatilityDie>} volatilityDice - Array of volatility dice to roll
   * @param {Object} context - Rolling context
   * @returns {Object} Pool result with selected die
   */
  static rollPool(volatilityDice, context) {
    if (!volatilityDice || volatilityDice.length === 0) {
      return {
        poolRolls: [],
        selectedRoll: null,
        message: 'No volatility dice in pool'
      };
    }

    // Roll all dice in the pool
    const poolRolls = volatilityDice.map((die, index) => ({
      index,
      ...this.rollSingle(die, context)
    }));

    // Select the highest roll (by finalValue)
    let selectedRoll = poolRolls[0];
    for (const roll of poolRolls) {
      if (roll.finalValue > selectedRoll.finalValue) {
        selectedRoll = roll;
      }
    }

    return {
      poolRolls,
      selectedRoll,
      volatilityModifier: this._calculateModifier(selectedRoll.finalValue)
    };
  }

  /**
   * Calculate the volatility modifier for test resolution
   * @param {number} volatilityValue - The final volatility die value
   * @returns {number} The modifier to apply to test success level
   */
  static _calculateModifier(volatilityValue) {
    // Volatility modifies success level:
    // Lower values might decrease success, higher values might increase
    // This is a basic implementation - can be adjusted based on exact rules
    if (volatilityValue <= 2) {
      return -1; // Decrease success level
    } else if (volatilityValue >= 4) {
      return 1; // Increase success level
    }
    return 0; // No change
  }

  /**
   * Check for jinx effects after a test
   * @param {Object} rollResult - The volatility roll result
   * @param {Object} testResult - The D20 test result
   * @param {number} stress - Current stress level
   * @returns {Object} Jinx effects (stress gain, fallout trigger)
   */
  static checkJinxEffects(rollResult, testResult, stress) {
    const { selectedRoll } = rollResult;
    if (!selectedRoll) return { hasJinxEffect: false };

    const volatilityDie = new VolatilityDie(selectedRoll.dieSize);
    const isInJinx = volatilityDie.isInJinxThreshold(selectedRoll.finalValue, stress);

    if (!isInJinx) {
      return { hasJinxEffect: false };
    }

    const effects = {
      hasJinxEffect: true,
      inJinxThreshold: true,
      stressGain: 0,
      falloutTriggered: false
    };

    // Success level mapping:
    // 1 = Miff, 2 = Fail, 3 = Mixed, 4 = Success, 5 = Crit
    const successLevelMap = {
      'MIFF': 1,
      'FAIL': 2,
      'MIXED': 3,
      'SUCCESS': 4,
      'CRIT': 5
    };

    const successLevel = successLevelMap[testResult.level] || 0;

    // If test result is Mixed+ (3 or more), gain 1 Stress
    if (successLevel >= 3) {
      effects.stressGain = 1;
      effects.message = 'Jinx! Gained 1 Stress';
    }

    // If test result is success level 4 or less with cost (Success*-, Mixed*-, Fail*, Miff),
    // trigger Fallout
    if (successLevel <= 4 && testResult.hasCost) {
      effects.falloutTriggered = true;
      effects.message = 'Jinx! Fallout triggered - Stress track reset to 0';
    }

    return effects;
  }

  /**
   * Helper to create a default volatility die for testing
   */
  static createDefaultDie() {
    return new VolatilityDie('d4');
  }
}
