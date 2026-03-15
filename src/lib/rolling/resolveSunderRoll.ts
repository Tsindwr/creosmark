import type {
    TestState,
    TestResult,
    VolatilityPoolState,
    VolatilityPoolResult,
    BaseDieState,
    BaseRollResult,
    SuccessLevelKey, ObservedRoll
} from "./types.ts";
import {resolveBaseRollFromFace, resolveBaseRoll} from "./resolveBaseD20.ts";
import {resolveVolatilityPoolFromFaces, resolveVolatilityPoolRoll} from "./resolveVolatility.ts";
import {
    successLevelAppliesBeat,
    successLevelAppliesFallout,
    successLevelAppliesStress
} from "./applyStressAndFallout.ts";

export const SUCCESS_LEVEL_MAP: Map<SuccessLevelKey, number> = new Map<SuccessLevelKey, number>([
    ["miff", 1],
    ["failure", 2],
    ["mixed", 3],
    ["success", 4],
    ["crit", 5],
]);

export function convertSuccessLevelToNumber(successLevel: SuccessLevelKey): number {
    const num = SUCCESS_LEVEL_MAP.get(successLevel);
    if (!num) throw new TypeError("Unrecognized SuccessLevelKey " + successLevel);
    return num;
}

export function convertNumberToSuccessLevel(num: number): SuccessLevelKey {
    for (const [key, value] of SUCCESS_LEVEL_MAP.entries()) {
        if (value === num) {
            return key as SuccessLevelKey;
        }
    }
    if (num < 1) return "miff";
    if (num > 5) return "crit";
    throw new TypeError("Unrecognized success level number " + num);
}

export function buildVolatilityPoolState(state: TestState): VolatilityPoolState {
    return {
        domain: !!state.domain,
        proficient: state.skill.proficient ?? false,
        knacks: state.knacks.length,
        rollMode: state.rollMode,
        riskinessLevel: state.riskinessLevel,
        extraVolatility: state.extraVolatility,
        jinxThreshold: Math.min(state.stress, state.dV - 1),
        perks: state.perks,
        charged: state.charged,
        dieType: state.dV,
        potentialKey: state.potentialKey,
        stress: state.stress,
        resistances: state.resistances,
    };
}

export function resolveObservedSunderRoll(
    state: TestState,
    observed: ObservedRoll,
): TestResult {
    const baseDie: BaseDieState = {
        resistances: state.resistances,
        potentialKey: state.potentialKey,
        potentialValue: state.potentialValue,
    };

    const volatilityPool = buildVolatilityPoolState(state);

    const baseRollResult: BaseRollResult = resolveBaseRollFromFace(
        baseDie,
        observed.d20Face,
    );

    const volatilityPoolResult: VolatilityPoolResult =
        resolveVolatilityPoolFromFaces(volatilityPool, observed.volatilityFaces);

    const naturalCrit = baseRollResult.successLevel === "crit";
    const naturalMiff = baseRollResult.successLevel === "miff";
    const lockedBaseOutcome = naturalCrit || naturalMiff || Boolean(volatilityPoolResult.lockBaseOutcome);

    let finalSuccessLevel: SuccessLevelKey = baseRollResult.successLevel;
    let exploded = false;

    if (!lockedBaseOutcome) {
        if (volatilityPoolResult.explode) {
            finalSuccessLevel = "crit";
            exploded = true;
        } else {
            finalSuccessLevel = convertNumberToSuccessLevel(
                convertSuccessLevelToNumber(baseRollResult.successLevel) +
                volatilityPoolResult.successModifier,
            );
        }
    }

    const stressApplied = successLevelAppliesStress(finalSuccessLevel);
    const stressReduced = volatilityPoolResult.reduceStress ?? 0;

    let resistancesRecovered = 0;
    if (naturalCrit) resistancesRecovered += 1;
    if (Boolean(volatilityPoolResult.recoverResistance)) resistancesRecovered += 1;

    const resistanceSpent =
        naturalMiff || Boolean(volatilityPoolResult.spendResistance);

    return {
        d20Result: baseRollResult,
        volatilityResults: volatilityPoolResult.volatilityResults,
        keptVolatility: volatilityPoolResult.result,
        activatedPerk: volatilityPoolResult.perk,
        perkResolution: volatilityPoolResult.perkResolution,
        baseSuccessLevel: baseRollResult.successLevel,
        finalSuccessLevel,
        stressApplied,
        stressReduced,
        resistanceSpent,
        resistancesRecovered,
        falloutTriggered: successLevelAppliesFallout(finalSuccessLevel),
        exploded,
        beatsAwarded: successLevelAppliesBeat(finalSuccessLevel) ? 1 : 0, // TODO: robustness for beat Perks
        naturalCrit,
        naturalMiff,
        keepLowest: volatilityPoolResult.keepLowest,
        totalVolatility: volatilityPoolResult.totalVolatility,
        damageBonus: volatilityPoolResult.damageBonus,
        notes: volatilityPoolResult.notes ?? [],
    } as TestResult;
}

