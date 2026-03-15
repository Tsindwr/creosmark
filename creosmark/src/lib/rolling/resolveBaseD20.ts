import type {
    BaseDieState,
    BaseRollResult,
    SuccessLevelKey
} from "./types.ts";

export function resolveBaseRollFromFace(
    d20State: BaseDieState,
    face: number,
): BaseRollResult {
    if (!Number.isInteger(face) || face < 1 || face > 20) {
        throw new RangeError(`Invalid d20 face '${face}'. Expected 1..20.`);
    }

    let successLevel: SuccessLevelKey;

    if (face === d20State.potentialValue) {
        successLevel = 'crit';
    } else if (face === 20) {
        successLevel = 'miff';
    } else if (face <= d20State.resistances) {
        successLevel = 'mixed';
    } else if (face < d20State.potentialValue) {
        successLevel = 'success';
    } else {
        successLevel = 'failure';
    }

    return {
        result: face,
        successLevel,
    };
}

export function rollD20() {
    // number between 1..20
    return Math.floor(Math.random() * 20 + 1);
}

export function resolveBaseRoll(d20State: BaseDieState): BaseRollResult {
    const result: number = rollD20();

    let successLevel: SuccessLevelKey;
    if (result <= d20State.resistances) {
        successLevel = "mixed";
    } else if (result < d20State.potentialValue) {
        successLevel = "success";
    } else if (result === d20State.potentialValue) {
        successLevel = "crit";
    } else if (result === 20) {
        successLevel = "miff";
    } else {
        successLevel = "failure";
    }

    return {
        result,
        successLevel,
    };
}