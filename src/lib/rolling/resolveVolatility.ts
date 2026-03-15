import type {
    VolatilityDieType,
    VolatilityDieState,
    VolatilityDieResult,
    VolatilityPoolState,
    VolatilityPoolResult,
    VolatilityPlan,
    PerkDefinition,
} from "./types.ts";
import type {RiskinessLevel, RollMode} from "../../types/sheet.ts";
import {applyRerollInstruction, resolvePerk} from "./applyPerks.ts";

const RISKINESS_MAP: Map<RiskinessLevel, number> = new Map<RiskinessLevel, number>([
    ["uncertain", 0 ],
    ["risky", -1],
    ["dire", -2],
    ["desperate", -3]
]);

const MODE_MAP: Map<RollMode, number> = new Map([
    ["normal", 0],
    ["advantage", 1],
    ["disadvantage", -1],
]);

function requireValue<T>(value: T | undefined, label: string): T {
    if (value === undefined) {
        throw new TypeError(label);
    }
    return value;
}

function validateVolatilityFace(face: number, dieType: VolatilityDieType) {
    if (!Number.isInteger(face) || face < 1 || face > dieType) {
        throw new RangeError(
            `Invalid volatility face '${face}'. Expected 1..${dieType}.`,
        );
    }
}

export function rollDV(dieType: VolatilityDieType) {
    return Math.floor(Math.random() * dieType + 1);
}

export function resolveVolatilityRoll(volatilityState: VolatilityDieState): VolatilityDieResult {
    const result = rollDV(volatilityState.max);

    const perk: PerkDefinition | undefined = volatilityState.perks[result];

    return {
        result,
        perk
    };
}

export function resolveVolatilityModifier(jinxThreshold: number, result: number) {
    return result > jinxThreshold ? 1 : -1;
}

export function calculateTotalVolatility(volatilityPoolState: VolatilityPoolState): number {
    // Base Riskiness
    let total = requireValue(
        RISKINESS_MAP.get(volatilityPoolState.riskinessLevel),
        `Unrecognized RiskinessLevel ${volatilityPoolState.riskinessLevel}`
    );
    // Domain
    if (volatilityPoolState.domain) {
        total += 1;
    }
    // Knacks
    total += volatilityPoolState.knacks;
    // Proficiency
    if (volatilityPoolState.proficient) {
        total += 1;
    }
    // Roll Mode
    let modeMod = requireValue(
        MODE_MAP.get(volatilityPoolState.rollMode),
        `Unrecognized RollMode ${volatilityPoolState.rollMode}`,
    );
    total += modeMod;

    if (volatilityPoolState.extraVolatility) {
        total += volatilityPoolState.extraVolatility;
    }

    return total;
}

export function getVolatilityPlan(
    volatilityPoolState: VolatilityPoolState,
): VolatilityPlan {
    const totalVolatility = calculateTotalVolatility(volatilityPoolState);

    if (totalVolatility < 0) {
        return {
            totalVolatility,
            diceCount: Math.abs(totalVolatility) + 1,
            keepLowest: true,
        };
    }

    return {
        totalVolatility,
        diceCount: totalVolatility,
        keepLowest: false,
    };
}

