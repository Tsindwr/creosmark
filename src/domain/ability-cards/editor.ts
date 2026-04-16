import type {
    AbilityCardFaceState,
    AbilityCardFaceKind,
    AbilityCardModifierOverride,
    AbilityCardModule,
    AbilityCardModuleType,
    AbilityCardRailDisplayMode,
    AbilityCardState,
    AbilityCardTextRun,
} from "./types";
import type { CardModifierRenderKind } from "./mappings.ts";

function newId() {
    return crypto.randomUUID();
}

function createModule(type: AbilityCardModuleType): AbilityCardModule {
    switch (type) {
        case 'rules_text':
            return {
                id: newId(),
                type: 'rules_text',
                runs: [{ id: newId(), kind: 'text', text: '' }],
            };

        case 'icon_rail':
            return {
                id: newId(),
                type: 'icon_rail',
                items: [],
            };

        case 'attack_notation':
        case 'header_meta':
        case 'keyword_line':
        case 'footer_note':
            return {
                id: newId(),
                type,
                text: "",
            };

        default:
            return {
                id: newId(),
                type: 'footer_note',
                text: '',
            };
    }
}

function ensureFaceModule(
    face: AbilityCardFaceState,
    moduleType: "rules_text" | "icon_rail",
): { face: AbilityCardFaceState; moduleId: string } {
    const existing = face.modules.find((module) => module.type === moduleType);
    if (existing) {
        return { face, moduleId: existing.id };
    }

    const created = createModule(moduleType);
    return {
        face: {
            ...face,
            modules: [...face.modules, created],
        },
        moduleId: created.id,
    };
}

function ensureModuleOnFace(
    state: AbilityCardState,
    faceId: string,
    moduleType: "rules_text" | "icon_rail",
): { state: AbilityCardState; moduleId: string | null } {
    const face = state.faces.find((candidate) => candidate.id === faceId);
    if (!face) {
        return { state, moduleId: null };
    }

    const ensured = ensureFaceModule(face, moduleType);
    if (ensured.face === face) {
        return { state, moduleId: ensured.moduleId };
    }

    return {
        state: {
            ...state,
            faces: state.faces.map((candidate) =>
                candidate.id === face.id ? ensured.face : candidate,
            ),
        },
        moduleId: ensured.moduleId,
    };
}

function findNearestModuleIdByType(
    face: AbilityCardFaceState,
    fromModuleId: string,
    moduleType: "rules_text" | "icon_rail",
    edge: "top" | "bottom",
): string | null {
    const fromIndex = face.modules.findIndex((module) => module.id === fromModuleId);
    if (fromIndex < 0) return null;

    const searchForward = () => {
        for (let index = fromIndex; index < face.modules.length; index += 1) {
            const module = face.modules[index];
            if (module.type === moduleType) return module.id;
        }
        return null;
    };

    const searchBackward = () => {
        for (let index = fromIndex; index >= 0; index -= 1) {
            const module = face.modules[index];
            if (module.type === moduleType) return module.id;
        }
        return null;
    };

    if (edge === "top") {
        return searchBackward() ?? searchForward();
    }

    return searchForward() ?? searchBackward();
}

function updateFaceModules(
    state: AbilityCardState,
    faceId: string,
    updater: (modules: AbilityCardModule[]) => AbilityCardModule[],
): AbilityCardState {
    return {
        ...state,
        faces: state.faces.map((face) =>
            face.id === faceId
                ? { ...face, modules: updater(face.modules) }
                : face,
        ),
    };
}

export function addModuleToFace(
    state: AbilityCardState,
    faceId: string,
    moduleType: AbilityCardModuleType,
): AbilityCardState {
    return updateFaceModules(state, faceId, (modules) => [
        ...modules,
        createModule(moduleType),
    ]);
}

