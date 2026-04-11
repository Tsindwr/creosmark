import type { Node } from "@xyflow/react";

// ── Ability taxonomy ──────────────────────────────────────────────────────────

export type AbilityKind = 'action' | 'surge' | 'trait' | 'option' | 'spell';

export type AbilityLane = 'body' | 'focus' | 'flipside' | 'option';

export type ModifierFamily =
    | 'activation'
    | 'effect'
    | 'narrative'
    | 'caveat'
    | 'consequence'
    | 'special';

// ── Node data shapes ──────────────────────────────────────────────────────────

export type CostState = {
    strings: number;
    beats: number;
    enhancements: number;
};

export type AbilityRootData = {
    title: string;
    abilityKind: AbilityKind;
    summary: string;
};

export type ModifierData = {
    label: string;
    family: ModifierFamily;
    lane: AbilityLane;
    description: string;
    cost: CostState;
};

export type FreeformData = {
    title: string;
    lane: AbilityLane;
    text: string;
};

// ── React Flow node wrappers ──────────────────────────────────────────────────

export type AbilityRootNodeType = Node<AbilityRootData, 'abilityRoot'>;
export type ModifierNodeType = Node<ModifierData, 'marketModifier'>;
export type FreeformNodeType = Node<FreeformData, 'freeformText'>;

export type AbilityBuilderNode =
    | AbilityRootNodeType
    | ModifierNodeType
    | FreeformNodeType;

// ── Palette ───────────────────────────────────────────────────────────────────

export type PaletteTemplate =
    | { kind: 'abilityRoot'; label: string; data: AbilityRootData }
    | { kind: 'marketModifier'; label: string; data: ModifierData }
    | { kind: 'freeformText'; label: string; data: FreeformData };

export type PaletteSection = {
    id: string;
    title: string;
    items: PaletteTemplate[];
};

// ── Utilities ─────────────────────────────────────────────────────────────────

export function nextId(): string {
    return crypto.randomUUID();
}
