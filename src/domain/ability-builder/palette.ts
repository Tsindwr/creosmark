import type {
    ModifierData,
    ModifierOptionPool,
    PaletteSection,
    PaletteTemplate,
} from "./types.ts";

// ── Block catalog ─────────────────────────────────────────────────────────────

export const MODIFIER_OPTION_POOLS: Record<string, ModifierOptionPool> = {
    rangeDistance: {
        id: "rangeDistance",
        title: "Range Distance",
        options: [
            { id: "here", label: "Here", description: "Affects a Here target or point.", cost: { strings: 0, beats: 0, enhancements: 0 } },
            { id: "near", label: "Near", description: "Affects a Near target or point.", cost: { strings: 0, beats: 5, enhancements: 0 } },
            { id: "close", label: "Close", description: "Affects a Close target or point.", cost: { strings: 1, beats: 0, enhancements: 0 } },
            { id: "there", label: "There", description: "Affects a There target or point.", cost: { strings: 1, beats: 5, enhancements: 0 } },
            { id: "far", label: "Far", description: "Affects a Far target or point.", cost: { strings: 2, beats: 0, enhancements: 0 } },
            { id: "yonder", label: "Yonder", description: "Affects a Yonder target or point.", cost: { strings: 3, beats: 0, enhancements: 0 } },
        ],
    },
    movementDistance: {
        id: "movementDistance",
        title: "Movement Distance",
        options: [
            { id: "here", label: "Here", description: "Move a short distance (5 ft) as part of this action.", cost: { strings: -1, beats: 0, enhancements: 0 } },
            { id: "near", label: "Near", description: "Move up to Near range (10 feet) as part of this action.", cost: { strings: 0, beats: 0, enhancements: 0 } },
            { id: "close", label: "Close", description: "Move up to Close range (30 feet) as part of this action.", cost: { strings: 1, beats: 0, enhancements: 0 } },
            { id: "there", label: "There", description: "Move up to There range (60 feet) as part of this action.", cost: { strings: 2, beats: 0, enhancements: 0 } },
            { id: "far", label: "Far", description: "Move up to Far range (120 feet) as part of this action.", cost: { strings: 3, beats: 0, enhancements: 0 } },
            { id: "yonder", label: "Yonder", description: "Move up to Yonder range (240 feet) or within Line of Sight as part of this action.", cost: { strings: 5, beats: 0, enhancements: 0 } },
        ],
    },
};