export function addTextRunToRulesModule(
    state: AbilityCardState,
    faceId: string,
    moduleId: string,
): AbilityCardState {
    return updateFaceModules(state, faceId, (modules) =>
        modules.map((module) => {
            if (module.id !== moduleId || module.type !== "rules_text") return module;
            return {
                ...module,
                runs: [...module.runs, { id: newId(), kind: "text", text: "" }],
            };
        }),
    );
}

export function addModifierRunToRulesModule(
    state: AbilityCardState,
    faceId: string,
    moduleId: string,
    modifierNodeId: string,
): AbilityCardState {
    return updateFaceModules(state, faceId, (modules) =>
        modules.map((module) => {
            if (module.id !== moduleId || module.type !== "rules_text") return module;
            return {
                ...module,
                runs: [
                    ...module.runs,
                    {
                        id: newId(),
                        kind: "modifier",
                        modifierNodeId,
                        displayMode: "inline_chip",
                    } satisfies AbilityCardTextRun,
                ],
            };
        }),
    );
}

export function addModifierToRailModule(
    state: AbilityCardState,
    faceId: string,
    moduleId: string,
    modifierNodeId: string,
    displayMode: AbilityCardRailDisplayMode = 'rail_icon',
): AbilityCardState {
    return updateFaceModules(state, faceId, (modules) =>
        modules.map((module) => {
            if (module.id !== moduleId || module.type !== "icon_rail") return module;

            return {
                ...module,
                items: [
                    ...module.items,
                    {
                        id: crypto.randomUUID(),
                        modifierNodeId,
                        displayMode,
                        hostModifierNodeId: null,
                    },
                ],
            };
        }),
    );
}

export function addDroppedModifierToFace(
    state: AbilityCardState,
    faceId: string,
    payload: {
        modifierNodeId: string;
        renderKind?: CardModifierRenderKind;
    },
): AbilityCardState {
    const face = state.faces.find((candidate) => candidate.id === faceId);
    if (!face) return state;

    const preferredModuleType =
        payload.renderKind === "rail" || payload.renderKind === "overlay"
            ? "icon_rail"
            : "rules_text";

    const ensured = ensureFaceModule(face, preferredModuleType);

    let withEnsuredFace = state;
    if (ensured.face !== face) {
        withEnsuredFace = {
            ...state,
            faces: state.faces.map((candidate) =>
                candidate.id === face.id ? ensured.face : candidate,
            ),
        };
    }

    if (preferredModuleType === "rules_text") {
        return addModifierRunToRulesModule(
            withEnsuredFace,
            faceId,
            ensured.moduleId,
            payload.modifierNodeId,
        );
    }

    return addModifierToRailModule(
        withEnsuredFace,
        faceId,
        ensured.moduleId,
        payload.modifierNodeId,
        payload.renderKind === "overlay" ? "rail_badge" : "rail_icon",
    );
}

export function addDroppedModifierToModule(
    state: AbilityCardState,
    faceId: string,
    moduleId: string,
    payload: {
        modifierNodeId: string;
        renderKind?: CardModifierRenderKind;
    },
    edge: "top" | "bottom" = "bottom",
): AbilityCardState {
    const face = state.faces.find((candidate) => candidate.id === faceId);
    if (!face) return state;

    const module = face.modules.find((candidate) => candidate.id === moduleId);
    if (!module) {
        return addDroppedModifierToFace(state, faceId, payload);
    }

    if (module.type === "rules_text") {
        if (payload.renderKind === "rail" || payload.renderKind === "overlay") {
            return addDroppedModifierToFace(state, faceId, payload);
        }

        return addModifierRunToRulesModule(
            state,
            faceId,
            moduleId,
            payload.modifierNodeId,
        );
    }

    if (module.type === "icon_rail") {
        return addModifierToRailModule(
            state,
            faceId,
            moduleId,
            payload.modifierNodeId,
            payload.renderKind === "overlay" ? "rail_badge" : "rail_icon",
        );
    }

    const preferredModuleType =
        payload.renderKind === "rail" || payload.renderKind === "overlay"
            ? "icon_rail"
            : "rules_text";
    const nearestModuleId = findNearestModuleIdByType(
        face,
        moduleId,
        preferredModuleType,
        edge,
    );

    if (nearestModuleId) {
        if (preferredModuleType === "rules_text") {
            return addModifierRunToRulesModule(
                state,
                faceId,
                nearestModuleId,
                payload.modifierNodeId,
            );
        }

        return addModifierToRailModule(
            state,
            faceId,
            nearestModuleId,
            payload.modifierNodeId,
            payload.renderKind === "overlay" ? "rail_badge" : "rail_icon",
        );
    }

    return addDroppedModifierToFace(state, faceId, payload);
}

