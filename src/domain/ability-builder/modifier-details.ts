import type {ModifierData, ModifierOption} from "./types.ts";
import { getModifierOptionPool } from "./palette.ts";

export type ModifierDetailSchema = {
    id: string;
    label: string;
    optionPoolId: string;
    defaultOptionId?: string;
    otherOptions?: { id: string; label: string; description?: string }[];
};

function baseKey(data: ModifierData): string {
    return `${data.optionPoolId ?? ""}:${data.selectedOptionId ?? ""}`;
}

function getSelectionValue(
    data: ModifierData,
    schema: ModifierDetailSchema,
): string {
    const pool = getModifierOptionPool(schema.optionPoolId);
    return (
        data.selectionValues?.[schema.id] ??
            schema.defaultOptionId ??
            pool?.options[0]?.id ??
            ""
    );
}

const POOL_DETAIL_SCHEMAS: Record<string, ModifierDetailSchema[]> = {
    activationType: [
        {
            id: "focusSide",
            label: "Focus",
            optionPoolId: "cardSideRef",
            defaultOptionId: "direct",
        },
    ],
};

const BASE_DETAIL_SCHEMAS: Record<string, ModifierDetailSchema[]> = {
    // "activationType:action": [
    //     {
    //         id: "focusSide",
    //         label: "Focus",
    //         optionPoolId: "cardSideRef",
    //         defaultOptionId: "direct",
    //     },
    // ],

    "damageBase:initial": [
        {
            id: "damageDie",
            label: "Damage Die",
            optionPoolId: "volatilityDieRef",
            defaultOptionId: "might",
        },
        {
            id: "targetPotential",
            label: "Target Potential",
            optionPoolId: "potentialRef",
            defaultOptionId: "might",
        },
    ],

    // damage increase?

    "conditionMinor:individual": [
        {
            id: "minorConditionName",
            label: "Condition",
            optionPoolId: "minorConditionNameRef",
            defaultOptionId: "afraid",
        },
    ],

    "conditionMinor:aoe": [
        {
            id: "minorConditionName",
            label: "Condition",
            optionPoolId: "minorConditionNameRef",
            defaultOptionId: "afraid",
        },
    ],

    "conditionMajor:individual": [
        {
            id: "majorConditionName",
            label: "Condition",
            optionPoolId: "majorConditionNameRef",
            defaultOptionId: "blinded",
        },
    ],

    "conditionMajor:aoe": [
        {
            id: "majorConditionName",
            label: "Condition",
            optionPoolId: "majorConditionNameRef",
            defaultOptionId: "blinded",
        },
    ],

    "increase:potential": [
        {
            id: "increasedPotential",
            label: "Potential",
            optionPoolId: "potentialRef",
            defaultOptionId: "might",
        },
    ],

    "increase:proficiency": [
        {
            id: "increasedSkill",
            label: "Skill",
            optionPoolId: "skillRef",
            defaultOptionId: "force",
        },
    ],

    "increase:advantage": [
        {
            id: "advantageSkill",
            label: "Skill",
            optionPoolId: "skillRef",
            defaultOptionId: "force",
            otherOptions: [
                {
                    id: "other",
                    label: "Other",
                    description: "Describe the kind of Test that is granted Advantage.",
                }
            ],
        },
    ],

    "increase:domain": [
        {
            id: "increasedDomain",
            label: "Domain",
            optionPoolId: "domainRef",
            defaultOptionId: "spark",
        },
    ],

    "recover:stress": [
        {
            id: "recoveredStressPotential",
            label: "Potential",
            optionPoolId: "potentialRef",
            defaultOptionId: "might",
        },
    ],

    "recover:resistance": [
        {
            id: "recoveredResistancePotential",
            label: "Potential",
            optionPoolId: "potentialRef",
            defaultOptionId: "might",
        },
    ],

    "recover:minor-condition": [
        {
            id: "recoveredMinorConditionName",
            label: "Minor Condition",
            optionPoolId: "minorConditionNameRef",
            defaultOptionId: "afraid",
        },
    ],

    "recover:major-condition": [
        {
            id: "recoveredMajorConditionName",
            label: "Major Condition",
            optionPoolId: "majorConditionNameRef",
            defaultOptionId: "blinded",
        },
    ],

    // "recover:mark": [],

    "recover:stress-track": [
        {
            id: "clearedStressPotential",
            label: "Potential",
            optionPoolId: "potentialRef",
            defaultOptionId: "might",
        },
    ],

    "recover:resistance-track": [
        {
            id: "clearedResistancePotential",
            label: "Potential",
            optionPoolId: "potentialRef",
            defaultOptionId: "might",
        },
    ],

    "caveatType:spendStress": [
        {
            id: "spentStressPotential",
            label: "Potential",
            optionPoolId: "potentialRef",
            defaultOptionId: "might",
        },
    ],

    "caveatType:spendResistance": [
        {
            id: "spentResistancePotential",
            label: "Potential",
            optionPoolId: "potentialRef",
            defaultOptionId: "might",
        },
    ],
};

export function getModifierDetailSchemas(data: ModifierData): ModifierDetailSchema[] {
    const schemas = [
        ...(POOL_DETAIL_SCHEMAS[data.optionPoolId ?? ""] ?? []),
        ...(BASE_DETAIL_SCHEMAS[baseKey(data)] ?? [])
    ];

    const minorConditionName = data.selectionValues?.minorConditionName;
    if (minorConditionName === "empowered" || minorConditionName === "muddled"
        || minorConditionName === "vulnerable" || minorConditionName === "armored") {
        schemas.push({
            id: "minorConditionPotential",
            label: "Condition Potential",
            optionPoolId: "potentialRef",
            defaultOptionId: "might",
        });
    }

    const majorConditionName = data.selectionValues?.majorConditionName;
    if (majorConditionName === 'bleeding') {
        schemas.push({
            id: "bleedingPotential",
            label: "Bleeding Potential",
            optionPoolId: "potentialRef",
            defaultOptionId: "might",
        });
    }

    if (majorConditionName === 'retaliate') {
        schemas.push(
            {
                id: "retaliateFromPotential",
                label: "Retaliate From Potential",
                optionPoolId: "potentialRef",
                defaultOptionId: "might",
            },
            {
                id: "retaliateTargetPotential",
                label: "Retaliate Target Potential",
                optionPoolId: "potentialRef",
                defaultOptionId: "might",
            },
        );
    }

    return schemas;
}

export function formatModifierDetailSummary(data: ModifierData): string {
    const schemas = getModifierDetailSchemas(data);

    const parts = schemas
        .map((schema) => {
            const pool = getModifierOptionPool(schema.optionPoolId);
            if (!pool) return null;

            const selectedId = getSelectionValue(data, schema);
            const option = pool.options.find((candidate) => candidate.id === selectedId);
            if (!option) return null;

            return `${schema.label}: ${option.label}`;
        })
        .filter(Boolean) as string[];

    return parts.join(" · ");
}