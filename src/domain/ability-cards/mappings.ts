import type {
    AbilityCardFaceKind,
    AbilityCardInlineDisplayMode,
    AbilityCardModifierOverride,
    AbilityCardRailDisplayMode,
} from "./types.ts";
import type {
    AbilityBuilderNode,
    ModifierNodeType,
} from "../ability-builder/types.ts";
import {
    deriveActivationProfile,
    isActivationProfileModifier,
} from "../ability-builder/activation-profile.ts";
import { resolveModifierData } from "../ability-builder/palette.ts";
import { formatModifierDetailSummary } from "../ability-builder/modifier-details.ts";

export type CardModifierRenderKind = 'inline' | 'rail' | 'overlay' | 'ignorable';

export type CardModifierDisplay = {
    text: string;
    symbolId: string;
    renderKind: CardModifierRenderKind;
    inlineMode: AbilityCardInlineDisplayMode;
    railMode: AbilityCardRailDisplayMode;
};

function applyModifierOverride(
    display: CardModifierDisplay,
    override?: AbilityCardModifierOverride,
): CardModifierDisplay {
    if (!override) return display;

    const nextText = override.text?.trim() ? override.text.trim() : display.text;
    const nextRenderKind =
        override.renderKind === "inline" || override.renderKind === "rail"
            ? override.renderKind
            : display.renderKind;

    return {
        ...display,
        text: nextText,
        renderKind: nextRenderKind,
    };
}

function isModifierNode(node: AbilityBuilderNode): node is ModifierNodeType {
    return node.type === "marketModifier";
}

export function getActionFocusFace(
    nodes: AbilityBuilderNode[],
): AbilityCardFaceKind {
    const profile = deriveActivationProfile(nodes);
    const focusSide = profile.focusSide;
    return focusSide === "indirect" ? "indirect" : "direct";
}

export function getDefaultFaceForModifier(
    nodes: AbilityBuilderNode[],
    node: ModifierNodeType,
): AbilityCardFaceKind {
    const profile = deriveActivationProfile(nodes);
    if (profile.isSplitActionCard) {
        const focusFace = getActionFocusFace(nodes);
        const indirectFace: AbilityCardFaceKind =
            focusFace === 'direct' ? 'indirect' : 'direct';

        if (node.data.lane === 'focus') return focusFace;
        if (node.data.lane === 'flipside') return indirectFace;
        return focusFace;
    }

    return 'single';
}

export function canIgnoreModifierInCard(node: ModifierNodeType): boolean {
    const resolved = resolveModifierData(node.data);

    return (
        resolved.label === "Narrative · Utility" ||
        resolved.label === "Narrative · Interpretable"
    );
}

export function getCardModifierDisplay(
    node: ModifierNodeType,
    override?: AbilityCardModifierOverride,
): CardModifierDisplay {
    const resolved = resolveModifierData(node.data);
    const details = formatModifierDetailSummary(node.data);
    const withDetails = (base: string) => (details ? `${base} (${details})` : base);

    if (resolved.label.startsWith("Damage · Initial")) {
        return applyModifierOverride({
            text: withDetails("Damage"),
            symbolId: "damage",
            renderKind: "inline",
            inlineMode: "inline_chip",
            railMode: "rail_icon",
        }, override);
    }

    if (resolved.label.startsWith("Damage · Increase")) {
        return applyModifierOverride({
            text: withDetails("Bonus Damage"),
            symbolId: "damage",
            renderKind: "inline",
            inlineMode: "inline_chip",
            railMode: "rail_icon",
        }, override);
    }

    if (resolved.label === 'Damage · Primed') {
        return applyModifierOverride({
            text: 'Primed',
            symbolId: 'primed',
            renderKind: 'overlay',
            inlineMode: 'inline_chip',
            railMode: 'rail_badge',
        }, override);
    }

    if (resolved.label.startsWith("Range")) {
        return applyModifierOverride({
            text: withDetails("Range"),
            symbolId: "range",
            renderKind: 'inline',
            inlineMode: 'inline_chip',
            railMode: 'rail_icon',
        }, override);
    }

    if (resolved.label.startsWith('Targeting ·')) {
        return applyModifierOverride({
            text: withDetails("Targeting"),
            symbolId: 'targeting',
            renderKind: 'inline',
            inlineMode: 'inline_chip',
            railMode: 'rail_icon',
        }, override);
    }

    if (resolved.label.startsWith('Condition · Minor')) {
        return applyModifierOverride({
            text: withDetails('Minor Condition'),
            symbolId: 'condition_minor',
            renderKind: 'inline',
            inlineMode: 'inline_chip',
            railMode: 'rail_icon',
        }, override);
    }

    if (resolved.label.startsWith('Condition · Major')) {
        return applyModifierOverride({
            text: withDetails('Major Condition'),
            symbolId: 'condition_major',
            renderKind: 'inline',
            inlineMode: 'inline_chip',
            railMode: 'rail_large_icon',
        }, override);
    }

    if (resolved.label.startsWith('Reset ·')) {
        return applyModifierOverride({
            text: resolved.label.replace("Reset · ", ""),
            symbolId: 'reset',
            renderKind: 'rail',
            inlineMode: 'inline_keyword',
            railMode: "rail_large_icon",
        }, override);
    }

    if (resolved.label.startsWith("Duration ·")) {
        return applyModifierOverride({
            text: resolved.label.replace("Duration · ", ""),
            symbolId: 'duration',
            renderKind: 'rail',
            inlineMode: 'inline_keyword',
            railMode: 'rail_large_icon',
        }, override);
    }

    if (resolved.label === "Amplified Mode") {
        return applyModifierOverride({
            text: 'Amplified',
            symbolId: 'amplified',
            renderKind: 'rail',
            inlineMode: 'inline_keyword',
            railMode: 'rail_badge',
        }, override);
    }

    if (resolved.label === "Narrative · Utility" || resolved.label === 'Narrative · Interpretable') {
        return applyModifierOverride({
            text: resolved.label.replace("Narrative · ", ""),
            symbolId: 'narrative',
            renderKind: 'ignorable',
            inlineMode: 'inline_keyword',
            railMode: 'rail_badge',
        }, override);
    }

    return applyModifierOverride({
        text: details ? `${resolved.label} (${details})` : resolved.label,
        symbolId: 'generic',
        renderKind: 'inline',
        inlineMode: 'inline_chip',
        railMode: "rail_icon",
    }, override);
}

export function getCardModifierInventory(
    nodes: AbilityBuilderNode[],
    modifierOverrides?: Record<string, AbilityCardModifierOverride>,
) {
    return nodes
        .filter(isModifierNode)
        .filter((node) => !isActivationProfileModifier(node))
        .map((node) => ({
            modifierNodeId: node.id,
            faceKind: getDefaultFaceForModifier(nodes, node),
            display: getCardModifierDisplay(node, modifierOverrides?.[node.id]),
            canIgnore: canIgnoreModifierInCard(node),
        }));
}