export function removeModuleFromFace(
    state: AbilityCardState,
    faceId: string,
    moduleId: string,
): AbilityCardState {
    return updateFaceModules(state, faceId, (modules) =>
        modules.filter((module) => module.id !== moduleId),
    );
}

export function moveModuleOnFace(
    state: AbilityCardState,
    faceId: string,
    moduleId: string,
    direction: -1 | 1,
): AbilityCardState {
    return updateFaceModules(state, faceId, (modules) => {
        const index = modules.findIndex((module) => module.id === moduleId);
        if (index < 0) return modules;

        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= modules.length) return modules;

        const next = [...modules];
        const [module] = next.splice(index, 1);
        next.splice(nextIndex, 0, module);
        return next;
    });
}

export function updateTextRun(
    state: AbilityCardState,
    faceId: string,
    moduleId: string,
    runId: string,
    text: string,
): AbilityCardState {
    return updateFaceModules(state, faceId, (modules) =>
        modules.map((module) => {
            if (module.id !== moduleId || module.type !== 'rules_text') return module;

            return {
                ...module,
                runs: module.runs.map((run) =>
                    run.id === runId && run.kind === 'text'
                        ? { ...run, text }
                        : run,
                ),
            };
        }),
    );
}

export function updateModifierRunDisplayMode(
    state: AbilityCardState,
    faceId: string,
    moduleId: string,
    runId: string,
    displayMode: "inline_chip" | "inline_keyword" | "inline_symbol",
): AbilityCardState {
    return updateFaceModules(state, faceId, (modules) =>
        modules.map((module) => {
            if (module.id !== moduleId || module.type !== 'rules_text') return module;

            return {
                ...module,
                runs: module.runs.map((run) =>
                    run.id === runId && run.kind === 'modifier'
                        ? { ...run, displayMode }
                        : run,
                ),
            };
        }),
    );
}

export function removeRunFromRulesModule(
    state: AbilityCardState,
    faceId: string,
    moduleId: string,
    runId: string,
): AbilityCardState {
    return updateFaceModules(state, faceId, (modules) =>
        modules.map((module) => {
            if (module.id !== moduleId || module.type !== 'rules_text') return module;

            return {
                ...module,
                runs: module.runs.filter((run) => run.id !== runId),
            };
        }),
    );
}

export function updateTextModuleValue(
    state: AbilityCardState,
    faceId: string,
    moduleId: string,
    text: string,
): AbilityCardState {
    return updateFaceModules(state, faceId, (modules) =>
        modules.map((module) =>
            module.id === moduleId &&
            module.type !== 'rules_text' &&
            module.type !== 'icon_rail'
                ? { ...module, text }
                : module,
        ),
    );
}

export function updateRailItem(
    state: AbilityCardState,
    faceId: string,
    moduleId: string,
    itemId: string,
    patch: {
        displayMode?: AbilityCardRailDisplayMode,
        hostModifierNodeId?: string | null;
    },
): AbilityCardState {
    return updateFaceModules(state, faceId, (modules) =>
        modules.map((module) => {
            if (module.id !== moduleId || module.type !== 'icon_rail') return module;

            return {
                ...module,
                items: module.items.map((item) =>
                    item.id === itemId ? { ...item, ...patch } : item,
                ),
            };
        }),
    );
}

