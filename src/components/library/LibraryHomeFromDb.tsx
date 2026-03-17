import React, { useEffect, useState } from "react";
import LibraryHome from "./LibraryHome";
import type { CampaignRecord, CharacterSheetSummary } from "../../types/library";
import { listMyCampaigns, listMyCharacterSheets } from "../../lib/supabase/db";

export default function LibraryHomeFromDb() {
    const [characters, setCharacters] = useState<CharacterSheetSummary[]>([]);
    const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorText, setErrorText] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setErrorText(null);

                const [characterRows, campaignRows] = await Promise.all([
                    listMyCharacterSheets(),
                    listMyCampaigns(),
                ]);

                if (cancelled) return;
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

                if (cancelled) return;
                setErrorText(
                    error instanceof Error ? error.message : "Failed to load library."
                );
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return <main style={{ padding: "1.5rem" }}>Loading library…</main>;
    }

    if (errorText) {
        return <main style={{ padding: "1.5rem" }}>Error: {errorText}</main>;
    }

    return <LibraryHome characters={characters} campaigns={campaigns} />;
}