/**
 * Perk System for Volatility Dice
 * 
 * Perks are special abilities that can be assigned to slots on a volatility die.
 * When a volatility die rolls a value matching a slot with a perk, that perk activates.
 */

/**
 * Base Perk class
 */
export class Perk {
  constructor(name, cost, description) {
    this.name = name;
    this.cost = cost; // Cost in Beats
    this.description = description;
  }

  /**
   * Activate the perk
   * @param {Object} context - Context for perk activation
   * @param {number} context.dieValue - The value rolled on the volatility die
   * @param {string} context.dieSize - The size of the die (d4, d6, d8, d10, d12)
   * @param {number} context.stress - Current stress level
   * @param {number} context.resistance - Current resistance level
   * @param {Object} context.potentialTrack - Reference to the potential track component
   * @returns {Object} Result of perk activation with modified values
   */
  activate(context) {
    throw new Error('Perk activate method must be implemented by subclass');
  }
}

/**
 * Refresh Perk - Remove 1 Stress from this Potential's track
 * Cost: 2 Beats
 */
export class RefreshPerk extends Perk {
  constructor() {
    super('Refresh', 2, 'Remove 1 Stress from this Potential\'s track');
  }

  activate(context) {
    const { potentialTrack } = context;
    let stressRemoved = false;
    
    if (potentialTrack && potentialTrack.stress > 0) {
      potentialTrack.removeStress();
      stressRemoved = true;
    }

    return {
      perkActivated: 'Refresh',
      stressRemoved,
      finalValue: context.dieValue,
      message: stressRemoved ? 'Removed 1 Stress!' : 'No Stress to remove'
    };
  }
}

/**
 * Implode Perk - Roll one die level below current die size and take the resulting value
 * Cost: 2 Beats
 */
export class ImplodePerk extends Perk {
  constructor() {
    super('Implode', 2, 'If your Volatility Die is not already a D4, roll one Die level below your current Die size and take the resulting value.');
  }

  activate(context) {
    const { dieSize } = context;
    
    // Die size progression: d4 -> d6 -> d8 -> d10 -> d12
    const dieSizes = ['d4', 'd6', 'd8', 'd10', 'd12'];
    const currentIndex = dieSizes.indexOf(dieSize);
    
    if (currentIndex <= 0) {
      // Already at d4, cannot implode further
      return {
        perkActivated: 'Implode',
        finalValue: context.dieValue,
        message: 'Already at minimum die size (d4)'
      };
    }

    const lowerDieSize = dieSizes[currentIndex - 1];
    const lowerDieMax = this._getDieMaxValue(lowerDieSize);
    const newValue = Math.floor(Math.random() * lowerDieMax) + 1;

    return {
      perkActivated: 'Implode',
      implodedFrom: dieSize,
      implodedTo: lowerDieSize,
      finalValue: newValue,
      message: `Imploded from ${dieSize} to ${lowerDieSize}, rolled ${newValue}`
    };
  }

  _getDieMaxValue(dieSize) {
    const maxValues = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12 };
    return maxValues[dieSize] || 6;
  }
}

/**
 * Cleave Perk - Roll 2 Volatility Dice instead, taking the result furthest from the middle
 * Cost: 3 Beats
 */
export class CleavePerk extends Perk {
  constructor() {
    super('Cleave', 3, 'Roll 2 Volatility Dice instead, taking the result furthest from the middle. If they are equidistant, take the higher.');
  }

  activate(context) {
    const { dieSize } = context;
    const dieMax = this._getDieMaxValue(dieSize);
    const middle = (dieMax + 1) / 2;

    const roll1 = Math.floor(Math.random() * dieMax) + 1;
    const roll2 = Math.floor(Math.random() * dieMax) + 1;

    const dist1 = Math.abs(roll1 - middle);
    const dist2 = Math.abs(roll2 - middle);

    let chosenValue;
    if (dist1 > dist2) {
      chosenValue = roll1;
    } else if (dist2 > dist1) {
      chosenValue = roll2;
    } else {
      // Equidistant - take the higher
      chosenValue = Math.max(roll1, roll2);
    }

    return {
      perkActivated: 'Cleave',
      rolls: [roll1, roll2],
      distances: [dist1, dist2],
      finalValue: chosenValue,
      message: `Cleaved: rolled ${roll1} and ${roll2}, chose ${chosenValue}`
    };
  }