export function removeRailItem(
    state: AbilityCardState,
    faceId: string,
    moduleId: string,
    itemId: string,
): AbilityCardState {
    return updateFaceModules(state, faceId, (modules) =>
        modules.map((module) => {
            if (module.id !== moduleId || module.type !== 'icon_rail') return module;

            return {
                ...module,
                items: module.items.filter((item) => item.id !== itemId),
            };
        }),
    );
}

export function updateModifierOverride(
    state: AbilityCardState,
    modifierNodeId: string,
    patch: Partial<AbilityCardModifierOverride>,
): AbilityCardState {
    const currentOverrides = state.modifierOverrides ?? {};
    const existing = currentOverrides[modifierNodeId] ?? {};

    const nextEntry: AbilityCardModifierOverride = {
        ...existing,
        ...patch,
        text:
            typeof patch.text === "string"
                ? patch.text
                : existing.text,
    };

    if (nextEntry.text?.trim() === "") {
        nextEntry.text = undefined;
    }

    if (!nextEntry.text && !nextEntry.renderKind) {
        const { [modifierNodeId]: _removed, ...rest } = currentOverrides;
        return {
            ...state,
            modifierOverrides: rest,
        };
    }

    return {
        ...state,
        modifierOverrides: {
            ...currentOverrides,
            [modifierNodeId]: nextEntry,
        },
    };
}

export function clearModifierOverride(
    state: AbilityCardState,
    modifierNodeId: string,
): AbilityCardState {
    const currentOverrides = state.modifierOverrides ?? {};
    if (!currentOverrides[modifierNodeId]) return state;

    const { [modifierNodeId]: _removed, ...rest } = currentOverrides;
    return {
        ...state,
        modifierOverrides: rest,
    };
}

export function reconcileModifierPlacementForRenderKind(
    state: AbilityCardState,
    modifierNodeId: string,
    renderKind: "inline" | "rail",
): AbilityCardState {
    let next = state;

    for (const faceRef of state.faces) {
        const face = next.faces.find((candidate) => candidate.id === faceRef.id);
        if (!face) continue;

        const hasInline = face.modules.some(
            (module) =>
                module.type === "rules_text" &&
                module.runs.some(
                    (run) => run.kind === "modifier" && run.modifierNodeId === modifierNodeId,
                ),
        );

        const hasRail = face.modules.some(
            (module) =>
                module.type === "icon_rail" &&
                module.items.some((item) => item.modifierNodeId === modifierNodeId),
        );

        if (renderKind === "inline") {
            if (!hasRail) continue;

            next = updateFaceModules(next, face.id, (modules) =>
                modules.map((module) =>
                    module.type === "icon_rail"
                        ? {
                            ...module,
                            items: module.items.filter(
                                (item) => item.modifierNodeId !== modifierNodeId,
                            ),
                        }
                        : module,
                ),
            );

            if (!hasInline) {
                const ensured = ensureModuleOnFace(next, face.id, "rules_text");
                if (ensured.moduleId) {
                    next = addModifierRunToRulesModule(
                        ensured.state,
                        face.id,
                        ensured.moduleId,
                        modifierNodeId,
                    );
                } else {
                    next = ensured.state;
                }
            }

            continue;
        }

        if (!hasInline) continue;

        next = updateFaceModules(next, face.id, (modules) =>
            modules.map((module) =>
                module.type === "rules_text"
                    ? {
                        ...module,
                        runs: module.runs.filter(
                            (run) =>
                                run.kind === "text" || run.modifierNodeId !== modifierNodeId,
                        ),
                    }
                    : module,
            ),
        );

        if (!hasRail) {
            const ensured = ensureModuleOnFace(next, face.id, "icon_rail");
            if (ensured.moduleId) {
                next = addModifierToRailModule(
                    ensured.state,
                    face.id,
                    ensured.moduleId,
                    modifierNodeId,
                    "rail_icon",
                );
            } else {
                next = ensured.state;
            }
        }
    }

    return next;
}