export function resolveSunderRoll(state: TestState): TestResult {
    const baseDie: BaseDieState = {
        resistances: state.resistances,
        potentialKey: state.potentialKey,
        potentialValue: state.potentialValue,
    };
    const volatilityPool: VolatilityPoolState = {
        domain: !!state.domain,
        proficient: state.skill.proficient ?? false,
        knacks: state.knacks.length,
        rollMode: state.rollMode,
        riskinessLevel: state.riskinessLevel,
        extraVolatility: state.extraVolatility,
        jinxThreshold: Math.min(state.stress, state.dV - 1),
        perks: state.perks,
        charged: state.charged,
        dieType: state.dV,
        potentialKey: state.potentialKey,
        stress: state.stress,
        resistances: state.resistances,
    };

    const baseRollResult: BaseRollResult = resolveBaseRoll(baseDie);
    const volatilityPoolResult: VolatilityPoolResult = resolveVolatilityPoolRoll(volatilityPool);

    const naturalCrit = baseRollResult.successLevel === "crit";
    const naturalMiff = baseRollResult.successLevel === "miff";
    const lockedBaseOutcome = naturalCrit || naturalMiff || Boolean(volatilityPoolResult.lockBaseOutcome);

    let finalSuccessLevel: SuccessLevelKey = baseRollResult.successLevel;
    let exploded = false;

    if (!lockedBaseOutcome) {
        if (volatilityPoolResult.explode) {
            finalSuccessLevel = "crit";
            exploded = true;
        } else {
            finalSuccessLevel = convertNumberToSuccessLevel(
                convertSuccessLevelToNumber(baseRollResult.successLevel) +
                    volatilityPoolResult.successModifier,
            );
        }
    }

    const stressApplied = successLevelAppliesStress(finalSuccessLevel);
    const stressReduced = volatilityPoolResult.reduceStress ?? 0;

    let resistancesRecovered = 0;
    if (naturalCrit) resistancesRecovered += 1;
    if (Boolean(volatilityPoolResult.recoverResistance)) resistancesRecovered += 1;

    const resistanceSpent =
        naturalMiff || Boolean(volatilityPoolResult.spendResistance);

    return {
        d20Result: baseRollResult,
        volatilityResults: volatilityPoolResult.volatilityResults,
        keptVolatility: volatilityPoolResult.result,
        activatedPerk: volatilityPoolResult.perk,
        perkResolution: volatilityPoolResult.perkResolution,
        baseSuccessLevel: baseRollResult.successLevel,
        finalSuccessLevel,
        stressApplied,
        stressReduced,
        resistanceSpent,
        resistancesRecovered,
        falloutTriggered: successLevelAppliesFallout(finalSuccessLevel),
        exploded,
        beatsAwarded: successLevelAppliesBeat(finalSuccessLevel) ? 1 : 0, // TODO: robustness for beat Perks
        naturalCrit,
        naturalMiff,
        keepLowest: volatilityPoolResult.keepLowest,
        totalVolatility: volatilityPoolResult.totalVolatility,
        damageBonus: volatilityPoolResult.damageBonus,
        notes: volatilityPoolResult.notes ?? [],
    } as TestResult;
}