  _getDieMaxValue(dieSize) {
    const maxValues = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12 };
    return maxValues[dieSize] || 6;
  }
}

/**
 * Drive Perk - Reroll the kept die and take the resulting value
 * Cost: 3 Beats
 */
export class DrivePerk extends Perk {
  constructor() {
    super('Drive', 3, 'Reroll the kept die and take the resulting value.');
  }

  activate(context) {
    const { dieSize, dieValue } = context;
    const dieMax = this._getDieMaxValue(dieSize);
    const newValue = Math.floor(Math.random() * dieMax) + 1;

    return {
      perkActivated: 'Drive',
      originalValue: dieValue,
      finalValue: newValue,
      message: `Drive: rerolled from ${dieValue} to ${newValue}`
    };
  }

  _getDieMaxValue(dieSize) {
    const maxValues = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12 };
    return maxValues[dieSize] || 6;
  }
}

/**
 * Burn Perk - Spend 1 Resistance for an automatic max Volatility value
 * Cost: 5 Beats
 */
export class BurnPerk extends Perk {
  constructor() {
    super('Burn', 5, 'Spend 1 Resistance for an automatic max Volatility value.');
  }

  activate(context) {
    const { dieSize, resistance, potentialTrack } = context;
    
    if (resistance <= 0 || !potentialTrack) {
      return {
        perkActivated: 'Burn',
        burned: false,
        finalValue: context.dieValue,
        message: 'Not enough Resistance to burn'
      };
    }

    const dieMax = this._getDieMaxValue(dieSize);
    potentialTrack.removeResistance();

    return {
      perkActivated: 'Burn',
      burned: true,
      resistanceSpent: true,
      finalValue: dieMax,
      message: `Burned 1 Resistance for maximum value: ${dieMax}`
    };
  }

  _getDieMaxValue(dieSize) {
    const maxValues = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12 };
    return maxValues[dieSize] || 6;
  }
}

/**
 * Fracture Perk - Dynamic result based on jinx threshold
 * When activating this Perk while its slot is in the jinx threshold,
 * its result is considered the lowest value on the Die.
 * Otherwise, it is considered the highest value.
 * Cost: 5 Beats
 */
export class FracturePerk extends Perk {
  constructor() {
    super('Fracture', 5, 'When activating this Perk while its slot is in the jinx threshold, its result is considered the lowest value on the Die. Otherwise, it is considered the highest value.');
  }

  activate(context) {
    const { dieValue, dieSize, stress } = context;
    const dieMax = this._getDieMaxValue(dieSize);
    const jinxThreshold = Math.min(stress, dieMax - 1);
    const isInJinxThreshold = dieValue <= jinxThreshold;

    const finalValue = isInJinxThreshold ? 1 : dieMax;

    return {
      perkActivated: 'Fracture',
      originalValue: dieValue,
      jinxThreshold,
      inJinxThreshold: isInJinxThreshold,
      finalValue,
      message: isInJinxThreshold 
        ? `Fractured to minimum (${finalValue}) - in jinx threshold`
        : `Fractured to maximum (${finalValue})`
    };
  }

  _getDieMaxValue(dieSize) {
    const maxValues = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12 };
    return maxValues[dieSize] || 6;
  }
}

/**
 * Perk Factory - Creates perk instances by name
 */
export class PerkFactory {
  static createPerk(perkName) {
    const perks = {
      'Refresh': RefreshPerk,
      'Implode': ImplodePerk,
      'Cleave': CleavePerk,
      'Drive': DrivePerk,
      'Burn': BurnPerk,
      'Fracture': FracturePerk
    };

    const PerkClass = perks[perkName];
    if (!PerkClass) {
      throw new Error(`Unknown perk: ${perkName}`);
    }

    return new PerkClass();
  }

  static getAllPerkNames() {
    return ['Refresh', 'Implode', 'Cleave', 'Drive', 'Burn', 'Fracture'];
  }

  static getPerkInfo(perkName) {
    const perk = this.createPerk(perkName);
    return {
      name: perk.name,
      cost: perk.cost,
      description: perk.description
    };
  }
}
