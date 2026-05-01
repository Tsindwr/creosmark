import React, { useEffect, useMemo, useState } from "react";
import SheetCard from "../common/SheetCard.tsx";
import {
    getAbilityReferenceById,
    searchAbilityReferences,
    type AbilityReferenceSummary,
} from "../../infrastructure";
import styles from "./CharacterAbilitiesPanel.module.css";

type CharacterAbilitiesPanelProps = {
    abilityIds: string[];
    onChange: (next: string[]) => void;
};

type CachedAbilityById = Record<string, AbilityReferenceSummary | null>;

export default function CharacterAbilitiesPanel({
    abilityIds,
    onChange,
}: CharacterAbilitiesPanelProps) {
    const [searchText, setSearchText] = useState("");
    const [searchRows, setSearchRows] = useState<AbilityReferenceSummary[]>([]);
    const [cachedById, setCachedById] = useState<CachedAbilityById>({});
    const [loadingSearchRows, setLoadingSearchRows] = useState(false);
    const [errorText, setErrorText] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const timeout = window.setTimeout(async () => {
            try {
                setLoadingSearchRows(true);
                setErrorText(null);

                const rows = await searchAbilityReferences({
                    searchText,
                    limit: 250,
                });

                if (cancelled) return;
                setSearchRows(rows);
            } catch (error) {
                if (cancelled) return;
                setErrorText(
                    error instanceof Error
                        ? error.message
                        : "Failed to load ability references.",
                );
            } finally {
                if (!cancelled) {
                    setLoadingSearchRows(false);
                }
            }
        }, 180);

        return () => {
            cancelled = true;
            window.clearTimeout(timeout);
        };
    }, [searchText]);

    const searchRowsById = useMemo(() => {
        const map = new Map<string, AbilityReferenceSummary>();
        for (const row of searchRows) {
            map.set(row.id, row);
        }
        return map;
    }, [searchRows]);

    useEffect(() => {
        const missingIds = abilityIds.filter(
            (abilityId) => !searchRowsById.has(abilityId) && !(abilityId in cachedById),
        );
        if (missingIds.length === 0) return;

        let cancelled = false;

        async function loadMissing() {
            const resolved = await Promise.all(
                missingIds.map(async (abilityId) => {
                    try {
                        const row = await getAbilityReferenceById(abilityId);
                        return [abilityId, row] as const;
                    } catch {
                        return [abilityId, null] as const;
                    }
                }),
            );

            if (cancelled) return;

            setCachedById((current) => {
                const next = { ...current };
                for (const [abilityId, row] of resolved) {
                    next[abilityId] = row;
                }
                return next;
            });
        }

        void loadMissing();

        return () => {
            cancelled = true;
        };
    }, [abilityIds, cachedById, searchRowsById]);

    const attachedIdSet = useMemo(() => new Set(abilityIds), [abilityIds]);

    const attachedRows = useMemo(
        () =>
            abilityIds.map((abilityId) => ({
                abilityId,
                row: searchRowsById.get(abilityId) ?? cachedById[abilityId] ?? null,
            })),
        [abilityIds, cachedById, searchRowsById],
    );

    const availableRows = useMemo(
        () => searchRows.filter((row) => !attachedIdSet.has(row.id)),
        [attachedIdSet, searchRows],
    );

    function attachAbility(abilityId: string) {
        if (attachedIdSet.has(abilityId)) return;
        onChange([...abilityIds, abilityId]);
    }

    function detachAbility(abilityId: string) {
        onChange(abilityIds.filter((id) => id !== abilityId));
    }

    return (
        <SheetCard title="Abilities" eyebrow="Character Loadout">
            <div className={styles.stack}>
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>Attached</div>

                    {abilityIds.length === 0 ? (
                        <div className={styles.state}>No abilities attached yet.</div>
                    ) : (
                        <div className={styles.list}>
                            {attachedRows.map(({ abilityId, row }) => (
                                <article key={abilityId} className={styles.row}>
                                    <div className={styles.rowMain}>
                                        <strong>{row?.title ?? `Ability ${abilityId.slice(0, 8)}`}</strong>
                                        <span>
                                            {row
                                                ? `${row.abilityKind} · ${row.experienceCost}`
                                                : abilityId}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        className={styles.removeButton}
                                        onClick={() => detachAbility(abilityId)}
                                    >
                                        Remove
                                    </button>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>Attach Ability</div>

                    <input
                        className={styles.searchInput}
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        placeholder="Search published or owned abilities..."
                    />

                    {errorText ? <div className={styles.state}>Error: {errorText}</div> : null}
                    {loadingSearchRows ? <div className={styles.state}>Loading abilities…</div> : null}

                    {!loadingSearchRows && availableRows.length === 0 ? (
                        <div className={styles.state}>No matching abilities to attach.</div>
                    ) : null}

                    {!loadingSearchRows && availableRows.length > 0 ? (
                        <div className={styles.list}>
                            {availableRows.map((row) => (
                                <article key={row.id} className={styles.row}>
                                    <div className={styles.rowMain}>
                                        <strong>{row.title}</strong>
                                        <span>{`${row.abilityKind} · ${row.experienceCost}`}</span>
                                    </div>

                                    <button
                                        type="button"
                                        className={styles.attachButton}
                                        onClick={() => attachAbility(row.id)}
                                    >
                                        Attach
                                    </button>
                                </article>
                            ))}
                        </div>
                    ) : null}
                </section>
            </div>
        </SheetCard>
    );
}
