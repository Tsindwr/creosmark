import type { Edge } from "@xyflow/react";
import type { AbilityBuilderNode } from "./types.ts";
import { nextId } from "./types.ts";

export type AbilityPreset = {
    nodes: AbilityBuilderNode[];
    edges: Edge[];
};

// ── Blank Action preset ───────────────────────────────────────────────────────

export function buildBlankActionPreset(): AbilityPreset {
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

// ── Blank Surge preset ────────────────────────────────────────────────────────

export function buildBlankSurgePreset(): AbilityPreset {
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
