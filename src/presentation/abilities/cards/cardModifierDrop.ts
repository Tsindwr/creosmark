import type React from "react";
import type { CardModifierRenderKind } from "../../../domain";

export type CardModifierDropPayload = {
    modifierNodeId: string;
    renderKind?: CardModifierRenderKind;
};

export function hasCardModifierDragData(event: React.DragEvent): boolean {
    const types = event.dataTransfer?.types;
    if (!types) return false;

    const list = Array.from(types).map((type) => type.toLowerCase());
    return list.some(
        (type) =>
            type === "application/sunder-card-modifier" ||
            type === "text/plain" ||
            type.includes("sunder-card-modifier"),
    );
}

export function parseCardModifierDropPayload(
    event: React.DragEvent,
): CardModifierDropPayload | null {
    const raw =
        event.dataTransfer.getData("application/sunder-card-modifier") ||
        event.dataTransfer.getData("text/plain");

    if (!raw) return null;

    try {
        const payload = JSON.parse(raw) as
            | { modifierNodeId?: string; renderKind?: string }
            | string;

        if (typeof payload === "string") {
            const modifierNodeId = payload.trim();
            return modifierNodeId ? { modifierNodeId } : null;
        }

        if (!payload.modifierNodeId) return null;

        const renderKind =
            payload.renderKind === "inline" ||
            payload.renderKind === "rail" ||
            payload.renderKind === "overlay" ||
            payload.renderKind === "ignorable"
                ? payload.renderKind
                : undefined;

        return {
            modifierNodeId: payload.modifierNodeId,
            renderKind,
        };
    } catch {
        const modifierNodeId = raw.trim();
        return modifierNodeId ? { modifierNodeId } : null;
    }
}
