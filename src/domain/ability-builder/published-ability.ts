import type { Edge } from "@xyflow/react";
import type { AbilityBuilderNode, AbilityKind, CostState } from "./types.ts";
import type { AbilitySummary } from "./pricing.ts";
import type { AbilityCardState } from "../ability-cards/types.ts";

export type PublishedAbilityEdge = {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
};

export type AbilityPublishDocument = {
    version: 2;
    title: string;
    abilityKind: AbilityKind | "unknown";
    activationProfile: {
        actionEconomyId: string;
        resetConditionId: string;
    };
    graph: {
        nodes: AbilityBuilderNode[];
        edges: PublishedAbilityEdge[];
    };
    card: AbilityCardState;
    computed: {
        total: CostState;
        paid: CostState;
        focus: CostState;
        flipside: CostState;
        body: CostState;
        isAction: boolean;
        flipsideBudgetStrings: number;
        flipsideBudgetEnhancements: number;
        warnings: string[];
        notes: string[];
    };
};

export function createAbilityPublishDocument(params: {
    nodes: AbilityBuilderNode[];
    edges: Edge[];
    summary: AbilitySummary;
    cardState: AbilityCardState;
}): AbilityPublishDocument {
    const { nodes, edges, summary, cardState } = params;

    return {
        version: 2,
        title: summary.root?.data.title?.trim() || "Untitled Ability",
        abilityKind: summary.root?.data.abilityKind ?? "unknown",
        activationProfile: {
            actionEconomyId: summary.actionEconomyId,
            resetConditionId: summary.resetConditionId,
        },
        graph: {
            nodes,
            edges: edges.map((edge) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                sourceHandle: edge.sourceHandle ?? null,
                targetHandle: edge.targetHandle ?? null,
            })),
        },
        card: cardState,
        computed: {
            total: summary.total,
            paid: summary.paid,
            focus: summary.focus,
            flipside: summary.flipside,
            body: summary.body,
            isAction: summary.isAction,
            flipsideBudgetStrings: summary.flipsideBudgetStrings,
            flipsideBudgetEnhancements: summary.flipsideBudgetEnhancements,
            warnings: [...summary.warnings],
            notes: [...summary.notes],
        },
    };
}
