import React, {useMemo, useState} from 'react';
import styles from './EditorWorkspace.module.css';
import {
    type CharacterSheetState,
    type PotentialState,
    type GoalState,
    type PotentialKey,
    type SkillDef,
    type SheetSourceTag,
    REWARD_FROM_GOAL
} from "../../types/sheet.ts";
import {
    type ArchetypeId,
    ARCHETYPES,
    DOMAINS,
    EDITOR_TABS,
    type EditorTabId,
    type DomainId,
} from '../../lib/sheet-data.ts';
import { BASE_PERKS } from "../../lib/rolling/perkData.ts";
import type {PerkDefinition, PerkId} from "../../lib/rolling/types.ts";

type BuilderTabId = EditorTabId | "origin";

type EditorWorkspaceProps = {
    sheet: CharacterSheetState;
    onChange: (next: CharacterSheetState) => void;
    forcedTab?: BuilderTabId;
    hideNav?: boolean;
    onRequestPotentialRoll?: (potential: PotentialState) => void;
};

function updatePotential(
    potentials: PotentialState[],
    key: PotentialState["key"],
    patch: Partial<PotentialState>,
) {
    return potentials.map((entry) =>
        entry.key === key ? { ...entry, ...patch } : entry,
    );
}

export default function EditorWorkspace({
    sheet,
    onChange,
    forcedTab,
    hideNav = false,
    onRequestPotentialRoll,
}: EditorWorkspaceProps) {
    const [internalTab, setInternalTab] = useState<BuilderTabId>("identity");
    const tab = forcedTab ?? internalTab;
    const setTab = forcedTab ? (() => {}) : setInternalTab;

    const proficientDomainIds = useMemo(
        () => new Set(sheet.domains.map((entry) => entry.id)),
        [sheet.domains],
    );

    const allSkills = useMemo(
        () =>
            sheet.potentials.flatMap((potential) =>
                potential.skills.map((skill) => ({
                    potentialKey: potential.key,
                    potentialLabel: potential.title,
                    name: skill.name,
                    label: `${potential.title} · ${skill.name}`,
                })),
            ),
        [sheet.potentials],
    );

    const allPerkOptions = useMemo(
        () =>
            Object.values(BASE_PERKS).slice()
                .sort(
                    (a, b) => a.name.localeCompare(b.name),
                )
                .sort(
                (a, b) => a.costBeats - b.costBeats,
            ),
        [],
    );

    function normalizeSkill(skill: SkillDef, sources: SheetSourceTag[]) {
        const nextSources = sources.length > 0 ? sources : undefined;

        return {
            ...skill,
            sources: nextSources,
            proficient: Boolean(nextSources?.length),
            locked: Boolean(nextSources?.some((source) => source.locked)),
        };
    }

    function getPotentialBaseScore(potential: PotentialState) {
        return potential.baseScore ?? potential.score;
    }

    function getPotentialBonusTotal(potential: PotentialState) {
        return (potential.scoreBonuses ?? []).reduce(
            (sum, bonus) => sum + bonus.amount,
            0,
        );
    }

    function setPotentialBaseScore(potentialKey: PotentialKey, baseScore: number) {
        onChange({
            ...sheet,
            potentials: sheet.potentials.map((potential) => {
                if (potential.key !== potentialKey) return potential;

                const nextBase = Math.max(1, baseScore || 1);
                const bonusTotal = getPotentialBonusTotal(potential);

                return {
                    ...potential,
                    baseScore: nextBase,
                    score: nextBase + bonusTotal,
                };
            }),
        });
    }

    function setPotentialDie(
        potentialKey: PotentialKey,
        die: 4 | 6 | 8 | 10 | 12,
    ) {
        onChange({
            ...sheet,
            potentials: updatePotential(sheet.potentials, potentialKey, {
                volatilityDieMax: die,
            }),
        });
    }

    function asResolverPerks(
        nextResolverPerks: Record<number, PerkDefinition>,
    ): PotentialState["resolverPerks"] | undefined {
        return Object.keys(nextResolverPerks).length > 0
            ? (nextResolverPerks as unknown as PotentialState["resolverPerks"])
            : undefined;
    }

    function getPotentialTotal(potential: PotentialState) {
        return getPotentialBaseScore(potential) + getPotentialBonusTotal(potential);
    }

    function setPotentialCharged(
        potentialKey: PotentialKey,
        charged: boolean,
    ) {
        onChange({
            ...sheet,
            potentials: sheet.potentials.map((potential) => {
                if (potential.key !== potentialKey) return potential;

                const nextResolverPerks = { ...(potential.resolverPerks ?? {}) } as Record<
                    number,
                    PerkDefinition
                >;

                if (!charged) {
                    for (const [face, perk] of Object.entries(nextResolverPerks)) {
                        const perkDef = perk as PerkDefinition | undefined;
                        if (perkDef?.id === "charge") {
                            delete nextResolverPerks[Number(face)];
                        }
                    }
                }

                return {
                    ...potential,
                    charged,
                    resolverPerks: asResolverPerks(nextResolverPerks),
                };
            }),
        });
    }

    function getAssignedPerkEntries(potential: PotentialState) {
        return Object.entries(potential.resolverPerks ?? {})
            .map(([face, perk]) => {
                const perkDef = perk as PerkDefinition | undefined;
                if (!perkDef?.id) return null;

                return {
                    face: Number(face),
                    perkId: perkDef.id as PerkId,
                    perk: perkDef,
                };
            })
            .filter(
                (
                    entry,
                ): entry is {
                    face: number;
                    perkId: PerkId;
                    perk: PerkDefinition;
                } => Boolean(entry),
            )
            .sort((a, b) => a.face - b.face);
    }

    function getAvailablePerks(potential: PotentialState) {
        const assignedIds = new Set(
            getAssignedPerkEntries(potential).map((entry) => entry.perkId),
        );

        return allPerkOptions.filter((perk) => {
            if (assignedIds.has(perk.id)) return false;

            const isChargeOnly = Boolean((perk as { chargeOnly?: boolean }).chargeOnly);
            if (isChargeOnly) {
                return Boolean(potential.charged);
            }

            return true;
        });
    }

    function getAllowedFaces(
        potential: PotentialState,
        perkId: PerkId,
        currentFace?: number,
    ) {
        const total = getPotentialTotal(potential);
        const dieMax = potential.volatilityDieMax;

        const occupiedFaces = new Set(
            getAssignedPerkEntries(potential)
                .filter((entry) => entry.face !== currentFace)
                .map((entry) => entry.face),
        );

        if (perkId === "charge") {
            const chargeFace = dieMax;

            if (
                potential.charged &&
                chargeFace <= total &&
                !occupiedFaces.has(chargeFace)
            ) {
                return [chargeFace];
            }

            return typeof currentFace === "number" ? [currentFace] : [];
        }

        const faces: number[] = [];
        const upperBound = Math.min(total, dieMax);

        for (let face = 2; face <= upperBound; face += 1) {
            if (face === dieMax) continue;
            if (occupiedFaces.has(face)) continue;
            faces.push(face);
        }

        if (typeof currentFace === "number" && !faces.includes(currentFace)) {
            faces.unshift(currentFace);
        }

        return Array.from(new Set(faces)).sort((a, b) => a - b);
    }

    function addPerkToPotential(
        potentialKey: PotentialKey,
        perkId: PerkId,
    ) {
        const potential = sheet.potentials.find((entry) => entry.key === potentialKey);
        if (!potential) return;

        const allowedFaces = getAllowedFaces(potential, perkId);
        if (allowedFaces.length === 0) return;

        const nextResolverPerks = { ...(potential.resolverPerks ?? {}) } as Record<
            number,
            PerkDefinition
        >;

        nextResolverPerks[allowedFaces[0]] = BASE_PERKS[perkId];

        onChange({
            ...sheet,
            potentials: updatePotential(sheet.potentials, potentialKey, {
                resolverPerks: asResolverPerks(nextResolverPerks),
            }),
        });
    }

    function movePotentialPerk(
        potentialKey: PotentialKey,
        perkId: PerkId,
        nextFace: number,
    ) {
        const potential = sheet.potentials.find((entry) => entry.key === potentialKey);
        if (!potential) return;

        const nextResolverPerks = {} as Record<number, PerkDefinition>;

        for (const [face, perk] of Object.entries(potential.resolverPerks ?? {})) {
            const perkDef = perk as PerkDefinition | undefined;
            if (!perkDef?.id) continue;
            if (perkDef.id === perkId) continue;

            nextResolverPerks[Number(face)] = perkDef;
        }

        nextResolverPerks[nextFace] = BASE_PERKS[perkId];

        onChange({
            ...sheet,
            potentials: updatePotential(sheet.potentials, potentialKey, {
                resolverPerks: asResolverPerks(nextResolverPerks),
            }),
        });
    }

    function removePotentialPerk(
        potentialKey: PotentialKey,
        perkId: PerkId,
    ) {
        const potential = sheet.potentials.find((entry) => entry.key === potentialKey);
        if (!potential) return;

        const nextResolverPerks = {} as Record<number, PerkDefinition>;

        for (const [face, perk] of Object.entries(potential.resolverPerks ?? {})) {
            const perkDef = perk as PerkDefinition | undefined;
            if (!perkDef?.id) continue;
            if (perkDef.id === perkId) continue;

            nextResolverPerks[Number(face)] = perkDef;
        }

        onChange({
            ...sheet,
            potentials: updatePotential(sheet.potentials, potentialKey, {
                resolverPerks: asResolverPerks(nextResolverPerks),
            }),
        });
    }

    function setManualSkillProficiency(
        potentialKey: PotentialKey,
        skillName: string,
        enabled: boolean,
    ) {
        const sourceId = `manual:${potentialKey}:${skillName}`;

        onChange({
            ...sheet,
            potentials: sheet.potentials.map((potential) => {
                if (potential.key !== potentialKey) return potential;

                return {
                    ...potential,
                    skills: potential.skills.map((skill) => {
                        if (skill.name !== skillName) return skill;

                        const nextSources = (skill.sources ?? []).filter(
                            (source) => source.id !== sourceId,
                        );

                        if (enabled) {
                            nextSources.push({
                                id: sourceId,
                                kind: "manual",
                                label: "Manual builder choice",
                            });
                        }

                        return normalizeSkill(skill, nextSources);
                    }),
                };
            }),
        });
    }

    function applyOriginSkillSelection(
        facet: "profession" | "crux" | "descent",
        nextSkillName?: string,
    ) {
        const sourceId = `origin:${facet}:skill`;

        const kind =
            facet === 'profession'
                ? 'origin-profession'
                : facet === 'crux'
                    ? 'origin-crux'
                    : 'origin-descent';

        const label =
            facet === 'profession'
                ? "Profession boon"
                : facet === 'crux'
                    ? "Crux boon"
                    : "Descent boon";

        onChange({
            ...sheet,
            originSelections: {
                ...sheet.originSelections,
                [facet]: {
                    ...(sheet.originSelections?.[facet] ?? {}),
                    skillName: nextSkillName || undefined,
                },
            },
            potentials: sheet.potentials.map((potential) => ({
                ...potential,
                skills: potential.skills.map((skill) => {
                    const nextSources = (skill.sources ?? []).filter(
                        (source) => source.id !== sourceId,
                    );

                    if (nextSkillName && skill.name === nextSkillName) {
                        nextSources.push({
                            id: sourceId,
                            kind,
                            label,
                            locked: true,
                        });
                    }

                    return normalizeSkill(skill, nextSources);
                }),
            })),
        });
    }

    function applyOriginPotentialBonus(
        facet: 'crux' | 'bloodline',
        nextPotentialKey?: PotentialKey,
    ) {
        const sourceId = `origin:${facet}:potential`;
        const kind =
            facet === 'crux' ? 'origin-crux' : 'origin-bloodline';
        const label =
            facet === 'crux' ? 'Crux bonus' : 'Bloodline bonus';

        onChange({
            ...sheet,
            originSelections: {
                ...sheet.originSelections,
                [facet]: {
                    ...(sheet.originSelections?.[facet] ?? {}),
                    potentialKey: nextPotentialKey || undefined,
                },
            },
            potentials: sheet.potentials.map((potential) => {
                const nextBonuses = (potential.scoreBonuses ?? []).filter(
                    (bonus) => bonus.id !== sourceId,
                );

                if (nextPotentialKey && potential.key === nextPotentialKey) {
                    nextBonuses.push({
                        id: sourceId,
                        kind,
                        label,
                        amount: 1,
                        locked: true,
                    });
                }

                const baseScore = potential.baseScore ?? potential.score;
                const nextTotal =
                    baseScore +
                    nextBonuses.reduce((sum, bonus) => sum + bonus.amount, 0);

                return {
                    ...potential,
                    score: nextTotal,
                    scoreBonuses: nextBonuses.length > 0 ? nextBonuses : undefined,
                };
            }),
        });
    }

    function patchOriginFacet(
        facet: "profession" | 'crux' | 'descent' | 'bloodline',
        patch: Record<string, unknown>,
    ) {
        onChange({
            ...sheet,
            originSelections: {
                ...sheet.originSelections,
                [facet]: {
                    ...(sheet.originSelections?.[facet] ?? {}),
                    ...patch,
                },
            },
        });
    }

    function setArchetypeLevel(archetypeId: ArchetypeId, levels: number) {
        const nextLevels = Math.max(0, levels);

        const existing = sheet.header.archetypes.find(
            (entry) => entry.id === archetypeId,
        );

        let nextArchetypes = sheet.header.archetypes.filter(
            (entry) => entry.id !== archetypeId,
        );

        if (nextLevels > 0) {
            const base = ARCHETYPES.find((entry) => entry.id === archetypeId);
            if (!base) return;

            nextArchetypes = [
                ...nextArchetypes,
                {
                    id: archetypeId,
                    label: base.label,
                    levels: nextLevels,
                },
            ];
        }

        onChange({
            ...sheet,
            header: {
                ...sheet.header,
                archetypes: nextArchetypes,
            },
        });
    }

    function toggleDomain(domainId: DomainId) {
        const isProficient = proficientDomainIds.has(domainId);

        if (isProficient) {
            onChange({
                ...sheet,
                domains: sheet.domains.filter((entry) => entry.id !== domainId),
            });
            return;
        }

        const domain = DOMAINS.find((entry) => entry.id === domainId);
        if (!domain) return;

        onChange({
            ...sheet,
            domains: [
                ...sheet.domains,
                {
                    id: domain.id,
                    label: domain.label,
                    deity: domain.deity,
                    summary: domain.summary,
                },
            ],
        });
    }

    return (
        <section className={`${styles.editor} ${hideNav ? styles.editorFull : ""}`}>
            {!hideNav ? (
                <aside className={styles.sidebar}>
                    <div className={styles.eyebrow}>Editing</div>
                    <h2 className={styles.title}>Character Builder</h2>

                    <nav className={styles.nav}>
                        {EDITOR_TABS.map((entry) => (
                            <button
                                key={entry.id}
                                type={'button'}
                                className={`${styles.navButton} ${
                                    tab === entry.id ? styles.navButtonActive : ""
                                }`}
                                onClick={() => setTab(entry.id)}
                            >
                                {entry.label}
                            </button>
                        ))}
                    </nav>
                </aside>
            ) : null}

            <div className={styles.content}>
                {tab === "identity" ? (
                    <section className={styles.section}>
                        <header className={styles.sectionHeader}>
                            <div className={styles.sectionEyebrow}>Basics</div>
                            <h3>Identity</h3>
                        </header>

                        <div className={styles.grid2}>
                            <label className={styles.field}>
                                <span>Character Name</span>
                                <input
                                    value={sheet.header.name}
                                    onChange={(e) => {
                                        onChange({
                                            ...sheet,
                                            header: { ...sheet.header, name: e.target.value },
                                        })
                                    }}
                                />
                            </label>

                            <label className={styles.field}>
                                <span>Player Name</span>
                                <input
                                    value={sheet.header.playerName}
                                    onChange={(e) => {
                                        onChange({
                                            ...sheet,
                                            header: { ...sheet.header, playerName: e.target.value },
                                        })
                                    }}
                                />
                            </label>

                            <label className={styles.field}>
                                <span>Origin</span>
                                <input
                                    value={sheet.header.origin}
                                    onChange={(e) => {
                                        onChange({
                                            ...sheet,
                                            header: { ...sheet.header, origin: e.target.value },
                                        })
                                    }}
                                />
                            </label>

                            <label className={styles.field}>
                                <span>Party Name</span>
                                <input
                                    value={sheet.header.partyName ?? ""}
                                    onChange={(e) => {
                                        onChange({
                                            ...sheet,
                                            header: {
                                                ...sheet.header,
                                                partyName: e.target.value || undefined,
                                            }
                                        })
                                    }}
                                />
                            </label>
                        </div>

                        <section className={styles.section}>
                            <header className={styles.sectionHeader}>
                                <div className={styles.sectionEyebrow}>Archetypes</div>
                                <h3>Chosen Archetypes</h3>
                            </header>

                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <strong>Add Archetype</strong>
                                </div>

                                <div className={styles.addRow}>
                                    <select
                                        value={''}
                                        onChange={(e) => {
                                            const nextId = e.target.value as ArchetypeId;
                                            if (!nextId) return;

                                            const alreadyExists = sheet.header.archetypes.some(
                                                (entry) => entry.id === nextId,
                                            );
                                            if (alreadyExists) return;

                                            const base = ARCHETYPES.find((entry) => entry.id === nextId);
                                            if (!base) return;

                                            onChange({
                                                ...sheet,
                                                header: {
                                                    ...sheet.header,
                                                    archetypes: [
                                                        ...sheet.header.archetypes,
                                                        {
                                                            id: base.id,
                                                            label: base.label,
                                                            levels: 1,
                                                        },
                                                    ],
                                                },
                                            });

                                            e.target.value = "";
                                        }}
                                        >
                                        <option value={""}>Choose archetype...</option>
                                        {ARCHETYPES.filter(
                                            (archetype) =>
                                                !sheet.header.archetypes.some(
                                                    (entry) => entry.id === archetype.id,
                                                ),
                                        ).map((archetype) => (
                                            <option key={archetype.id} value={archetype.id}>
                                                {archetype.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className={styles.stack}>
                                {sheet.header.archetypes.length === 0 ? (
                                    <div className={styles.inlineCard}>
                                        <strong>No archetypes added yet.</strong>
                                        <p>Add one to start tracking archetype levels and Tier.</p>
                                    </div>
                                ) : (
                                    sheet.header.archetypes
                                        .slice()
                                        .sort((a, b) => a.label.localeCompare(b.label))
                                        .map((archetype) => (
                                            <article key={archetype.id} className={styles.card}>
                                                <div className={styles.cardHeader}>
                                                    <strong>{archetype.label}</strong>

                                                    <button
                                                        type={'button'}
                                                        className={styles.removeButton}
                                                        onClick={() => {
                                                            onChange({
                                                                ...sheet,
                                                                header: {
                                                                    ...sheet.header,
                                                                    archetypes: sheet.header.archetypes.filter(
                                                                        (entry) => entry.id !== archetype.id,
                                                                    ),
                                                                },
                                                            })
                                                        }}
                                                        >
                                                        Remove
                                                    </button>
                                                </div>

                                                <div className={styles.grid2}>
                                                    <label className={styles.field}>
                                                        <span>Levels</span>
                                                        <input
                                                            type={'number'}
                                                            min={1}
                                                            value={archetype.levels}
                                                            onChange={(e) => {
                                                                const nextLevels = Math.max(1, Number(e.target.value) || 1);

                                                                onChange({
                                                                    ...sheet,
                                                                    header: {
                                                                        ...sheet.header,
                                                                        archetypes: sheet.header.archetypes.map(
                                                                            (entry) =>
                                                                                entry.id === archetype.id
                                                                                    ? { ...entry, levels: nextLevels }
                                                                                    : entry,
                                                                        ),
                                                                    },
                                                                });
                                                            }}
                                                            />
                                                    </label>
                                                </div>
                                            </article>
                                        ))

                                )}
                            </div>
                        </section>
                    </section>
                ) : null}

                {tab === "origin" ? (
                    <section className={styles.section}>
                        <header className={styles.sectionHeader}>
                            <div className={styles.sectionEyebrow}>Background & Heritage</div>
                            <h3>Origin</h3>
                        </header>

                        <div className={styles.grid2}>
                            <article className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <strong>Profession</strong>
                                </div>

                                <div className={styles.stack}>
                                    <label className={styles.field}>
                                        <span>Name</span>
                                        <input
                                            value={sheet.originSelections?.profession?.name ?? ""}
                                            onChange={(e) =>
                                                patchOriginFacet("profession", { name: e.target.value })
                                            }
                                        />
                                    </label>

                                    <label className={styles.field}>
                                        <span>Granted skill proficiency</span>
                                        <select
                                            value={sheet.originSelections?.profession?.skillName ?? ""}
                                            onChange={(e) =>
                                                applyOriginSkillSelection(
                                                    "profession",
                                                    e.target.value || undefined,
                                                )
                                            }
                                        >
                                            <option value="">Choose skill...</option>
                                            {allSkills.map((skill) => (
                                                <option key={`profession-${skill.name}`} value={skill.name}>
                                                    {skill.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className={styles.field}>
                                        <span>Granted knack</span>
                                        <input
                                            value={sheet.originSelections?.profession?.knackName ?? ""}
                                            onChange={(e) =>
                                                patchOriginFacet("profession", { knackName: e.target.value })
                                            }
                                        />
                                    </label>

                                    <label className={styles.field}>
                                        <span>Functional starting equipment</span>
                                        <textarea
                                            value={sheet.originSelections?.profession?.equipmentNote ?? ""}
                                            onChange={(e) =>
                                                patchOriginFacet("profession", { equipmentNote: e.target.value })
                                            }
                                        />
                                    </label>
                                </div>
                            </article>

                            <article className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <strong>Crux</strong>
                                </div>

                                <div className={styles.stack}>
                                    <label className={styles.field}>
                                        <span>Name</span>
                                        <input
                                            value={sheet.originSelections?.crux?.name ?? ""}
                                            onChange={(e) =>
                                                patchOriginFacet("crux", { name: e.target.value })
                                            }
                                        />
                                    </label>

                                    <label className={styles.field}>
                                        <span>+1 potential boon</span>
                                        <select
                                            value={sheet.originSelections?.crux?.potentialKey ?? ""}
                                            onChange={(e) =>
                                                applyOriginPotentialBonus(
                                                    "crux",
                                                    (e.target.value as PotentialKey) || undefined,
                                                )
                                            }
                                        >
                                            <option value="">Choose potential...</option>
                                            {sheet.potentials.map((potential) => (
                                                <option key={`crux-${potential.key}`} value={potential.key}>
                                                    {potential.title}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className={styles.field}>
                                        <span>Granted skill proficiency</span>
                                        <select
                                            value={sheet.originSelections?.crux?.skillName ?? ""}
                                            onChange={(e) =>
                                                applyOriginSkillSelection(
                                                    "crux",
                                                    e.target.value || undefined,
                                                )
                                            }
                                        >
                                            <option value="">Choose skill...</option>
                                            {allSkills.map((skill) => (
                                                <option key={`crux-${skill.name}`} value={skill.name}>
                                                    {skill.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className={styles.field}>
                                        <span>Granted knack</span>
                                        <input
                                            value={sheet.originSelections?.crux?.knackName ?? ""}
                                            onChange={(e) =>
                                                patchOriginFacet("crux", { knackName: e.target.value })
                                            }
                                        />
                                    </label>

                                    <label className={styles.field}>
                                        <span>Minor / Major goals & sentimental equipment</span>
                                        <textarea
                                            value={sheet.originSelections?.crux?.notes ?? ""}
                                            onChange={(e) =>
                                                patchOriginFacet("crux", { notes: e.target.value })
                                            }
                                        />
                                    </label>
                                </div>
                            </article>

                            <article className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <strong>Descent</strong>
                                </div>

                                <div className={styles.stack}>
                                    <label className={styles.field}>
                                        <span>Name</span>
                                        <input
                                            value={sheet.originSelections?.descent?.name ?? ""}
                                            onChange={(e) =>
                                                patchOriginFacet("descent", { name: e.target.value })
                                            }
                                        />
                                    </label>

                                    <label className={styles.field}>
                                        <span>Granted skill proficiency</span>
                                        <select
                                            value={sheet.originSelections?.descent?.skillName ?? ""}
                                            onChange={(e) =>
                                                applyOriginSkillSelection(
                                                    "descent",
                                                    e.target.value || undefined,
                                                )
                                            }
                                        >
                                            <option value="">Choose skill...</option>
                                            {allSkills.map((skill) => (
                                                <option key={`descent-${skill.name}`} value={skill.name}>
                                                    {skill.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className={styles.field}>
                                        <span>Granted domain</span>
                                        <select
                                            value={sheet.originSelections?.descent?.domainId ?? ""}
                                            onChange={(e) =>
                                                patchOriginFacet("descent", {
                                                    domainId: e.target.value || undefined,
                                                })
                                            }
                                        >
                                            <option value="">Choose domain...</option>
                                            {DOMAINS.map((domain) => (
                                                <option key={domain.id} value={domain.id}>
                                                    {domain.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            </article>

                            <article className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <strong>Bloodline</strong>
                                </div>

                                <div className={styles.stack}>
                                    <label className={styles.field}>
                                        <span>Name</span>
                                        <input
                                            value={sheet.originSelections?.bloodline?.name ?? ""}
                                            onChange={(e) =>
                                                patchOriginFacet("bloodline", { name: e.target.value })
                                            }
                                        />
                                    </label>

                                    <label className={styles.field}>
                                        <span>+1 potential boon</span>
                                        <select
                                            value={sheet.originSelections?.bloodline?.potentialKey ?? ""}
                                            onChange={(e) =>
                                                applyOriginPotentialBonus(
                                                    "bloodline",
                                                    (e.target.value as PotentialKey) || undefined,
                                                )
                                            }
                                        >
                                            <option value="">Choose potential...</option>
                                            {sheet.potentials.map((potential) => (
                                                <option key={`bloodline-${potential.key}`} value={potential.key}>
                                                    {potential.title}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className={styles.field}>
                                        <span>Bloodline ability summary</span>
                                        <textarea
                                            value={sheet.originSelections?.bloodline?.abilitySummary ?? ""}
                                            onChange={(e) =>
                                                patchOriginFacet("bloodline", {
                                                    abilitySummary: e.target.value,
                                                })
                                            }
                                        />
                                    </label>
                                </div>
                            </article>
                        </div>
                    </section>
                ) : null}

                {tab === "potentials" ? (
                    <section className={styles.section}>
                        <header className={styles.sectionHeader}>
                            <div className={styles.sectionEyebrow}>Stats</div>
                            <h3>Potentials</h3>
                        </header>

                        <div className={styles.potentialGrid}>
                            {sheet.potentials.map((potential) => {
                                const totalScore = getPotentialTotal(potential);
                                const assignedPerks = getAssignedPerkEntries(potential);
                                const availablePerks = getAvailablePerks(potential);

                                return (
                                    <article key={potential.key} className={`${styles.card} ${styles.potentialCard}`}>
                                        <div className={styles.potentialHeaderRow}>
                                            <strong>{potential.title}</strong>

                                            <div className={styles.potentialHeaderActions}>
                                                <label className={styles.checkboxCompact}>
                                                    <input
                                                        type="checkbox"
                                                        checked={Boolean(potential.charged)}
                                                        onChange={(e) =>
                                                            setPotentialCharged(potential.key, e.target.checked)
                                                        }
                                                    />
                                                    Charged
                                                </label>

                                                <button
                                                    type="button"
                                                    className={styles.smallButton}
                                                    onClick={() => onRequestPotentialRoll?.(potential)}
                                                >
                                                    Roll 3d4
                                                </button>
                                            </div>
                                        </div>

                                        <div className={styles.potentialTopRow}>
                                            <div className={styles.totalBlock}>
                                                <span className={styles.totalLabel}>Total</span>
                                                <strong className={styles.totalValue}>{totalScore}</strong>

                                                {potential.scoreBonuses?.length ? (
                                                    <ul className={styles.bonusList}>
                                                        {potential.scoreBonuses.map((bonus) => (
                                                            <li key={bonus.id}>
                                                                +{bonus.amount} from {bonus.label}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span className={styles.metaMuted}>No bonus sources.</span>
                                                )}
                                            </div>

                                            <label className={styles.compactField}>
                                                <span>Base</span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={getPotentialBaseScore(potential)}
                                                    onChange={(e) =>
                                                        setPotentialBaseScore(
                                                            potential.key,
                                                            Number(e.target.value) || 1,
                                                        )
                                                    }
                                                />
                                            </label>

                                            <label className={styles.compactField}>
                                                <span>Volatility</span>
                                                <select
                                                    value={potential.volatilityDieMax}
                                                    onChange={(e) =>
                                                        setPotentialDie(
                                                            potential.key,
                                                            Number(e.target.value) as 4 | 6 | 8 | 10 | 12,
                                                        )
                                                    }
                                                >
                                                    <option value={4}>D4</option>
                                                    <option value={6}>D6</option>
                                                    <option value={8}>D8</option>
                                                    <option value={10}>D10</option>
                                                    <option value={12}>D12</option>
                                                </select>
                                            </label>
                                        </div>

                                        <div className={styles.perkAdderRow}>
                                            <select
                                                defaultValue=""
                                                onChange={(e) => {
                                                    const nextPerkId = e.target.value as PerkId;
                                                    if (!nextPerkId) return;

                                                    addPerkToPotential(potential.key, nextPerkId);
                                                    e.currentTarget.value = "";
                                                }}
                                            >
                                                <option value="">Add perk by name...</option>
                                                {availablePerks.map((perk) => (
                                                    <option key={perk.id} value={perk.id}>
                                                        {perk.name}
                                                    </option>
                                                ))}
                                            </select>

                                            <span className={styles.metaMuted}>
                                Legal faces: 2–{Math.max(2, Math.min(totalScore, potential.volatilityDieMax))}
                            </span>
                                        </div>

                                        <div className={styles.perkList}>
                                            {assignedPerks.length === 0 ? (
                                                <div className={styles.metaMuted}>No perks assigned.</div>
                                            ) : (
                                                assignedPerks.map((entry) => {
                                                    const allowedFaces = getAllowedFaces(
                                                        potential,
                                                        entry.perkId,
                                                        entry.face,
                                                    );

                                                    return (
                                                        <div
                                                            key={`${potential.key}-${entry.perkId}`}
                                                            className={styles.perkRow}
                                                        >
                                                            <div className={styles.perkName}>
                                                                <strong>{entry.perk.name}</strong>
                                                                <span>{entry.perk.shortLabel}</span>
                                                            </div>

                                                            <select
                                                                className={styles.faceSelect}
                                                                value={entry.face}
                                                                onChange={(e) =>
                                                                    movePotentialPerk(
                                                                        potential.key,
                                                                        entry.perkId,
                                                                        Number(e.target.value),
                                                                    )
                                                                }
                                                            >
                                                                {allowedFaces.map((face) => (
                                                                    <option key={face} value={face}>
                                                                        Face {face}
                                                                    </option>
                                                                ))}
                                                            </select>

                                                            <button
                                                                type="button"
                                                                className={styles.removeButton}
                                                                onClick={() =>
                                                                    removePotentialPerk(
                                                                        potential.key,
                                                                        entry.perkId,
                                                                    )
                                                                }
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                ) : null}

                {tab === "proficiencies" ? (
                    <section className={styles.section}>
                        <header className={styles.sectionHeader}>
                            <div className={styles.sectionEyebrow}>Volatility Sources</div>
                            <h3>Proficiencies</h3>
                        </header>

                        <section className={styles.section}>
                            <header className={styles.sectionHeader}>
                                <div className={styles.sectionEyebrow}>Skills</div>
                                <h4>Skill proficiencies by potential</h4>
                            </header>

                            <div className={styles.potentialGrid}>
                                {sheet.potentials.map((potential) => (
                                    <article key={`skills-${potential.key}`} className={styles.card}>
                                        <div className={styles.cardHeader}>
                                            <strong>{potential.title}</strong>
                                            <span className={styles.metaMuted}>
                                {potential.skills.filter((skill) => skill.proficient).length} proficient
                            </span>
                                        </div>

                                        <div className={styles.skillList}>
                                            {potential.skills.map((skill) => {
                                                const locked = Boolean(skill.locked);
                                                const sourceLabel = skill.sources?.map((source) => source.label).join(", ");

                                                return (
                                                    <label
                                                        key={`${potential.key}-${skill.name}`}
                                                        className={styles.skillRow}
                                                    >
                                                        <div className={styles.skillText}>
                                                            <strong>{skill.name}</strong>
                                                            <span>{skill.summary}</span>
                                                            {sourceLabel ? (
                                                                <small>Source: {sourceLabel}</small>
                                                            ) : null}
                                                        </div>

                                                        <span className={styles.checkboxCompact}>
                                            <input
                                                type="checkbox"
                                                checked={Boolean(skill.proficient)}
                                                disabled={locked}
                                                onChange={(e) =>
                                                    setManualSkillProficiency(
                                                        potential.key,
                                                        skill.name,
                                                        e.target.checked,
                                                    )
                                                }
                                            />
                                            Proficient
                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>

                        <div className={styles.grid2}>
                            <article className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <strong>Domains</strong>
                                </div>

                                <div className={styles.domainGrid}>
                                    {DOMAINS.map((domain) => (
                                        <label key={domain.id} className={styles.domainRow}>
                                            <div className={styles.domainText}>
                                                <strong>{domain.label}</strong>
                                                {domain.deity ? <span>{domain.deity}</span> : null}
                                                <small>{domain.summary}</small>
                                            </div>

                                            <span className={styles.checkboxCompact}>
                                <input
                                    type="checkbox"
                                    checked={proficientDomainIds.has(domain.id)}
                                    onChange={() => toggleDomain(domain.id)}
                                />
                                Proficient
                            </span>
                                        </label>
                                    ))}
                                </div>
                            </article>

                            <article className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <strong>Knacks</strong>
                                    <button
                                        type="button"
                                        className={styles.smallButton}
                                        onClick={() => {
                                            onChange({
                                                ...sheet,
                                                knacks: [
                                                    ...sheet.knacks,
                                                    {
                                                        id: crypto.randomUUID(),
                                                        name: "New Knack",
                                                        summary: "",
                                                        linkedSkills: [],
                                                    },
                                                ],
                                            });
                                        }}
                                    >
                                        Add
                                    </button>
                                </div>

                                <div className={styles.knackList}>
                                    {sheet.knacks.map((knack) => (
                                        <div key={knack.id} className={styles.knackRow}>
                                            <input
                                                value={knack.name}
                                                placeholder="Knack name"
                                                onChange={(e) => {
                                                    onChange({
                                                        ...sheet,
                                                        knacks: sheet.knacks.map((entry) =>
                                                            entry.id === knack.id
                                                                ? { ...entry, name: e.target.value }
                                                                : entry,
                                                        ),
                                                    });
                                                }}
                                            />

                                            <input
                                                value={knack.summary ?? ""}
                                                placeholder="Summary"
                                                onChange={(e) => {
                                                    onChange({
                                                        ...sheet,
                                                        knacks: sheet.knacks.map((entry) =>
                                                            entry.id === knack.id
                                                                ? { ...entry, summary: e.target.value }
                                                                : entry,
                                                        ),
                                                    });
                                                }}
                                            />

                                            <input
                                                value={knack.linkedSkills?.join(", ") ?? ""}
                                                placeholder="Linked skills"
                                                onChange={(e) => {
                                                    onChange({
                                                        ...sheet,
                                                        knacks: sheet.knacks.map((entry) =>
                                                            entry.id === knack.id
                                                                ? {
                                                                    ...entry,
                                                                    linkedSkills: e.target.value
                                                                        .split(",")
                                                                        .map((part) => part.trim())
                                                                        .filter(Boolean),
                                                                }
                                                                : entry,
                                                        ),
                                                    });
                                                }}
                                            />

                                            <button
                                                type="button"
                                                className={styles.removeButton}
                                                onClick={() => {
                                                    onChange({
                                                        ...sheet,
                                                        knacks: sheet.knacks.filter((entry) => entry.id !== knack.id),
                                                    });
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        </div>
                    </section>
                ) : null}

                {tab === "goals" ? (
                    <section className={styles.section}>
                        <header className={styles.sectionHeader}>
                            <div className={styles.sectionEyebrow}>Story</div>
                            <h3>Goals</h3>
                        </header>

                        <div className={styles.stack}>
                            <button
                                type={'button'}
                                className={styles.smallButton}
                                onClick={() => {
                                    onChange({
                                        ...sheet,
                                        goals: [
                                            ...sheet.goals,
                                            {
                                                id: crypto.randomUUID(),
                                                title: "New Goal",
                                                tier: "minor",
                                                reward: "string",
                                            },
                                        ],
                                    })
                                }}
                                >
                                Add Goal
                            </button>

                            {sheet.goals.map((goal: GoalState) => (
                                <article key={goal.id} className={styles.card}>
                                    <div className={styles.grid4}>
                                        <label className={styles.field}>
                                            <span>Title</span>
                                            <input
                                                value={goal.title}
                                                onChange={(e) => {
                                                    onChange({
                                                        ...sheet,
                                                        goals: sheet.goals.map((entry) =>
                                                            entry.id === goal.id ? { ...entry, title: e.target.value } : entry
                                                        ),
                                                    })
                                                }}
                                                />
                                        </label>

                                        <label className={styles.field}>
                                            <span>Goal Type</span>
                                            <select
                                                value={goal.tier}
                                                onChange={(e) => {
                                                    onChange({
                                                        ...sheet,
                                                        goals: sheet.goals.map((entry) =>
                                                            entry.id === goal.id
                                                                ? { ...entry, tier: e.target.value as GoalState['tier'] }
                                                                : entry,
                                                        ),
                                                    })
                                                }}
                                                >
                                                <option value={'minor'}>Minor</option>
                                                <option value={'major'}>Major</option>
                                                <option value={'heroic'}>Heroic</option>
                                                <option value={'flaw'}>Flaw</option>
                                            </select>
                                        </label>

                                        <span>Reward: {REWARD_FROM_GOAL.get(goal.tier)}</span>
                                    </div>

                                    <label className={styles.field}>
                                        <span>Notes</span>
                                        <textarea
                                            value={goal.notes ?? ""}
                                            onChange={(e) => {
                                                onChange({
                                                    ...sheet,
                                                    goals: sheet.goals.map((entry) =>
                                                        entry.id === goal.id
                                                            ? { ...entry, notes: e.target.value || undefined }
                                                            : entry,
                                                    ),
                                                })
                                            }}
                                        />
                                    </label>
                                </article>
                            ))}
                        </div>
                    </section>
                ) : null}
            </div>
        </section>
    );
}