export const ABILITY_PALETTE: Record<string, PaletteTemplate[]> = {
    "Ability Roots": [
        {
            kind: 'abilityRoot',
            label: 'Action Card',
            data: { title: 'New Action', abilityKind: 'action', summary: 'Focus + Flipside action card.' },
        },
        {
            kind: 'abilityRoot',
            label: 'Surge Card',
            data: { title: 'New Surge', abilityKind: 'surge', summary: 'Activate anytime within a round, once per turn.' },
        },
        {
            kind: 'abilityRoot',
            label: 'Trait Card',
            data: { title: 'New Trait', abilityKind: 'trait', summary: 'Passive effect or reaction trigger.' },
        },
        {
            kind: 'abilityRoot',
            label: 'Option Card',
            data: { title: 'New Option', abilityKind: 'option', summary: 'Variant use of a parent ability' },
        },
    ],
    "Market Blocks": [
        {
            kind: 'marketModifier',
            label: 'Reset: General',
            data: { label: "Reset · General", family: 'activation', lane: 'body', description: 'Base reset condition.', cost: { strings: 4, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Reset: Spell',
            data: { label: 'Reset · Spell', family: 'activation', lane: 'body', description: 'Spell reset. Add a consequence block too.', cost: { strings: 3, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Reset: Short Rest',
            data: { label: 'Reset · Short Rest', family: 'activation', lane: 'body', description: 'Short Rest reset.', cost: { strings: 2, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Reset: Long Rest',
            data: { label: 'Reset · Long Rest', family: 'activation', lane: 'body', description: 'Long Rest reset.', cost: { strings: 1, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Trait Activation',
            data: { label: 'Activation · Trait', family: 'activation', lane: 'body', description: 'Turns the ability into a Trait.', cost: { strings: 1, beats: 0, enhancements: 1 } },
        },
        {
            kind: 'marketModifier',
            label: 'Surge Activation',
            data: { label: 'Activation · Surge', family: 'activation', lane: 'body', description: 'Turns the ability into a Surge.', cost: { strings: 0, beats: 0, enhancements: 1 } },
        },
        {
            kind: 'marketModifier',
            label: 'Action Activation',
            data: { label: 'Activation · Action', family: 'activation', lane: 'body', description: 'The default ability activation is an Action.', cost: { strings: 0, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: '2 Action Activation',
            data: { label: 'Activation · 2 Actions', family: 'activation', lane: 'body', description: 'Makes the ability require 2 Actions to activate.', cost: { strings: -1, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: '1 Minute Activation',
            data: { label: 'Activation · 1 Minute', family: 'activation', lane: 'body', description: 'Makes the ability require 1 Minute to activate.', cost: { strings: -2, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Ritual Activation',
            data: { label: 'Activation · Ritual', family: 'activation', lane: 'body', description: 'Makes the ability require at least 10 Minutes to activate.', cost: { strings: -3, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Damage: Initial',
            data: { label: "Damage · Initial", family: "effect", lane: 'focus', description: 'Base initial damage die.', cost: { strings: 1, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Damage: Weapon',
            data: { label: 'Damage · Weapon', family: 'effect', lane: 'focus', description: "Use a weapon's damage die.", cost: { strings: 1, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Damage: Primed',
            data: { label: 'Damage · Primed', family: 'effect', lane: 'focus', description: 'Allows more damage dice to be added.', cost: { strings: 0, beats: 0, enhancements: 1 } },
        },
        {
            kind: 'marketModifier',
            label: 'Damage: Increase (Single Target)',
            data: { label: 'Damage · Increase', family: 'effect', lane: 'focus', description: 'Adds 1 more damage die to the total damage.', cost: { strings: 1, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Damage: Increase (AOE)',
            data: { label: 'Damage · Increase', family: 'effect', lane: 'focus', description: 'Adds 1 more damage die to the total damage.', cost: { strings: 2, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Range',
            data: {
                label: 'Range',
                family: 'effect',
                lane: 'focus',
                description: 'Set the effect range distance.',
                cost: { strings: 0, beats: 0, enhancements: 0 },
                optionPoolId: 'rangeDistance',
                selectedOptionId: 'here',
            },
        },
        {
            kind: 'marketModifier',
            label: 'Targeting: Near AOE',
            data: { label: 'Targeting · Near AOE', family: 'effect', lane: 'focus', description: 'Near area of effect.', cost: { strings: 2, beats: 0, enhancements: 1 } },
        },
        {
            kind: 'marketModifier',
            label: 'Targeting: Close AOE',
            data: { label: 'Targeting · Close AOE', family: 'effect', lane: 'focus', description: 'Close area of effect.', cost: { strings: 4, beats: 0, enhancements: 1 } },
        },
        {
            kind: 'marketModifier',
            label: 'Targeting: Far AOE',
            data: { label: 'Targeting · Far AOE', family: 'effect', lane: 'focus', description: 'Far area of effect.', cost: { strings: 6, beats: 0, enhancements: 1 } },
        },
        {
            kind: 'marketModifier',
            label: 'Targeting: +1 Target',
            data: { label: 'Targeting · +1 Target', family: 'effect', lane: 'focus', description: 'Add 1 Target to be effected.', cost: { strings: 1, beats: 0, enhancements: 1 } },
        },
        {
            kind: 'marketModifier',
            label: 'Condition: Major (Individual)',
            data: { label: 'Condition · Major', family: 'effect', lane: 'focus', description: 'Major condition on a single target.', cost: { strings: 3, beats: 0, enhancements: 1 } },
        },
        {
            kind: 'marketModifier',
            label: 'Condition: Major (AOE)',
            data: { label: 'Condition · Major', family: 'effect', lane: 'focus', description: 'Major condition on an AOE.', cost: { strings: 5, beats: 0, enhancements: 1 } },
        },
        {
            kind: 'marketModifier',
            label: 'Condition: Minor (Individual)',
            data: { label: 'Condition · Minor', family: 'effect', lane: 'focus', description: 'Minor condition on a single target.', cost: { strings: 1, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Condition: Minor (AOE)',
            data: { label: 'Condition · Minor', family: 'effect', lane: 'focus', description: 'Minor condition on an AOE.', cost: { strings: 3, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Duration: Scene',
            data: { label: 'Duration · Scene', family: 'effect', lane: 'focus', description: 'Lasts for 1 minute / scene.', cost: { strings: 2, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Duration: 1 Round',
            data: { label: 'Duration · Scene', family: 'effect', lane: 'focus', description: 'Lasts until the start of your next turn.', cost: { strings: 0, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Duration: 1 Hour',
            data: { label: 'Duration · Hour', family: 'effect', lane: 'focus', description: 'Lasts for an hour.', cost: { strings: 2, beats: 0, enhancements: 1 } },
        },
        {
            kind: 'marketModifier',
            label: 'Duration: Long Rest',
            data: { label: 'Duration · Long Rest', family: 'effect', lane: 'focus', description: 'Lasts until you begin a Long Rest.', cost: { strings: 4, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Duration: Until Dispelled',
            data: { label: 'Duration · Until Dispelled', family: 'effect', lane: 'focus', description: 'Lasts until successful action is take to end the effect.', cost: { strings: 0, beats: 0, enhancements: 2 } },
        },
        {
            kind: 'marketModifier',
            label: 'Duration: Sequence Die (Volatility)',
            data: { label: 'Duration · Sequence DV', family: 'effect', lane: 'focus', description: 'Lasts until all uses are expended.', cost: { strings: 2, beats: 0, enhancements: 1 } },
        },
        {
            kind: 'marketModifier',
            label: 'Duration: Sequence Die (D4)',
            data: { label: 'Duration · Sequence D4', family: 'effect', lane: 'focus', description: 'Lasts until all uses are expended.', cost: { strings: 2, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Duration: Sequence Experience',
            data: { label: 'Duration · Sequence Experience', family: 'effect', lane: 'focus', description: 'Adds one Experience Node to a Sequence Die.', cost: { strings: 1, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Duration: Concentration',
            data: { label: 'Duration · Concentration', family: 'effect', lane: 'focus', description: 'Lasts until Fallout and can be extended with Resistance.', cost: { strings: 0, beats: 0, enhancements: -1 } },
        },
        {
            kind: 'marketModifier',
            label: 'Narrative: Utility',
            data: { label: 'Narrative · Utility', family: 'narrative', lane: 'focus', description: 'Minor magical capability or utility effect.', cost: { strings: 1, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Narrative: Aesthetic',
            data: { label: 'Narrative · Aesthetic', family: 'narrative', lane: 'focus', description: 'Minute magical effect that is either sensory or narrative.', cost: { strings: 0, beats: 1, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Narrative: Interpretable',
            data: { label: 'Narrative · Interpretable', family: 'narrative', lane: 'focus', description: 'Open-ended affinity or attunement.', cost: { strings: 3, beats: 0, enhancements: 1 } },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Prerequisite',
            data: { label: 'Caveat · Prerequisite', family: 'caveat', lane: 'body', description: 'Ability, archetype, or origin prerequisite.', cost: { strings: -2, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Narrow Trigger',
            data: { label: 'Caveat · Narrow Trigger', family: 'caveat', lane: 'body', description: 'Requires a specific activation criteria or material component.', cost: { strings: -1, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Primarily Narrative',
            data: { label: 'Caveat · Primarily Narrative', family: 'caveat', lane: 'body', description: 'Limits this ability to only have a narrative effect.', cost: { strings: -1, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Spend Resistance',
            data: { label: 'Caveat · Spend Resistance', family: 'caveat', lane: 'body', description: 'Requires a Resistance point to be spent.', cost: { strings: -1, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Mechanical Consequence',
            data: { label: 'Caveat · Mechanical Consequence', family: 'caveat', lane: 'body', description: 'Requires a mechanical detriment or sacrifice.', cost: { strings: -1, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Severe Narrative Consequence',
            data: { label: 'Caveat · Severe Narrative Consequence', family: 'caveat', lane: 'body', description: 'Causes a severe narrative consequence upon activating this ability.', cost: { strings: -2, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Test Required',
            data: { label: 'Caveat · Test Required', family: 'caveat', lane: 'body', description: 'Requires an additional successful Test roll to activate.', cost: { strings: 0, beats: -5, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Increase Riskiness',
            data: { label: 'Caveat · Increase Riskiness', family: 'caveat', lane: 'body', description: 'Increases the Riskiness level of a Test required by this ability.', cost: { strings: 0, beats: -5, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Per Scene',
            data: { label: 'Caveat · Per Scene', family: 'caveat', lane: 'body', description: 'Limited to one use per scene.', cost: { strings: 0, beats: -5, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Spend Stress',
            data: { label: 'Caveat · Spend Stress', family: 'caveat', lane: 'body', description: 'Requires a Stress accumulated to activate this ability.', cost: { strings: 0, beats: -5, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Narrative Consequence',
            data: { label: 'Caveat · Narrative Consequence', family: 'caveat', lane: 'body', description: 'Causes a minor narrative consequence upon activation.', cost: { strings: 0, beats: -5, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Consequence: Minor Fallout',
            data: { label: 'Consequence · Minor Fallout', family: 'consequence', lane: 'body', description: 'Trigger Minor Fallout on a Spell Test failure.', cost: { strings: 0, beats: -5, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Consequence: Narrative Fallout',
            data: { label: 'Consequence · Narrative Fallout', family: 'consequence', lane: 'body', description: 'Trigger Narrative Fallout on a Spell Test failure.', cost: { strings: 0, beats: -1, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Consequence: Major Fallout',
            data: { label: 'Consequence · Major Fallout', family: 'consequence', lane: 'body', description: 'Trigger Major Fallout on a Spell Test failure.', cost: { strings: -2, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Consequence: Severe Fallout',
            data: { label: 'Consequence · Severe Fallout', family: 'consequence', lane: 'body', description: 'Trigger Severe Fallout on a Spell Test failure.', cost: { strings: -5, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Consequence: Test Required',
            data: { label: 'Consequence · Test Required', family: 'consequence', lane: 'body', description: 'Requires an unsuccessful Test from the target to activate.', cost: { strings: 0, beats: 0, enhancements: 0 } },
        },
        {
            kind: 'marketModifier',
            label: 'Amplified Mode',
            data: { label: 'Amplified Mode', family: 'special', lane: 'body', description: 'Optional expenditure of a Resistance to activate an advanced part of this ability.', cost: { strings: 0, beats: 0, enhancements: -1 } },
        },
        {
            kind: 'marketModifier',
            label: 'Generates Options',
            data: { label: 'Generates Options', family: 'special', lane: 'body', description: 'This Ability creates a format for Option Cards. Players may build Option Cards using this Ability as their Parent Ability.', cost: { strings: 1, beats: 0, enhancements: 0 } },
        },
    ],
    "Movement": [
        {
            kind: 'marketModifier',
            label: 'Movement',
            data: {
                label: 'Movement',
                family: 'effect',
                lane: 'flipside',
                description: 'Set the movement distance.',
                cost: { strings: 0, beats: 0, enhancements: 0 },
                optionPoolId: 'movementDistance',
                selectedOptionId: 'near',
            },
        },
    ],
    "Fallback": [
        {
            kind: 'freeformText',
            label: 'Description Block',
            data: { title: 'Narrative Description', lane: 'focus', text: 'Describe the effect in natural language when the mechanics need GM interpretation.' },
        },
    ],
};

// ── Palette sections (ordered, filtered) ─────────────────────────────────────

export function buildPaletteSections(): PaletteSection[] {
    const marketItems = ABILITY_PALETTE['Market Blocks'] ?? [];

    return [
        { id: "roots", title: 'Ability Roots', items: ABILITY_PALETTE['Ability Roots'] ?? [] },
        { id: 'activation', title: 'Activation', items: marketItems.filter((item) => item.kind === 'marketModifier' && item.data.family === 'activation') },
        { id: 'effect', title: 'Effects', items: marketItems.filter((item) => item.kind === 'marketModifier' && item.data.family === 'effect') },
        { id: 'movement', title: 'Movement', items: ABILITY_PALETTE['Movement'] ?? [] },
        { id: 'narrative', title: 'Narrative', items: marketItems.filter((item) => item.kind === 'marketModifier' && item.data.family === 'narrative') },
        { id: 'caveat', title: 'Caveats', items: marketItems.filter((item) => item.kind === 'marketModifier' && item.data.family === 'caveat') },
        { id: 'consequence', title: "Consequences", items: marketItems.filter((item) => item.kind === 'marketModifier' && item.data.family === 'consequence') },
        { id: 'special', title: 'Special', items: marketItems.filter((item) => item.kind === 'marketModifier' && item.data.family === 'special') },
        { id: 'fallback', title: 'Fallback', items: ABILITY_PALETTE['Fallback'] ?? [] },
    ].filter((section) => section.items.length > 0);
}

export function getModifierOptionPool(poolId: string): ModifierOptionPool | undefined {
    return MODIFIER_OPTION_POOLS[poolId];
}

export function resolveModifierData(data: ModifierData): ModifierData {
    if (!data.optionPoolId) return data;

    const pool = getModifierOptionPool(data.optionPoolId);
    if (!pool || pool.options.length === 0) return data;

    const option =
        pool.options.find((candidate) => candidate.id === data.selectedOptionId) ??
        pool.options[0];
    if (!option) return data;

    return {
        ...data,
        selectedOptionId: option.id,
        label: `${data.label} · ${option.label}`,
        description: option.description,
        cost: option.cost,
    };
}
