import type {
    AbilityBuilderNode,
    AbilityRootNodeType,
    CostState,
    ModifierFamily,
    ModifierNodeType,
} from "./types.ts";

// ── Cost math ─────────────────────────────────────────────────────────────────

export const ZERO_COST: CostState = { strings: 0, beats: 0, enhancements: 0 };

export function sumCosts(items: CostState[]): CostState {
    return items.reduce(
        (acc, item) => ({
            strings: acc.strings + item.strings,
            beats: acc.beats + item.beats,
            enhancements: acc.enhancements + item.enhancements,
        }),
        { ...ZERO_COST },
    );
}

export function formatSignedNumber(value: number): string {
    if (value === 0) return '0';
    return value > 0 ? `+${value}` : `${value}`;
}

export function formatCost(cost: CostState): string {
    const parts: string[] = [];
    if (cost.strings) parts.push(`${formatSignedNumber(cost.strings)} Strings`);
    if (cost.beats) parts.push(`${formatSignedNumber(cost.beats)} Beats`);
    if (cost.enhancements) parts.push(`${formatSignedNumber(cost.enhancements)} Enhancements`);
    return parts.length ? parts.join(" · ") : "No cost";
}

export function toneForFamily(family: ModifierFamily): string {
    switch (family) {
        case 'activation': return 'blue';
        case 'effect': return 'gold';
        case 'narrative': return 'violet';
        case 'caveat': return 'slate';
        case 'consequence': return 'rose';
        default: return 'green';
    }
}

// ── Ability summary + rule-check ──────────────────────────────────────────────

export type AbilitySummary = {
    root: AbilityRootNodeType | undefined;
    total: CostState;
    focus: CostState;
    flipside: CostState;
    body: CostState;
    paid: CostState;
    flipsideBudgetStrings: number;
    flipsideBudgetEnhancements: number;
    isAction: boolean;
    isFlipsideOverBudget: boolean;
    warnings: string[];
    notes: string[];
};

export function computeAbilitySummary(nodes: AbilityBuilderNode[]): AbilitySummary {
    const root = nodes.find((node): node is AbilityRootNodeType => node.type === 'abilityRoot');

    const modifierNodes = nodes.filter(
        (node): node is ModifierNodeType => node.type === 'marketModifier',
    );

    const focus = sumCosts(modifierNodes.filter((node) => node.data.lane === 'focus').map((node) => node.data.cost));
    const flipside = sumCosts(modifierNodes.filter((node) => node.data.lane === 'flipside').map((node) => node.data.cost));
    const body = sumCosts(modifierNodes.filter((node) => node.data.lane === 'body' || node.data.lane === 'option').map((node) => node.data.cost));

    const isActionCard = root?.data.abilityKind === 'action' || root?.data.abilityKind === 'spell';

    // Flipside budget: floor(focus.strings / 2). Flipside is free within this budget.
    // Enhancement budget: Flipside may have at most the same number of Enhancements as Focus.
    const flipsideBudgetStrings = isActionCard ? Math.floor(focus.strings / 2) : 0;
    const flipsideBudgetEnhancements = isActionCard ? Math.max(0, focus.enhancements) : 0;

    // What the player actually pays: Focus + Body for Actions (Flipside is complimentary).
    // For non-Actions, all lanes contribute to the paid cost.
    const paid = isActionCard ? sumCosts([focus, body]) : sumCosts([focus, body, flipside]);

    const total = sumCosts(modifierNodes.map((node) => node.data.cost));

    const warnings: string[] = [];
    const notes: string[] = [];

    if (!root) warnings.push("Add an Ability Root node first.");

    if (isActionCard) {
        if (focus.strings <= 0) {
            warnings.push('Action cards need a real Focus before the Flipside budget means anything.');
        }
        if (focus.strings > 0 && flipside.strings > flipsideBudgetStrings) {
            warnings.push(
                `Flipside strings used (${flipside.strings}) exceed the budget (${flipsideBudgetStrings}). Budget = ⌊Focus Strings ÷ 2⌋.`,
            );
        }
        if (flipside.enhancements > flipsideBudgetEnhancements) {
            warnings.push(
                `Flipside enhancements (${flipside.enhancements}) exceed the Focus enhancements (${flipsideBudgetEnhancements}). The Flipside may use at most the same number of Enhancements as the Focus.`,
            );
        }
    }

    if (
        modifierNodes.some((node) => node.data.label.includes("Reset · Spell")) &&
        !modifierNodes.some((node) => node.data.family === 'consequence')
    ) {
        warnings.push('Spell reset is present without any consequence block.');
    }

    // Spells and attacks already require a Test — "Test Required" caveat gives no discount.
    const hasTestRequired = modifierNodes.some((node) => node.data.label === 'Caveat · Test Required');
    const hasSpellReset = modifierNodes.some((node) => node.data.label.includes('Reset · Spell'));
    const hasDamage = modifierNodes.some((node) => node.data.label.startsWith('Damage'));
    if (hasTestRequired && (hasSpellReset || hasDamage)) {
        warnings.push(
            'Spells and attacks already require a Test — the "Test Required" caveat cannot reduce their cost.',
        );
    }

    // Option Cards must have a Parent Ability that generates Options.
    if (root?.data.abilityKind === 'option') {
        notes.push(
            'Option Cards require a Parent Ability with a "Generates Options" modifier. Make sure that Ability is built first.',
        );
        const hasGenOpt = modifierNodes.some((node) => node.data.label === 'Generates Options');
        if (!hasGenOpt) {
            warnings.push(
                'This Option Card has no associated "Generates Options" modifier on its graph. Add one if this card is self-referential, or confirm the Parent Ability has that modifier.',
            );
        }
    }

    // Concentration discount note.
    const hasConcentration = modifierNodes.some((node) => node.data.label === 'Duration · Concentration');
    if (hasConcentration) {
        if (root?.data.abilityKind === 'trait') {
            notes.push(
                'Concentration on a Trait: Traits are already constant effects, so the –1 Enhancement discount may be reduced. Confirm the discount with your GM.',
            );
        } else {
            notes.push(
                'Concentration grants a –1 Enhancement discount. The exact discount may vary based on the Ability type — confirm with your GM.',
            );
        }
    }

    return {
        root,
        total,
        focus,
        flipside,
        body,
        paid,
        flipsideBudgetStrings,
        flipsideBudgetEnhancements,
        isAction: isActionCard,
        isFlipsideOverBudget: isActionCard && focus.strings > 0 && flipside.strings > flipsideBudgetStrings,
        warnings,
        notes,
    };
}
