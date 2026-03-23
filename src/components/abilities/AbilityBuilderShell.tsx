import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    addEdge,
    Background,
    Controls,
    Handle,
    MiniMap,
    Position,
    ReactFlow,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow,
    type Connection,
    type Edge,
    type Node,
    type NodeProps,
} from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import styles from './AbilityBuilderShell.module.css';

type AbilityKind = 'action' | 'surge' | 'trait' | 'option';
type AbilityLane = 'body' | 'focus' | 'flipside' | 'option';
type ModifierFamily =
    | 'activation'
    | 'effect'
    | 'narrative'
    | 'caveat'
    | 'consequence'
    | 'special';

type CostState = {
    strings: number;
    beats: number;
    enhancements: number;
};

type AbilityRootData = {
    title: string;
    abilityKind: AbilityKind;
    summary: string;
};

type ModifierData = {
    label: string;
    family: ModifierFamily;
    lane: AbilityLane;
    description: string;
    cost: CostState;
};

type FreeformData = {
    title: string;
    lane: AbilityLane;
    text: string;
};

type AbilityRootNodeType = Node<AbilityRootData, 'abilityRoot'>;
type ModifierNodeType = Node<ModifierData, 'marketModifier'>;
type FreeformNodeType = Node<FreeformData, 'freeformText'>;

type AbilityBuilderNode =
    | AbilityRootNodeType
    | ModifierNodeType
    | FreeformNodeType;

type PaletteTemplate =
    | {
        kind: 'abilityRoot';
        label: string;
        data: AbilityRootData;
      }
    | {
        kind: 'marketModifier';
        label: string;
        data: ModifierData;
      }
    | {
        kind: 'freeformText';
        label: string;
        data: FreeformData;
      };

