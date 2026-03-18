import React, { useEffect, useState } from "react";
import LibraryHome from "./LibraryHome";
import type { CampaignRecord, CharacterSheetSummary } from "../../types/library";
import {
    listMyCampaigns,
    listMyCharacterSheets,
    createCharacterSheet,
    createBlankSheet,
    createCampaignWithMembership,
    joinCampaignByCode
} from "../../lib/supabase/db";
import styles from './LibraryHomeFromDb.module.css';

export default function LibraryHomeFromDb() {
    const [characters, setCharacters] = useState<CharacterSheetSummary[]>([]);
    const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorText, setErrorText] = useState<string | null>(null);
    const [joinCode, setJoinCode] = useState("");
    const [busy, setBusy] = useState(false);

    async function load() {
        try {
            setLoading(true);
            setErrorText(null);

            const [characterRows, campaignRows] = await Promise.all([
                listMyCharacterSheets(),
                listMyCampaigns(),
            ]);

            setCharacters(characterRows);
            setCampaigns(campaignRows);
        } catch (error) {
            console.error("Failed to load library:", error);

            if (error && typeof error === "object") {
                const anyError = error as Record<string, unknown>;
                console.error("Error details:", {
                    message: anyError.message,
                    code: anyError.code,
                    details: anyError.details,
                    hint: anyError.hint,
                });
            }

            setErrorText(
                error instanceof Error ? error.message : "Failed to load library."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    async function handleCreateCharacter() {
        try {
            setBusy(true);
            const row = await createCharacterSheet(createBlankSheet());
            window.location.href = `/characters/${row.id}/edit`;
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Failed to create character.");
        } finally {
            setBusy(false);
        }
    }

    async function handleCreateCampaign() {
        const name = window.prompt("Campaign name?");
        if (!name?.trim()) return;

        try {
            setBusy(true);
            const campaign = await createCampaignWithMembership({ name: name.trim() });
            window.location.href = `/characters/${campaign.id}`;
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Failed to create campaign.");
        } finally {
            setBusy(false);
        }
    }

    async function handleJoinCampaign(event: React.FormEvent) {
        event.preventDefault();
        if (!joinCode.trim()) return;

        try {
            setBusy(true);
            const campaign = await joinCampaignByCode(joinCode);
            setJoinCode("");
            window.location.href = `/campaigns/${campaign.id}`;
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Failed to join campaign.");
        } finally {
            setBusy(false);
        }
    }

    if (loading) {
        return <main className={styles.state}>Loading library…</main>;
    }

    return (
        <div className={styles.page}>
            <section className={styles.actionsCard}>
                <div className={styles.actionsHeader}>
                    <div>
                        <div className={styles.eyebrow}>Quick Actions</div>
                        <h2>Build or join</h2>
                    </div>
                </div>

                <div className={styles.actionsRow}>
                    <button type={'button'} className={styles.primary} onClick={handleCreateCharacter} disabled={busy}>
                        New Character
                    </button>

                    <button type={'button'} className={styles.secondary} onClick={handleCreateCampaign} disabled={busy}>
                        New Campaign
                    </button>

                    <form className={styles.joinForm} onSubmit={handleJoinCampaign}>
                        <input
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder={"Join code"}
                        />
                        <button type={'submit'} className={styles.secondary} disabled={busy}>
                            Join Campaign
                        </button>
                    </form>
                </div>
            </section>

            {errorText ? <div className={styles.error}>Error: {errorText}</div> : null}

            <LibraryHome characters={characters} campaigns={campaigns} />
        </div>
    );
}