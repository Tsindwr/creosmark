import type { Edge } from "@xyflow/react";
import type { XYPosition } from "@xyflow/react";
import type { AbilityBuilderNode, PaletteTemplate } from "../../domain/ability-builder/types.ts";
import type { AbilitySummary } from "../../domain/ability-builder/pricing.ts";
import { nextId } from "../../domain/ability-builder/types.ts";

// ── Node factory ──────────────────────────────────────────────────────────────

export function createNodeFromTemplate(
    template: PaletteTemplate,
    position: XYPosition,
): AbilityBuilderNode {
    if (template.kind === 'abilityRoot') {
        return {
            id: nextId(),
            type: 'abilityRoot',
            position,
            data: { ...template.data },
        };
    }
    if (template.kind === 'marketModifier') {
        return {
            id: nextId(),
            type: 'marketModifier',
            position,
            data: { ...template.data },
        };
    }
    // template.kind === 'freeformText'
    return {
        id: nextId(),
        type: 'freeformText',
        position,
        data: { ...template.data },
    };
}

// ── JSON export ───────────────────────────────────────────────────────────────

export function exportBlueprintJson(
    nodes: AbilityBuilderNode[],
    edges: Edge[],
    summary: AbilitySummary,
): void {
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