const PALETTE: Record<string, PaletteTemplate[]> = {
    "Ability Roots": [
        {
            kind: 'abilityRoot',
            label: 'Action Card',
            data: {
                title: 'New Action',
                abilityKind: 'action',
                summary: 'Focus + Flipside action card.',
            },
        },
        {
            kind: 'abilityRoot',
            label: 'Trait Card',
            data: {
                title: 'New Trait',
                abilityKind: 'trait',
                summary: 'Passive effect or reaction trigger.',
            },
        },
        {
            kind: 'abilityRoot',
            label: 'Option Card',
            data: {
                title: 'New Option',
                abilityKind: 'option',
                summary: 'Variant use of a parent ability',
            },
        },
    ],
    "Market Blocks": [
        {
            kind: 'marketModifier',
            label: 'Reset: General',
            data: {
                label: "Reset · General",
                family: 'activation',
                lane: 'body',
                description: 'Base reset condition.',
                cost: { strings: 4, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Reset: Spell',
            data: {
                label: 'Reset · Spell',
                family: 'activation',
                lane: 'body',
                description: 'Spell reset. Add a consequence block too.',
                cost: { strings: 3, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Reset: Short Rest',
            data: {
                label: 'Reset · Short Rest',
                family: 'activation',
                lane: 'body',
                description: 'Short Rest reset.',
                cost: { strings: 2, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Reset: Long Rest',
            data: {
                label: 'Reset · Long Rest',
                family: 'activation',
                lane: 'body',
                description: 'Long Rest reset.',
                cost: { strings: 1, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Trait Activation',
            data: {
                label: 'Activation · Trait',
                family: 'activation',
                lane: 'body',
                description: 'Turns the ability into a Trait.',
                cost: { strings: 1, beats: 0, enhancements: 1 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Surge Activation',
            data: {
                label: 'Activation · Surge',
                family: 'activation',
                lane: 'body',
                description: 'Turns the ability into a Surge.',
                cost: { strings: 0, beats: 0, enhancements: 1 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Action Activation',
            data: {
                label: 'Activation · Action',
                family: 'activation',
                lane: 'body',
                description: 'The default ability activation is an Action.',
                cost: { strings: 0, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: '2 Action Activation',
            data: {
                label: 'Activation · 2 Actions',
                family: 'activation',
                lane: 'body',
                description: 'Makes the ability require 2 Actions to activate.',
                cost: { strings: -1, beats: 0, enhancements: 0 },
            }
        },
        {
            kind: 'marketModifier',
            label: '1 Minute Activation',
            data: {
                label: 'Activation · 1 Minute',
                family: 'activation',
                lane: 'body',
                description: 'Makes the ability require 1 Minute to activate.',
                cost: { strings: -2, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Ritual Activation',
            data: {
                label: 'Activation · Ritual',
                family: 'activation',
                lane: 'body',
                description: 'Makes the ability require at least 10 Minutes to activate.',
                cost: { strings: -3, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Damage: Initial',
            data: {
                label: "Damage · Initial",
                family: "effect",
                lane: 'focus',
                description: 'Base initial damage die.',
                cost: { strings: 1, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Damage: Weapon',
            data: {
                label: 'Damage · Weapon',
                family: 'effect',
                lane: 'focus',
                description: "Use a weapon's damage die.",
                cost: { strings: 1, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Damage: Primed',
            data: {
                label: 'Damage · Primed',
                family: 'effect',
                lane: 'focus',
                description: 'Allows more damage dice to be added.',
                cost: { strings: 0, beats: 0, enhancements: 1 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Damage: Increase (Single Target)',
            data: {
                label: 'Damage · Increase',
                family: 'effect',
                lane: 'focus',
                description: 'Adds 1 more damage die to the total damage.',
                cost: { strings: 1, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Damage: Increase (AOE)',
            data: {
                label: 'Damage · Increase',
                family: 'effect',
                lane: 'focus',
                description: 'Adds 1 more damage die to the total damage.',
                cost: { strings: 2, beats: 0, enhancements: 0 },
            }
        },
        {
            kind: 'marketModifier',
            label: 'Range: Here',
            data: {
                label: 'Range · Here',
                family: 'effect',
                lane: 'focus',
                description: 'Affects a Here target or point.',
                cost: { strings: 0, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Range: Near',
            data: {
                label: 'Range · Near',
                family: 'effect',
                lane: 'focus',
                description: 'Affects a Near target or point.',
                cost: { strings: 0, beats: 5, enhancements: 0 },
            }
        },
        {
            kind: 'marketModifier',
            label: 'Range: Close',
            data: {
                label: 'Range · Close',
                family: 'effect',
                lane: 'focus',
                description: 'Affects a Close target or point.',
                cost: { strings: 1, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Range: There',
            data: {
                label: 'Range · There',
                family: 'effect',
                lane: 'focus',
                description: 'Affects a There target or point.',
                cost: { strings: 1, beats: 5, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Range: Far',
            data: {
                label: 'Range · Far',
                family: 'effect',
                lane: 'focus',
                description: 'Affects a Far target or point.',
                cost: { strings: 2, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Range: Yonder',
            data: {
                label: 'Range · Yonder',
                family: 'effect',
                lane: 'focus',
                description: 'Affects a Yonder target or point.',
                cost: { strings: 3, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Targeting: Near AOE',
            data: {
                label: 'Targeting · Near AOE',
                family: 'effect',
                lane: 'focus',
                description: 'Near area of effect.',
                cost: { strings: 2, beats: 0, enhancements: 1 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Targeting: Close AOE',
            data: {
                label: 'Targeting · Close AOE',
                family: 'effect',
                lane: 'focus',
                description: 'Close area of effect.',
                cost: { strings: 4, beats: 0, enhancements: 1 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Targeting: Far AOE',
            data: {
                label: 'Targeting · Far AOE',
                family: 'effect',
                lane: 'focus',
                description: 'Far area of effect.',
                cost: { strings: 6, beats: 0, enhancements: 1 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Targeting: +1 Target',
            data: {
                label: 'Targeting · +1 Target',
                family: 'effect',
                lane: 'focus',
                description: 'Add 1 Target to be effected.',
                cost: { strings: 1, beats: 0, enhancements: 1 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Condition: Major (Individual)',
            data: {
                label: 'Condition · Major',
                family: 'effect',
                lane: 'focus',
                description: 'Major condition on a single target.',
                cost: { strings: 3, beats: 0, enhancements: 1 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Condition: Major (AOE)',
            data: {
                label: 'Condition · Major',
                family: 'effect',
                lane: 'focus',
                description: 'Major condition on an AOE.',
                cost: { strings: 5, beats: 0, enhancements: 1 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Condition: Minor (Individual)',
            data: {
                label: 'Condition · Minor',
                family: 'effect',
                lane: 'focus',
                description: 'Minor condition on a single target.',
                cost: { strings: 1, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Condition: Minor (AOE)',
            data: {
                label: 'Condition · Minor',
                family: 'effect',
                lane: 'focus',
                description: 'Minor condition on an AOE.',
                cost: { strings: 3, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Duration: Scene',
            data: {
                label: 'Duration · Scene',
                family: 'effect',
                lane: 'focus',
                description: 'Lasts for 1 minute / scene.',
                cost: { strings: 2, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Duration: 1 Round',
            data: {
                label: 'Duration · Scene',
                family: 'effect',
                lane: 'focus',
                description: 'Lasts until the start of your next turn.',
                cost: { strings: 0, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Duration: 1 Hour',
            data: {
                label: 'Duration · Hour',
                family: 'effect',
                lane: 'focus',
                description: 'Lasts for an hour.',
                cost: { strings: 2, beats: 0, enhancements: 1 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Duration: Long Rest',
            data: {
                label: 'Duration · Long Rest',
                family: 'effect',
                lane: 'focus',
                description: 'Lasts until you begin a Long Rest.',
                cost: { strings: 4, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Duration: Until Dispelled',
            data: {
                label: 'Duration · Until Dispelled',
                family: 'effect',
                lane: 'focus',
                description: 'Lasts until successful action is take to end the effect.',
                cost: { strings: 0, beats: 0, enhancements: 2 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Duration: Sequence Die (Volatility)',
            data: {
                label: 'Duration · Sequence DV',
                family: 'effect',
                lane: 'focus',
                description: 'Lasts until all uses are expended.',
                cost: { strings: 2, beats: 0, enhancements: 1 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Duration: Sequence Die (D4)',
            data: {
                label: 'Duration · Sequence D4',
                family: 'effect',
                lane: 'focus',
                description: 'Lasts until all uses are expended.',
                cost: { strings: 2, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Duration: Sequence Experience',
            data: {
                label: 'Duration · Sequence Experience',
                family: 'effect',
                lane: 'focus',
                description: 'Adds one Experience Node to a Sequence Die.',
                cost: { strings: 1, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Duration: Concentration',
            data: {
                label: 'Duration · Concentration',
                family: 'effect',
                lane: 'focus',
                description: 'Lasts until Fallout and can be extended with Resistance.',
                cost: { strings: 0, beats: 0, enhancements: -1 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Narrative: Utility',
            data: {
                label: 'Narrative · Utility',
                family: 'narrative',
                lane: 'focus',
                description: 'Minor magical capability or utility effect.',
                cost: { strings: 1, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Narrative: Aesthetic',
            data: {
                label: 'Narrative · Aesthetic',
                family: 'narrative',
                lane: 'focus',
                description: 'Minute magical effect that is either sensory or narrative.',
                cost: { strings: 0, beats: 1, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Narrative: Interpretable',
            data: {
                label: 'Narrative · Interpretable',
                family: 'narrative',
                lane: 'focus',
                description: 'Open-ended affinity or attunement.',
                cost: { strings: 3, beats: 0, enhancements: 1 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Prerequisite',
            data: {
                label: 'Caveat · Prerequisite',
                family: 'caveat',
                lane: 'body',
                description: 'Ability, archetype, or origin prerequisite.',
                cost: { strings: -2, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Narrow Trigger',
            data: {
                label: 'Caveat · Narrow Trigger',
                family: 'caveat',
                lane: 'body',
                description: 'Requires a specific activation criteria or material component.',
                cost: { strings: -1, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Primarily Narrative',
            data: {
                label: 'Caveat · Primarily Narrative',
                family: 'caveat',
                lane: 'body',
                description: 'Limits this ability to only have a narrative effect.',
                cost: { strings: -1, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Spend Resistance',
            data: {
                label: 'Caveat · Spend Resistance',
                family: 'caveat',
                lane: 'body',
                description: 'Requires a Resistance point to be spent.',
                cost: { strings: -1, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Mechanical Consequence',
            data: {
                label: 'Caveat · Mechanical Consequence',
                family: 'caveat',
                lane: 'body',
                description: 'Requires a mechanical detriment or sacrifice.',
                cost: { strings: -1, beats: 0, enhancements: 0 },
            }
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Severe Narrative Consequence',
            data: {
                label: 'Caveat · Severe Narrative Consequence',
                family: 'caveat',
                lane: 'body',
                description: 'Causes a severe narrative consequence upon activating this ability.',
                cost: { strings: -2, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Test Required',
            data: {
                label: 'Caveat · Test Required',
                family: 'caveat',
                lane: 'body',
                description: 'Requires an additional successful Test roll to activate.',
                cost: { strings: 0, beats: -5, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Increase Riskiness',
            data: {
                label: 'Caveat · Increase Riskiness',
                family: 'caveat',
                lane: 'body',
                description: 'Increases the Riskiness level of a Test required by this ability.',
                cost: { strings: 0, beats: -5, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Per Scene',
            data: {
                label: 'Caveat · Per Scene',
                family: 'caveat',
                lane: 'body',
                description: 'Limited to one use per scene.',
                cost: { strings: 0, beats: -5, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Spend Stress',
            data: {
                label: 'Caveat · Spend Stress',
                family: 'caveat',
                lane: 'body',
                description: 'Requires a Stress accumulated to activate this ability.',
                cost: { strings: 0, beats: -5, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Caveat: Narrative Consequence',
            data: {
                label: 'Caveat · Narrative Consequence',
                family: 'caveat',
                lane: 'body',
                description: 'Causes a minor narrative consequence upon activation.',
                cost: { strings: 0, beats: -5, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Consequence: Minor Fallout',
            data: {
                label: 'Consequence · Minor Fallout',
                family: 'consequence',
                lane: 'body',
                description: 'Trigger Minor Fallout on a Spell Test failure.',
                cost: { strings: 0, beats: -5, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Consequence: Narrative Fallout',
            data: {
                label: 'Consequence · Narrative Fallout',
                family: 'consequence',
                lane: 'body',
                description: 'Trigger Narrative Fallout on a Spell Test failure.',
                cost: { strings: 0, beats: -1, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Consequence: Major Fallout',
            data: {
                label: 'Consequence · Major Fallout',
                family: 'consequence',
                lane: 'body',
                description: 'Trigger Major Fallout on a Spell Test failure.',
                cost: { strings: -2, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Consequence: Severe Fallout',
            data: {
                label: 'Consequence · Severe Fallout',
                family: 'consequence',
                lane: 'body',
                description: 'Trigger Severe Fallout on a Spell Test failure.',
                cost: { strings: -5, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Consequence: Test Required',
            data: {
                label: 'Consequence · Test Required',
                family: 'consequence',
                lane: 'body',
                description: 'Requires an unsuccessful Test from the target to activate.',
                cost: { strings: 0, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Amplified Mode',
            data: {
                label: 'Amplified Mode',
                family: 'special',
                lane: 'body',
                description: 'Optional expenditure of a Resistance to activate an advanced part of this ability.',
                cost: { strings: 0, beats: 0, enhancements: -1 },
            }
        },
        {
            kind: 'marketModifier',
            label: 'Generates Options',
            data: {
                label: 'Generates Options',
                family: 'special',
                lane: 'body',
                description: 'This Ability creates a format for Option Cards. Players may build Option Cards using this Ability as their Parent Ability.',
                cost: { strings: 0, beats: 0, enhancements: 1 },
            },
        },
    ],
    "Flipside (Movement)": [
        {
            kind: 'marketModifier',
            label: 'Movement: Step',
            data: {
                label: 'Movement · Step',
                family: 'effect',
                lane: 'flipside',
                description: 'Move a short distance (Here → Near) as part of this action.',
                cost: { strings: 0, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Movement: Dash',
            data: {
                label: 'Movement · Dash',
                family: 'effect',
                lane: 'flipside',
                description: 'Move up to Close range as part of this action.',
                cost: { strings: 1, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Movement: Sprint',
            data: {
                label: 'Movement · Sprint',
                family: 'effect',
                lane: 'flipside',
                description: 'Move up to Near range as part of this action.',
                cost: { strings: 1, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Movement: Reposition (Target)',
            data: {
                label: 'Movement · Reposition',
                family: 'effect',
                lane: 'flipside',
                description: 'Forcibly reposition a target within Close range.',
                cost: { strings: 1, beats: 0, enhancements: 1 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Movement: Disengage',
            data: {
                label: 'Movement · Disengage',
                family: 'effect',
                lane: 'flipside',
                description: 'Move without triggering opportunity-style reactions.',
                cost: { strings: 1, beats: 0, enhancements: 0 },
            },
        },
        {
            kind: 'marketModifier',
            label: 'Flipside: Self Buff',
            data: {
                label: 'Flipside · Self Buff',
                family: 'narrative',
                lane: 'flipside',
                description: 'Apply a minor beneficial effect to yourself as the indirect part of this action.',
                cost: { strings: 1, beats: 0, enhancements: 0 },
            },
        },
    ],
    Fallback: [
        {
            kind: 'freeformText',
            label: 'Description Block',
            data: {
                title: 'Narrative Description',
                lane: 'focus',
                text: 'Describe the effect in natural language when the mechanics need GM interpretation.',
            },
        },
    ],
};

function nextId() {
    return crypto.randomUUID();
}

function formatSignedNumber(value: number) {
    if (value === 0) return '0';
    return value > 0 ? `+${value}` : `${value}`;
}

function formatCost(cost: CostState) {
    const parts: string[] = [];
    if (cost.strings) parts.push(`${formatSignedNumber(cost.strings)} Strings`);
    if (cost.beats) parts.push(`${formatSignedNumber(cost.beats)} Beats`);
    if (cost.enhancements) parts.push(`${formatSignedNumber(cost.enhancements)} Enhancements`);
    return parts.length ? parts.join(" · ") : "No cost";
}

function sumCosts(items: CostState[]) {
    return items.reduce(
        (acc, item) => ({
            strings: acc.strings + item.strings,
            beats: acc.beats + item.beats,
            enhancements: acc.enhancements + item.enhancements,
        }),
        { strings: 0, beats: 0, enhancements: 0 },
    );
}

function toneForFamily(family: ModifierFamily) {
    switch (family) {
        case 'activation':
            return 'blue';
        case 'effect':
            return 'gold';
        case 'narrative':
            return 'violet';
        case 'caveat':
            return 'slate';
        case 'consequence':
            return 'rose';
        default:
            return 'green';
    }
}

function LaneBadge({ lane }: { lane: AbilityLane }) {
    return <span className={styles.laneBadge}>{lane}</span>;
}

function AbilityRootNode({ data, selected }: NodeProps<AbilityRootNodeType>) {
    return (
        <div className={`${styles.node} ${styles.rootNode} ${selected ? styles.nodeSelected : ""}`}>
            <Handle type={'target'} position={Position.Top} className={styles.handle} />
            <div className={styles.nodeHeader}>
                <span className={styles.nodeEyebrow}>{data.abilityKind}</span>
                <strong>{data.title}</strong>
            </div>
            <p className={styles.nodeCopy}>{data.summary || "Describe the card's job."}</p>
            <Handle type={'source'} position={Position.Bottom} className={styles.handle} />
        </div>
    );
}

function ModifierNode({ data, selected }: NodeProps<ModifierNodeType>) {
    return (
        <div
            className={`${styles.node} ${styles.modifierNode} ${styles[`tone${toneForFamily(data.family)}`]} ${
                selected ? styles.nodeSelected : ""
            }`}
            >
            <Handle type={'target'} position={Position.Top} className={styles.handle} />
            <div className={styles.nodeHeader}>
                <span className={styles.nodeEyebrow}>{data.family}</span>
                <strong>{data.label}</strong>
            </div>
            <LaneBadge lane={data.lane} />
            <p className={styles.nodeCopy}>{data.description}</p>
            <div className={styles.nodeCost}>{formatCost(data.cost)}</div>
            <Handle type={'source'} position={Position.Bottom} className={styles.handle} />
        </div>
    );
}

function FreeformNode({ data, selected }: NodeProps<FreeformNodeType>) {
    return (
        <div className={`${styles.node} ${styles.freeformNode} ${selected ? styles.nodeSelected : ""}`}>
            <Handle type={'target'} position={Position.Top} className={styles.handle} />
            <div className={styles.nodeHeader}>
                <span className={styles.nodeEyebrow}>fallback</span>
                <strong>{data.title}</strong>
            </div>
            <LaneBadge lane={data.lane} />
            <p className={styles.nodeCopy}>{data.text}</p>
            <Handle type={'source'} position={Position.Bottom} className={styles.handle} />
        </div>
    );
}

const nodeTypes = {
    abilityRoot: AbilityRootNode,
    marketModifier: ModifierNode,
    freeformText: FreeformNode,
};

type PaletteSection = {
    id: string;
    title: string;
    items: PaletteTemplate[];
};

function buildPaletteSections(): PaletteSection[] {
    const marketItems = PALETTE['Market Blocks'] ?? [];

    return [
        {
            id: "roots",
            title: 'Ability Roots',
            items: PALETTE['Ability Roots'] ?? [],
        },
        {
            id: 'activation',
            title: 'Activation',
            items: marketItems.filter(
                (item) => item.kind === 'marketModifier' && item.data.family === 'activation',
            ),
        },
        {
            id: 'effect',
            title: 'Effects',
            items: marketItems.filter(
                (item) => item.kind === 'marketModifier' && item.data.family === 'effect',
            ),
        },
        {
            id: 'narrative',
            title: 'Narrative',
            items: marketItems.filter(
                (item) => item.kind === 'marketModifier' && item.data.family === 'narrative',
            ),
        },
        {
            id: 'caveat',
            title: 'Caveats',
            items: marketItems.filter(
                (item) => item.kind === 'marketModifier' && item.data.family === 'caveat',
            ),
        },
        {
            id: 'consequence',
            title: "Consequences",
            items: marketItems.filter(
                (item) => item.kind === 'marketModifier' && item.data.family === 'consequence',
            ),
        },
        {
            id: 'special',
            title: 'Special',
            items: marketItems.filter(
                (item) => item.kind === 'marketModifier' && item.data.family === 'special',
            ),
        },
        {
            id: 'flipside',
            title: 'Flipside (Movement)',
            items: PALETTE['Flipside (Movement)'] ?? [],
        },
        {
            id: 'fallback',
            title: 'Fallback',
            items: PALETTE['Fallback'] ?? [],
        },
    ].filter((section) => section.items.length > 0);
}

function buildBlankActionPreset(): { nodes: AbilityBuilderNode[]; edges: Edge[] } {
    const rootId = nextId();
    const resetId = nextId();
    const prereqId = nextId();
    const focusTextId = nextId();
    const flipsideTextId = nextId();

    return {
        nodes: [
            {
                id: rootId,
                type: "abilityRoot",
                position: { x: 380, y: 40 },
                data: {
                    title: "New Action",
                    abilityKind: 'action',
                    summary: 'Build your Focus on the left, your Flipside on the right.',
                },
            },
            {
                id: resetId,
                type: "marketModifier",
                position: { x: 380, y: 220 },
                data: {
                    label: "Reset · General",
                    family: "activation",
                    lane: "body",
                    description: "Base reset condition.",
                    cost: { strings: 4, beats: 0, enhancements: 0 },
                },
            },
            {
                id: prereqId,
                type: "marketModifier",
                position: { x: 680, y: 220 },
                data: {
                    label: "Caveat · Prerequisite",
                    family: "caveat",
                    lane: "body",
                    description: "Attach an archetype, ability, or origin prerequisite.",
                    cost: { strings: -2, beats: 0, enhancements: 0 },
                },
            },
            {
                id: focusTextId,
                type: "freeformText",
                position: { x: 160, y: 420 },
                data: {
                    title: "Focus Description",
                    lane: "focus",
                    text: "Describe the direct half of the action here.",
                },
            },
            {
                id: flipsideTextId,
                type: "freeformText",
                position: { x: 600, y: 420 },
                data: {
                    title: "Flipside Description",
                    lane: "flipside",
                    text: "Describe the indirect half of the action here.",
                },
            },
        ],
        edges: [
            { id: nextId(), source: rootId, target: resetId },
            { id: nextId(), source: rootId, target: prereqId },
            { id: nextId(), source: resetId, target: focusTextId },
            { id: nextId(), source: resetId, target: flipsideTextId },
        ],
    };
}

function buildBlankSurgePreset(): { nodes: AbilityBuilderNode[]; edges: Edge[] } {
    const rootId = nextId();
    const resetId = nextId();
    const effectTextId = nextId();

    return {
        nodes: [
            {
                id: rootId,
                type: "abilityRoot",
                position: { x: 380, y: 40 },
                data: {
                    title: "New Surge",
                    abilityKind: 'surge',
                    summary: 'A minor effect activatable at any time, once per turn.',
                },
            },
            {
                id: resetId,
                type: "marketModifier",
                position: { x: 380, y: 220 },
                data: {
                    label: "Activation · Surge",
                    family: "activation",
                    lane: "body",
                    description: "Turns the ability into a Surge.",
                    cost: { strings: 0, beats: 0, enhancements: 1 },
                },
            },
            {
                id: effectTextId,
                type: "freeformText",
                position: { x: 380, y: 420 },
                data: {
                    title: "Surge Effect",
                    lane: "body",
                    text: "Describe the Surge effect here. Surges only affect the user.",
                },
            },
        ],
        edges: [
            { id: nextId(), source: rootId, target: resetId },
            { id: nextId(), source: resetId, target: effectTextId },
        ],
    };
}

function AbilityBuilderInner() {
    const initial = useMemo(() => buildBlankActionPreset(), []);
    const [nodes, setNodes, onNodesChange] = useNodesState<AbilityBuilderNode>(initial.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initial.nodes[0]?.id ?? null);
    const [sidebarMode, setSidebarMode] = useState<'palette' | 'inspector'>(
        initial.nodes[0] ? 'inspector' : 'palette',
    )
    const [openPaletteId, setOpenPaletteId] = useState<string>('roots');
    const paletteSections = useMemo(() => buildPaletteSections(), []);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const { screenToFlowPosition, fitView } = useReactFlow<AbilityBuilderNode, Edge>();

    useEffect(() => {
        const element = wrapperRef.current;
        if (!element) return;

        let frame = 0;

        const updateAvailableHeight = () => {
            cancelAnimationFrame(frame);

            frame = window.requestAnimationFrame(() => {
                const rect = element.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const bottomGap = 8;
                const available = Math.max(420, viewportHeight - rect.top - bottomGap);

                element.style.setProperty('--ability-builder-height', `${available}px`);
            });
        };

        updateAvailableHeight();

        const resizeObserver = new ResizeObserver(() => {
            updateAvailableHeight();
        });

        resizeObserver.observe(document.body);
        window.addEventListener('resize', updateAvailableHeight);

        return () => {
            cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateAvailableHeight);
        };
    }, []);

    const onConnect = useCallback(
        (connection: Connection) => {
            setEdges((current) => {
                return addEdge(
                    {
                        ...connection,
                        animated: false,
                        markerEnd: { type: 'arrowclosed' },
                    },
                    current,
                )
            });
        },
        [setEdges],
    );

    const onDragStart = useCallback((event: React.DragEvent, template: PaletteTemplate) => {
        event.dataTransfer.setData('application/sunder-ability-node', JSON.stringify(template));
        event.dataTransfer.effectAllowed = 'move';
    }, []);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const raw = event.dataTransfer.getData('application/sunder-ability-node');
            if (!raw) return;

            const template = JSON.parse(raw) as PaletteTemplate;
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: AbilityBuilderNode =
                template.kind === 'abilityRoot'
                    ? {
                        id: nextId(),
                        type: 'abilityRoot',
                        position,
                        data: { ...template.data },
                    }
                    : template.kind === 'marketModifier'
                        ? {
                            id: nextId(),
                            type: 'marketModifier',
                            position,
                            data: { ...template.data },
                        }
                        : {
                            id: nextId(),
                            type: 'freeformText',
                            position,
                            data: { ...template.data },
                        };

            setNodes((current) => [...current, newNode]);
            setSelectedNodeId(newNode.id);
            setSidebarMode('inspector');
        },
        [screenToFlowPosition, setNodes],
    );

    const selectedNode = useMemo(
        () => nodes.find((node) => node.id === selectedNodeId) ?? null,
        [nodes, selectedNodeId],
    );

    const modifierNodes = useMemo(
        () =>
            nodes.filter(
                (node): node is ModifierNodeType => node.type === 'marketModifier'
            ),
        [nodes],
    );

    const summary = useMemo(() => {
        const root = nodes.find(
            (node): node is AbilityRootNodeType => node.type === 'abilityRoot'
        );

        const focus = sumCosts(
            modifierNodes
                .filter((node) => node.data.lane === 'focus')
                .map((node) => node.data.cost),
        );

        const flipside = sumCosts(
            modifierNodes
                .filter((node) => node.data.lane === 'flipside')
                .map((node) => node.data.cost),
        );

        const body = sumCosts(
            modifierNodes
                .filter((node) => node.data.lane === 'body' || node.data.lane === 'option')
                .map((node) => node.data.cost),
        );

        const isAction = root?.data.abilityKind === 'action';

        // Flipside budget: floor(focus.strings / 2). Flipside is free within this budget.
        // Enhancement budget: Flipside may have at most the same number of Enhancements as Focus.
        const flipsideBudgetStrings = isAction ? Math.floor(focus.strings / 2) : 0;
        const flipsideBudgetEnhancements = isAction ? Math.max(0, focus.enhancements) : 0;

        // What the player actually pays: Focus + Body for Actions (Flipside is complimentary).
        // For non-Actions, all lanes contribute to the paid cost.
        const paid = isAction
            ? sumCosts([focus, body])
            : sumCosts([focus, body, flipside]);

        // Total raw cost across all modifier nodes (informational).
        const total = sumCosts(modifierNodes.map((node) => node.data.cost));

        const warnings: string[] = [];
        const notes: string[] = [];

        if (!root) warnings.push("Add an Ability Root node first.");

        if (isAction) {
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
        const hasTestRequired = modifierNodes.some(
            (node) => node.data.label === 'Caveat · Test Required',
        );
        const hasSpellReset = modifierNodes.some((node) =>
            node.data.label.includes('Reset · Spell'),
        );
        const hasDamage = modifierNodes.some((node) =>
            node.data.label.startsWith('Damage'),
        );
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
            const hasGenOpt = modifierNodes.some(
                (node) => node.data.label === 'Generates Options',
            );
            if (!hasGenOpt) {
                warnings.push(
                    'This Option Card has no associated "Generates Options" modifier on its graph. Add one if this card is self-referential, or confirm the Parent Ability has that modifier.',
                );
            }
        }

        // Concentration discount note.
        const hasConcentration = modifierNodes.some(
            (node) => node.data.label === 'Duration · Concentration',
        );
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

        return { root, total, focus, flipside, body, paid, flipsideBudgetStrings, flipsideBudgetEnhancements, isAction, isFlipsideOverBudget: isAction && focus.strings > 0 && flipside.strings > flipsideBudgetStrings, warnings, notes };
    }, [modifierNodes, nodes])

    function updateSelectedAbilityRoot(
        updater: (data: AbilityRootData) => AbilityRootData,
    ) {
        if (!selectedNodeId) return;

        setNodes((current) =>
            current.map((node): AbilityBuilderNode => {
                if (node.id !== selectedNodeId || node.type !== 'abilityRoot') return node;

                return {
                    ...node,
                    data: updater(node.data),
                };
            }),
        );
    }

    function updateSelectedModifier(
        updater: (data: ModifierData) => ModifierData,
    ) {
        if (!selectedNodeId) return;

        setNodes((current) =>
            current.map((node): AbilityBuilderNode => {
                if (node.id !== selectedNodeId || node.type !== 'marketModifier') return node;

                return {
                    ...node,
                    data: updater(node.data),
                };
            }),
        );
    }

    function updateSelectedFreeform(
        updater: (data: FreeformData) => FreeformData,
    ) {
        if (!selectedNodeId) return;
        setNodes((current) =>
            current.map((node): AbilityBuilderNode => {
                if (node.id !== selectedNodeId || node.type !== 'freeformText') return node;

                return {
                    ...node,
                    data: updater(node.data),
                };
            }),
        );
    }

    function loadPreset(kind: 'action' | 'surge') {
        const next = kind === 'surge' ? buildBlankSurgePreset() : buildBlankActionPreset();

        setNodes(next.nodes);
        setEdges(next.edges);
        setSelectedNodeId(next.nodes[0]?.id ?? null);
        setSidebarMode(next.nodes[0] ? 'inspector' : 'palette');

        requestAnimationFrame(() => {
            fitView({ padding: 0.2, duration: 300 });
        });
    }

    function exportJson() {
        const payload = {
            version: 1,
            nodes,
            edges,
            summary,
            exportedAt: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'sunder-ability-blueprint.json';
        link.click();

        URL.revokeObjectURL(url);
    }

    return (
        <div className={styles.shell} ref={wrapperRef}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarTabs}>
                    <button
                        type="button"
                        className={`${styles.sidebarTab} ${sidebarMode === 'palette' ? styles.sidebarTabActive : ''}`}
                        onClick={() => setSidebarMode('palette')}
                    >
                        Palette
                    </button>

                    <button
                        type="button"
                        className={`${styles.sidebarTab} ${sidebarMode === 'inspector' ? styles.sidebarTabActive : ''}`}
                        onClick={() => {
                            if (selectedNode) {
                                setSidebarMode('inspector');
                            }
                        }}
                        disabled={!selectedNode}
                    >
                        Inspector
                    </button>
                </div>

                <div className={styles.sidebarBody}>
                    {sidebarMode === 'palette' ? (
                        <>
                            <div className={styles.sidebarSection}>
                                <div className={styles.eyebrow}>Ability Builder</div>
                                <h2 className={styles.sidebarTitle}>Block workspace</h2>
                                <p className={styles.sidebarCopy}>
                                    Drag blocks into the graph.
                                </p>
                            </div>

                            <div className={styles.sidebarSection}>
                                <div className={styles.presetRow}>
                                    <button
                                        type="button"
                                        className={styles.smallButton}
                                        onClick={() => loadPreset('action')}
                                    >
                                        Blank Action
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.smallButton}
                                        onClick={() => loadPreset('surge')}
                                    >
                                        Blank Surge
                                    </button>
                                </div>
                            </div>

                            <div className={styles.paletteAccordion}>
                                {paletteSections.map((section) => {
                                    const open = openPaletteId === section.id;

                                    return (
                                        <section key={section.id} className={styles.accordionSection}>
                                            <button
                                                type="button"
                                                className={styles.accordionToggle}
                                                onClick={() => setOpenPaletteId(open ? "" : section.id)}
                                                aria-expanded={open}
                                            >
                                                <span>{section.title}</span>
                                                <span className={styles.accordionMeta}>
                                                {section.items.length}
                                                    <span className={styles.accordionChevron}>
                                                    {open ? "−" : "+"}
                                                </span>
                                            </span>
                                            </button>

                                            {open ? (
                                                <div className={styles.palettePanel}>
                                                    <div className={styles.paletteGrid}>
                                                        {section.items.map((item) => (
                                                            <button
                                                                key={`${section.id}-${item.label}`}
                                                                type="button"
                                                                draggable
                                                                className={styles.paletteItem}
                                                                onDragStart={(event) => onDragStart(event, item)}
                                                            >
                                                                {item.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </section>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.sidebarSection}>
                                <div className={styles.eyebrow}>Inspector</div>
                                <h2 className={styles.sidebarTitle}>
                                    {selectedNode ? 'Selected block' : 'No selection'}
                                </h2>
                            </div>

                            {selectedNode ? (
                                <>
                                    {selectedNode.type === 'abilityRoot' ? (
                                        <div className={styles.editorStack}>
                                            <label className={styles.field}>
                                                <span>Title</span>
                                                <input
                                                    value={selectedNode.data.title}
                                                    onChange={(event) =>
                                                        updateSelectedAbilityRoot((data) => ({
                                                            ...data,
                                                            title: event.target.value,
                                                        }))
                                                    }
                                                />
                                            </label>

                                            <label className={styles.field}>
                                                <span>Kind</span>
                                                <select
                                                    value={selectedNode.data.abilityKind}
                                                    onChange={(event) =>
                                                        updateSelectedAbilityRoot((data) => ({
                                                            ...data,
                                                            abilityKind: event.target.value as AbilityKind,
                                                        }))
                                                    }
                                                >
                                                    <option value="action">Action</option>
                                                    <option value="surge">Surge</option>
                                                    <option value="trait">Trait</option>
                                                    <option value="option">Option</option>
                                                </select>
                                            </label>

                                            <label className={styles.field}>
                                                <span>Summary</span>
                                                <textarea
                                                    value={selectedNode.data.summary}
                                                    onChange={(event) =>
                                                        updateSelectedAbilityRoot((data) => ({
                                                            ...data,
                                                            summary: event.target.value,
                                                        }))
                                                    }
                                                />
                                            </label>
                                        </div>
                                    ) : null}

                                    {selectedNode.type === 'marketModifier' ? (
                                        <div className={styles.editorStack}>
                                            <label className={styles.field}>
                                                <span>Label</span>
                                                <input
                                                    value={selectedNode.data.label}
                                                    onChange={(event) =>
                                                        updateSelectedModifier((data) => ({
                                                            ...data,
                                                            label: event.target.value,
                                                        }))
                                                    }
                                                />
                                            </label>

                                            <label className={styles.field}>
                                                <span>Lane</span>
                                                <select
                                                    value={selectedNode.data.lane}
                                                    onChange={(event) =>
                                                        updateSelectedModifier((data) => ({
                                                            ...data,
                                                            lane: event.target.value as AbilityLane,
                                                        }))
                                                    }
                                                >
                                                    <option value="body">Body</option>
                                                    <option value="focus">Focus</option>
                                                    <option value="flipside">Flipside</option>
                                                    <option value="option">Option</option>
                                                </select>
                                            </label>

                                            <label className={styles.field}>
                                                <span>Family</span>
                                                <select
                                                    value={selectedNode.data.family}
                                                    onChange={(event) =>
                                                        updateSelectedModifier((data) => ({
                                                            ...data,
                                                            family: event.target.value as ModifierFamily,
                                                        }))
                                                    }
                                                >
                                                    <option value="activation">Activation</option>
                                                    <option value="effect">Effect</option>
                                                    <option value="narrative">Narrative</option>
                                                    <option value="caveat">Caveat</option>
                                                    <option value="consequence">Consequence</option>
                                                    <option value="special">Special</option>
                                                </select>
                                            </label>

                                            <label className={styles.field}>
                                                <span>Description</span>
                                                <textarea
                                                    value={selectedNode.data.description}
                                                    onChange={(event) =>
                                                        updateSelectedModifier((data) => ({
                                                            ...data,
                                                            description: event.target.value,
                                                        }))
                                                    }
                                                />
                                            </label>

                                            <div className={styles.costGrid}>
                                                <label className={styles.field}>
                                                    <span>Strings</span>
                                                    <input
                                                        type="number"
                                                        step="1"
                                                        value={selectedNode.data.cost.strings}
                                                        onChange={(event) =>
                                                            updateSelectedModifier((data) => ({
                                                                ...data,
                                                                cost: {
                                                                    ...data.cost,
                                                                    strings: Number(event.target.value) || 0,
                                                                },
                                                            }))
                                                        }
                                                    />
                                                </label>

                                                <label className={styles.field}>
                                                    <span>Beats</span>
                                                    <input
                                                        type="number"
                                                        step="1"
                                                        value={selectedNode.data.cost.beats}
                                                        onChange={(event) =>
                                                            updateSelectedModifier((data) => ({
                                                                ...data,
                                                                cost: {
                                                                    ...data.cost,
                                                                    beats: Number(event.target.value) || 0,
                                                                },
                                                            }))
                                                        }
                                                    />
                                                </label>

                                                <label className={styles.field}>
                                                    <span>Enh.</span>
                                                    <input
                                                        type="number"
                                                        step="1"
                                                        value={selectedNode.data.cost.enhancements}
                                                        onChange={(event) =>
                                                            updateSelectedModifier((data) => ({
                                                                ...data,
                                                                cost: {
                                                                    ...data.cost,
                                                                    enhancements: Number(event.target.value) || 0,
                                                                },
                                                            }))
                                                        }
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    ) : null}

                                    {selectedNode.type === 'freeformText' ? (
                                        <div className={styles.editorStack}>
                                            <label className={styles.field}>
                                                <span>Title</span>
                                                <input
                                                    value={selectedNode.data.title}
                                                    onChange={(event) =>
                                                        updateSelectedFreeform((data) => ({
                                                            ...data,
                                                            title: event.target.value,
                                                        }))
                                                    }
                                                />
                                            </label>

                                            <label className={styles.field}>
                                                <span>Lane</span>
                                                <select
                                                    value={selectedNode.data.lane}
                                                    onChange={(event) =>
                                                        updateSelectedFreeform((data) => ({
                                                            ...data,
                                                            lane: event.target.value as AbilityLane,
                                                        }))
                                                    }
                                                >
                                                    <option value="body">Body</option>
                                                    <option value="focus">Focus</option>
                                                    <option value="flipside">Flipside</option>
                                                    <option value="option">Option</option>
                                                </select>
                                            </label>

                                            <label className={styles.field}>
                                                <span>Text</span>
                                                <textarea
                                                    value={selectedNode.data.text}
                                                    onChange={(event) =>
                                                        updateSelectedFreeform((data) => ({
                                                            ...data,
                                                            text: event.target.value,
                                                        }))
                                                    }
                                                />
                                            </label>
                                        </div>
                                    ) : null}

                                    <div className={styles.sidebarSection}>
                                        <div className={styles.eyebrow}>Rule Checks</div>
                                        <div className={styles.warningList}>
                                            {summary.warnings.length > 0 ? (
                                                summary.warnings.map((warning) => (
                                                    <div key={warning} className={styles.warning}>
                                                        {warning}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className={styles.okay}>
                                                    No obvious structural warnings yet.
                                                </div>
                                            )}
                                            {summary.notes.map((note) => (
                                                <div key={note} className={styles.note}>
                                                    {note}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className={styles.emptyInspector}>
                                    No node selected.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </aside>

            <section className={styles.workspace} onDragOver={onDragOver} onDrop={onDrop}>
                <div className={styles.toolbar}>
                    {summary.isAction ? (
                        <>
                            <div className={styles.summaryBlock}>
                                <span className={styles.toolbarLabel}>Paid (Focus + Body)</span>
                                <strong>{formatCost(summary.paid)}</strong>
                            </div>
                            <div className={styles.summaryBlock}>
                                <span className={styles.toolbarLabel}>Focus</span>
                                <strong>{formatCost(summary.focus)}</strong>
                            </div>
                            <div className={styles.summaryBlock}>
                                <span className={styles.toolbarLabel}>Body</span>
                                <strong>{formatCost(summary.body)}</strong>
                            </div>
                            <div className={`${styles.summaryBlock} ${summary.isFlipsideOverBudget ? styles.summaryBlockOver : ''}`}>
                                <span className={styles.toolbarLabel}>
                                    Flipside used / budget
                                </span>
                                <strong>
                                    {summary.flipside.strings} / {summary.flipsideBudgetStrings} Strings
                                    {summary.flipsideBudgetEnhancements > 0
                                        ? ` · ${summary.flipside.enhancements} / ${summary.flipsideBudgetEnhancements} Enh.`
                                        : ''}
                                </strong>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.summaryBlock}>
                                <span className={styles.toolbarLabel}>Total</span>
                                <strong>{formatCost(summary.total)}</strong>
                            </div>
                            <div className={styles.summaryBlock}>
                                <span className={styles.toolbarLabel}>Body</span>
                                <strong>{formatCost(summary.body)}</strong>
                            </div>
                        </>
                    )}

                    <button type={'button'} className={styles.exportButton} onClick={exportJson}>
                        Export JSON
                    </button>
                </div>

                <ReactFlow<AbilityBuilderNode, Edge>
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                    onPaneClick={() => setSelectedNodeId(null)}
                    fitView
                    className={styles.flow}
                    defaultEdgeOptions={{ markerEnd: { type: 'arrowclosed' } }}
                    >
                    <Background gap={24} size={1} />
                    <MiniMap pannable zoomable />
                    <Controls />
                </ReactFlow>
            </section>
        </div>
    );
}

export default function AbilityBuilderShell() {
    return (
        <ReactFlowProvider>
            <AbilityBuilderInner />
        </ReactFlowProvider>
    );
}