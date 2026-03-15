import { convertSuccessLevelToNumber } from "./resolveSunderRoll.ts";
import type {SuccessLevelKey} from "./types.ts";

export function successLevelAppliesStress(successLevel: SuccessLevelKey) {
    return convertSuccessLevelToNumber(successLevel) === 4;
}

export function successLevelAppliesFallout(successLevel: SuccessLevelKey) {
    return convertSuccessLevelToNumber(successLevel) <= 3;
}

export function successLevelAppliesBeat(successLevel: SuccessLevelKey) {
    return convertSuccessLevelToNumber(successLevel) <= 3;
}