export function resolveVolatilityPoolFromFaces(
    volatilityPoolState: VolatilityPoolState,
    observedFaces: number[],
): VolatilityPoolResult {
    const plan = getVolatilityPlan(volatilityPoolState);

    if (observedFaces.length !== plan.diceCount) {
        throw new Error(
            `Observed volatility dice length (${observedFaces.length}) does not match expected diceCount (${plan.diceCount}).`,
        );
    }

    const dieResults = [...observedFaces]
    dieResults.forEach((face) => validateVolatilityFace(face, volatilityPoolState.dieType));

    if (dieResults.length === 0) {
        return {
            volatilityResults: [],
            result: 0,
            perk: undefined,
            successModifier: 0,
            explode: false,
            keepLowest: false,
            diceCount: 0,
            totalVolatility: plan.totalVolatility,
            notes: [],
        };
    }

    const sorted = [...dieResults].sort((a, b) => (plan.keepLowest ? a - b : b - a));
    let keptFace = sorted[0]!;
    const perk: PerkDefinition | undefined = volatilityPoolState.perks?.[keptFace];

    let perkResolution = resolvePerk(
        {
            dieType: volatilityPoolState.dieType,
            keptFace,
            jinxThreshold: volatilityPoolState.jinxThreshold,
            stress: volatilityPoolState.stress,
            resistances: volatilityPoolState.resistances,
            charged: volatilityPoolState.charged,
            potentialKey: volatilityPoolState.potentialKey,
        },
        perk,
    );

    if (perkResolution.reroll) {
        keptFace = applyRerollInstruction(
            volatilityPoolState.dieType,
            perkResolution.reroll,
        );

        perkResolution = {
            ...perkResolution,
            face: keptFace,
        };
    }

    if (typeof perkResolution.face === 'number') {
        keptFace = perkResolution.face;
    }

    const effectiveJinxThreshold =
        perkResolution.treatJinxThresholdAs ?? volatilityPoolState.jinxThreshold;

    const defaultModifier = keptFace > effectiveJinxThreshold ? 1 : -1;
    const successModifier =
        perkResolution.lockBaseOutcome
            ? 0
            : perkResolution.successModifier ?? defaultModifier;

    const explode =
        volatilityPoolState.charged &&
        volatilityPoolState.jinxThreshold === volatilityPoolState.dieType - 1 &&
        keptFace === volatilityPoolState.dieType;

    return {
        volatilityResults: dieResults,
        result: keptFace,
        perk,
        perkResolution,
        successModifier: explode ? 1 : successModifier,
        explode,
        keepLowest: plan.keepLowest,
        diceCount: plan.diceCount,
        totalVolatility: plan.totalVolatility,
        lockBaseOutcome: perkResolution.lockBaseOutcome,
        damageBonus: perkResolution.damageBonus,
        reduceStress: perkResolution.reduceStress,
        recoverResistance: perkResolution.recoverResistance,
        spendResistance: perkResolution.spendResistance,
        notes: perkResolution.notes ?? []
    };
}

export function resolveVolatilityPoolRoll(volatilityPoolState: VolatilityPoolState): VolatilityPoolResult {
    const plan = getVolatilityPlan(volatilityPoolState);

    const dieResults: number[] = [];
    for (let i = 0; i < plan.diceCount; i++) {
        dieResults.push(resolveVolatilityRoll({
            max: volatilityPoolState.dieType,
            stress: volatilityPoolState.jinxThreshold,
            perks: volatilityPoolState.perks,
            charged: volatilityPoolState.charged,
            potentialKey: volatilityPoolState.potentialKey
        } as VolatilityDieState).result);
    }
    if (dieResults.length === 0) {
        return {
            volatilityResults: [],
            result: 0,
            perk: undefined,
            successModifier: 0,
            explode: false,
            keepLowest: false,
            diceCount: 0,
            totalVolatility: plan.totalVolatility,
            notes: [],
        };
    }

    const sorted = [...dieResults].sort((a, b) => (plan.keepLowest ? a - b : b - a));
    let keptFace = sorted[0]!;
    const perk: PerkDefinition | undefined = volatilityPoolState.perks?.[keptFace];

    let perkResolution = resolvePerk(
        {
            dieType: volatilityPoolState.dieType,
            keptFace,
            jinxThreshold: volatilityPoolState.jinxThreshold,
            stress: volatilityPoolState.stress,
            resistances: volatilityPoolState.resistances,
            charged: volatilityPoolState.charged,
            potentialKey: volatilityPoolState.potentialKey,
        },
        perk,
    );

    if (perkResolution.reroll) {
        keptFace = applyRerollInstruction(
            volatilityPoolState.dieType,
            perkResolution.reroll,
        );

        perkResolution = {
            ...perkResolution,
            face: keptFace,
        };
    }

    if (typeof perkResolution.face === 'number') {
        keptFace = perkResolution.face;
    }

    const effectiveJinxThreshold =
        perkResolution.treatJinxThresholdAs ?? volatilityPoolState.jinxThreshold;

    const defaultModifier = keptFace > effectiveJinxThreshold ? 1 : -1;
    const successModifier =
        perkResolution.lockBaseOutcome
            ? 0
            : perkResolution.successModifier ?? defaultModifier;

    const explode =
        volatilityPoolState.charged &&
        volatilityPoolState.jinxThreshold === volatilityPoolState.dieType - 1 &&
        keptFace === volatilityPoolState.dieType;

    return {
        volatilityResults: dieResults,
        result: keptFace,
        perk,
        perkResolution,
        successModifier: explode ? 1 : successModifier,
        explode,
        keepLowest: plan.keepLowest,
        diceCount: plan.diceCount,
        totalVolatility: plan.totalVolatility,
        lockBaseOutcome: perkResolution.lockBaseOutcome,
        damageBonus: perkResolution.damageBonus,
        reduceStress: perkResolution.reduceStress,
        recoverResistance: perkResolution.recoverResistance,
        spendResistance: perkResolution.spendResistance,
        notes: perkResolution.notes ?? []
    };
}