import React from "react";
import styles from "./AbilityCards.module.css";
import type { AbilityBuilderNode, AbilityCardState } from "../../../domain";
import {
    addTextRunToRulesModule,
    updateTextRun,
    updateModifierRunDisplayMode,
    removeRunFromRulesModule,
    getCardModifierDisplay,
} from "../../../domain";
import AbilityCardInlineToken from "./AbilityCardInlineToken";

type Props = {
    nodes: AbilityBuilderNode[];
    cardState: AbilityCardState;
    faceId: string;
    module: Extract<
        AbilityCardState["faces"][number]["modules"][number],
        { type: "rules_text" }
    >;
    previewMode: "edit" | "preview";
    onCardStateChange: (next: AbilityCardState) => void;
};

export default function AbilityCardRulesModule({
                                                   nodes,
                                                   cardState,
                                                   faceId,
                                                   module,
                                                   previewMode,
                                                   onCardStateChange,
                                               }: Props) {
    return (
        <div className={styles.rulesTextModule}>
            {module.runs.map((run) => {
                if (run.kind === "text") {
                    return previewMode === "edit" ? (
                        <textarea
                            key={run.id}
                            className={styles.rulesTextInput}
                            value={run.text}
                            placeholder="Write card text here..."
                            onChange={(event) =>
                                onCardStateChange(
                                    updateTextRun(
                                        cardState,
                                        faceId,
                                        module.id,
                                        run.id,
                                        event.target.value,
                                    ),
                                )
                            }
                        />
                    ) : run.text ? (
                        <p key={run.id} className={styles.rulesPreviewText}>
                            {run.text}
                        </p>
                    ) : null;
                }

                const modifierNode = nodes.find(
                    (node) =>
                        node.type === "marketModifier" &&
                        node.id === run.modifierNodeId,
                );
                if (!modifierNode || modifierNode.type !== "marketModifier") {
                    return null;
                }

                const display = getCardModifierDisplay(
                    modifierNode,
                    cardState.modifierOverrides?.[modifierNode.id],
                );
                const isBlockDisplay = display.renderKind === "rail";

                return (
                    <div
                        key={run.id}
                        className={`${styles.inlineRunEditor} ${
                            isBlockDisplay ? styles.inlineRunEditorBlock : ""
                        }`}
                    >
                        <AbilityCardInlineToken
                            text={display.text}
                            symbolId={display.symbolId}
                            mode={run.displayMode}
                        />

                        {previewMode === "edit" ? (
                            <>
                                <select
                                    value={run.displayMode}
                                    onChange={(event) =>
                                        onCardStateChange(
                                            updateModifierRunDisplayMode(
                                                cardState,
                                                faceId,
                                                module.id,
                                                run.id,
                                                event.target.value as typeof run.displayMode,
                                            ),
                                        )
                                    }
                                >
                                    <option value="inline_chip">Chip</option>
                                    <option value="inline_keyword">Keyword</option>
                                    <option value="inline_symbol">Symbol</option>
                                </select>

                                <button
                                    type="button"
                                    className={styles.miniButton}
                                    onClick={() =>
                                        onCardStateChange(
                                            removeRunFromRulesModule(
                                                cardState,
                                                faceId,
                                                module.id,
                                                run.id,
                                            ),
                                        )
                                    }
                                >
                                    Remove
                                </button>
                            </>
                        ) : null}
                    </div>
                );
            })}

            {previewMode === "edit" ? (
                <button
                    type="button"
                    className={styles.miniButton}
                    onClick={() =>
                        onCardStateChange(
                            addTextRunToRulesModule(cardState, faceId, module.id),
                        )
                    }
                >
                    Add text run
                </button>
            ) : null}
        </div>
    );
}
