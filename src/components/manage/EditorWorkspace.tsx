import React, {useMemo, useState} from 'react';
import styles from './EditorWorkspace.module.css';
import {
    type CharacterSheetState,
    type PotentialState,
    type GoalState,
    REWARD_FROM_GOAL
} from "../../types/sheet.ts";
import {
    type ArchetypeId,
    ARCHETYPES,
    DOMAINS,
    EDITOR_TABS,
    getTierFromArchetypes,
    type EditorTabId,
    type DomainId,
} from '../../lib/sheet-data.ts';

type EditorWorkspaceProps = {
    sheet: CharacterSheetState;
    onChange: (next: CharacterSheetState) => void;
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
}: EditorWorkspaceProps) {
    const [tab, setTab] = useState<EditorTabId>("identity");

    const proficientDomainIds = useMemo(
        () => new Set(sheet.domains.map((entry) => entry.id)),
        [sheet.domains],
    );

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
        <section className={styles.editor}>
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

                {tab === "potentials" ? (
                    <section className={styles.section}>
                        <header className={styles.sectionHeader}>
                            <div className={styles.sectionEyebrow}>Stats</div>
                            <h3>Potentials</h3>
                        </header>

                        <div className={styles.stack}>
                            {sheet.potentials.map((potential) => (
                                <article key={potential.key} className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <strong>{potential.title}</strong>
                                        <label className={styles.checkboxRow}>
                                            <input
                                                type={'checkbox'}
                                                checked={Boolean(potential.charged)}
                                                onChange={(e) => {
                                                    onChange({
                                                        ...sheet,
                                                        potentials: updatePotential(sheet.potentials, potential.key, {
                                                            charged: e.target.checked,
                                                        }),
                                                    })
                                                }}
                                            />
                                        </label>
                                    </div>

                                    <div className={styles.grid2}>
                                        <label className={styles.field}>
                                            <span>Score</span>
                                            <input
                                                type={'number'}
                                                min={1}
                                                value={potential.score}
                                                onChange={(e) => {
                                                    onChange({
                                                        ...sheet,
                                                        potentials: updatePotential(sheet.potentials, potential.key, {
                                                            score: Math.max(1, Number(e.target.value) || 1),
                                                        }),
                                                    })
                                                }}
                                            />
                                        </label>

                                        <label className={styles.field}>
                                            <span>Volatility Die</span>
                                            <select
                                                value={potential.volatilityDieMax}
                                                onChange={(e) => {
                                                    onChange({
                                                        ...sheet,
                                                        potentials: updatePotential(sheet.potentials, potential.key, {
                                                            volatilityDieMax: Number(e.target.value) as 4 | 6 | 8 | 10 | 12,
                                                        }),
                                                    })
                                                }}
                                            >
                                                <option value={4}>D4</option>
                                                <option value={6}>D6</option>
                                                <option value={8}>D8</option>
                                                <option value={10}>D10</option>
                                                <option value={12}>D12</option>
                                            </select>
                                        </label>
                                    </div>

                                    <div className={styles.skillsGrid}>
                                        {potential.skills.map((skill, index) => (
                                            <div>
                                                {skill.name}
                                                <label className={styles.checkboxRow}>
                                                    <input
                                                        type={'checkbox'}
                                                        checked={Boolean(skill.proficient)}
                                                        onChange={(e) => {
                                                            const nextSkills = potential.skills.map((entry, skillIndex) =>
                                                                skillIndex === index
                                                                    ? { ...entry, proficient: e.target.checked }
                                                                    : entry
                                                            );
                                                            onChange({
                                                                ...sheet,
                                                                potentials: updatePotential(sheet.potentials, potential.key, {
                                                                    skills: nextSkills,
                                                                }),
                                                            });
                                                        }}
                                                    />
                                                    Proficient
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                ) : null}

                {tab === "proficiencies" ? (
                    <section className={styles.section}>
                        <header className={styles.sectionHeader}>
                            <div className={styles.sectionEyebrow}>Volatility Sources</div>
                            <h3>Domains & Knacks</h3>
                        </header>

                        <section className={styles.section}>
                            <h4>Skill Proficiencies</h4>
                            <a onClick={() => setTab('potentials')}>See Skills.</a>
                        </section>

                        <div className={styles.grid2}>
                            <article className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <strong>Domains</strong>
                                </div>

                                <div className={styles.skillsGrid}>
                                    {DOMAINS.map((domain) => (
                                        <div key={domain.id} className={styles.inlineCard}>
                                            <strong>{domain.label}</strong>
                                            {domain.deity ? <span>{domain.deity}</span> : null}
                                            <p>{domain.summary}</p>

                                            <label className={styles.checkboxRow}>
                                                <input
                                                    type={'checkbox'}
                                                    checked={proficientDomainIds.has(domain.id)}
                                                    onChange={() => {
                                                        const alreadyProficient = proficientDomainIds.has(domain.id);

                                                        if (alreadyProficient) {
                                                            onChange({
                                                                ...sheet,
                                                                domains: sheet.domains.filter((state) => state.id !== domain.id),
                                                            });
                                                            return;
                                                        }

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
                                                    }}
                                                />
                                                Proficient
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </article>

                            <article className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <strong>Knacks</strong>
                                    <button
                                        type={"button"}
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
                                            })
                                        }}
                                        >
                                        Add
                                    </button>
                                </div>

                                <div className={styles.stack}>
                                    {sheet.knacks.map((knack) => (
                                        <div key={knack.id} className={styles.inlineCard}>
                                            <input
                                                value={knack.name}
                                                onChange={(e) => {
                                                    onChange({
                                                        ...sheet,
                                                        knacks: sheet.knacks.map((entry) =>
                                                            entry.id === knack.id ? { ...entry, name: e.target.value } : entry
                                                        ),
                                                    })
                                                }}
                                                />
                                            <input
                                                value={knack.summary ?? ""}
                                                placeholder={"Summary"}
                                                onChange={(e) => {
                                                    onChange({
                                                        ...sheet,
                                                        knacks: sheet.knacks.map((entry) =>
                                                            entry.id === knack.id ? { ...entry, summary: e.target.value } : entry,
                                                        ),
                                                    })
                                                }}
                                                />
                                            <input
                                                value={knack.linkedSkills?.join(", ") ?? ""}
                                                placeholder={"Linked skills"}
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
                                                                } : entry,
                                                        ),
                                                    })
                                                }}
                                                />
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