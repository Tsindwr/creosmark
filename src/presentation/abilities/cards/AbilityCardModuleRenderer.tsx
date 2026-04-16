import React, { useState } from "react";
import styles from "./AbilityCards.module.css";
import type { AbilityBuilderNode, AbilityCardState } from "../../../domain";
import {
    addDroppedModifierToModule,
    moveModuleOnFace,
    removeModuleFromFace,
    updateTextModuleValue,
} from "../../../domain";
import AbilityCardRulesModule from "./AbilityCardRulesModule";
import AbilityCardRailModule from "./AbilityCardRailModule";
import {
    hasCardModifierDragData,
    parseCardModifierDropPayload,
} from "./cardModifierDrop";

type Props = {
    nodes: AbilityBuilderNode[];
    cardState: AbilityCardState;
    faceId: string;
    previewMode: "edit" | "preview";
    onCardStateChange: (next: AbilityCardState) => void;
};

export default function AbilityCardModuleRenderer({
                                                      nodes,
                                                      cardState,
                                                      faceId,
                                                      previewMode,
                                                      onCardStateChange,
                                                  }: Props) {
    const face = cardState.faces.find((candidate) => candidate.id === faceId);
    if (!face) return null;

    const [dropGuide, setDropGuide] = useState<{
        moduleId: string;
        edge: "top" | "bottom";
        destinationLabel: string;
    } | null>(null);

    const resolveDropEdge = (event: React.DragEvent) => {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        return event.clientY < midpoint ? "top" : "bottom";
    };

    const updateDropGuide = (
        event: React.DragEvent,
        module: AbilityCardState["faces"][number]["modules"][number],
    ) => {
        if (!hasCardModifierDragData(event)) return;

        const edge = resolveDropEdge(event);
        const payload = parseCardModifierDropPayload(event);
        const destinationLabel =
            module.type === "rules_text"
                ? "Rules Text"
                : module.type === "icon_rail"
                    ? "Icon Rail"
                    : payload?.renderKind === "rail" || payload?.renderKind === "overlay"
                        ? "Nearest Icon Rail"
                        : payload
                            ? "Nearest Rules Text"
                            : "Nearest Compatible Section";

        if (
            dropGuide?.moduleId !== module.id ||
            dropGuide.edge !== edge ||
            dropGuide.destinationLabel !== destinationLabel
        ) {
            setDropGuide({
                moduleId: module.id,
                edge,
                destinationLabel,
            });
        }
    };

    const handleModuleDrop = (event: React.DragEvent, moduleId: string) => {
        event.preventDefault();
        event.stopPropagation();

        const payload = parseCardModifierDropPayload(event);
        if (!payload) return;

        onCardStateChange(
            addDroppedModifierToModule(
                cardState,
                faceId,
                moduleId,
                payload,
                resolveDropEdge(event),
            ),
        );
        setDropGuide(null);
    };

    return (
        <>
            {face.modules.map((module) => (
                <div
                    key={module.id}
                    className={`${styles.cardModule} ${
                        previewMode === "preview" ? styles.cardModulePreview : ""
                    } ${
                        dropGuide?.moduleId === module.id ? styles.cardModuleDropActive : ""
                    }`}
                    onDragEnterCapture={(event) => {
                        if (!hasCardModifierDragData(event)) return;
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                        updateDropGuide(event, module);
                    }}
                    onDragOverCapture={(event) => {
                        updateDropGuide(event, module);
                        if (hasCardModifierDragData(event)) {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = "move";
                        }
                    }}
                    onDragLeaveCapture={(event) => {
                        const target = event.currentTarget as HTMLElement;
                        const rect = target.getBoundingClientRect();
                        const inside =
                            event.clientX >= rect.left &&
                            event.clientX <= rect.right &&
                            event.clientY >= rect.top &&
                            event.clientY <= rect.bottom;

                        if (!inside && dropGuide?.moduleId === module.id) {
                            setDropGuide(null);
                        }
                    }}
                    onDropCapture={(event) => handleModuleDrop(event, module.id)}
                >
                    {dropGuide?.moduleId === module.id ? (
                        <>
                            <div
                                className={`${styles.cardModuleDropGuide} ${
                                dropGuide.edge === "top"
                                    ? styles.cardModuleDropGuideTop
                                    : styles.cardModuleDropGuideBottom
                            }`}
                            />
                            <div
                                className={`${styles.cardModuleDropHint} ${
                                    dropGuide.edge === "top"
                                        ? styles.cardModuleDropHintTop
                                        : styles.cardModuleDropHintBottom
                                }`}
                            >
                                {dropGuide.edge === "top" ? "Insert above" : "Insert below"} ·{" "}
                                {dropGuide.destinationLabel}
                            </div>
                        </>
                    ) : null}

                    {previewMode === "edit" ? (
                        <div className={styles.cardModuleToolbar}>
                            <span className={styles.cardModuleName}>{module.type}</span>
                            <div className={styles.cardModuleToolbarActions}>
                                <button
                                    type="button"
                                    className={styles.miniButton}
                                    onClick={() =>
                                        onCardStateChange(
                                            moveModuleOnFace(cardState, faceId, module.id, -1),
                                        )
                                    }
                                >
                                    ↑
                                </button>
                                <button
                                    type="button"
                                    className={styles.miniButton}
                                    onClick={() =>
                                        onCardStateChange(
                                            moveModuleOnFace(cardState, faceId, module.id, 1),
                                        )
                                    }
                                >
                                    ↓
                                </button>
                                <button
                                    type="button"
                                    className={styles.miniButton}
                                    onClick={() =>
                                        onCardStateChange(
                                            removeModuleFromFace(cardState, faceId, module.id),
                                        )
                                    }
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {module.type === "rules_text" ? (
                        <AbilityCardRulesModule
                            nodes={nodes}
                            cardState={cardState}
                            faceId={faceId}
                            module={module}
                            previewMode={previewMode}
                            onCardStateChange={onCardStateChange}
                        />
                    ) : null}

                    {module.type === "icon_rail" ? (
                        <AbilityCardRailModule
                            nodes={nodes}
                            cardState={cardState}
                            faceId={faceId}
                            module={module}
                            previewMode={previewMode}
                            onCardStateChange={onCardStateChange}
                        />
                    ) : null}

                    {module.type !== "rules_text" && module.type !== "icon_rail" ? (
                        previewMode === "edit" ? (
                            <textarea
                                className={styles.moduleTextInput}
                                value={module.text}
                                placeholder={module.type}
                                onChange={(event) =>
                                    onCardStateChange(
                                        updateTextModuleValue(
                                            cardState,
                                            faceId,
                                            module.id,
                                            event.target.value,
                                        ),
                                    )
                                }
                            />
                        ) : module.text ? (
                            <div className={styles.moduleTextPreview}>{module.text}</div>
                        ) : null
                    ) : null}
                </div>
            ))}
        </>
    );
}
