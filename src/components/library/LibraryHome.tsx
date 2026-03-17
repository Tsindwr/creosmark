import React, { useState } from "react";
import type { CampaignRecord, CharacterSheetSummary } from "../../types/library";
import CharacterSheetCard from "./CharacterSheetCard";
import CampaignCard from "./CampaignCard";
import styles from "./LibraryHome.module.css";

type HomeTab = "characters" | "campaigns" | "abilities";

type LibraryHomeProps = {
    characters: CharacterSheetSummary[];
    campaigns: CampaignRecord[];
};

export default function LibraryHome({
                                        characters,
                                        campaigns,
                                    }: LibraryHomeProps) {
    const [tab, setTab] = useState<HomeTab>("characters");

    return (
        <section className={styles.page}>
            <div className={styles.tabs}>
                <button
                    type="button"
                    className={`${styles.tab} ${tab === "characters" ? styles.tabActive : ""}`}
                    onClick={() => setTab("characters")}
                >
                    Character Sheets
                </button>

                <button
                    type="button"
                    className={`${styles.tab} ${tab === "campaigns" ? styles.tabActive : ""}`}
                    onClick={() => setTab("campaigns")}
                >
                    Campaigns
                </button>

                <button
                    type="button"
                    className={`${styles.tab} ${tab === "abilities" ? styles.tabActive : ""}`}
                    onClick={() => setTab("abilities")}
                >
                    Abilities
                </button>
            </div>

            {tab === "characters" ? (
                <section className={styles.grid}>
                    {characters.length > 0 ? (
                        characters.map((character) => (
                            <CharacterSheetCard key={character.id} character={character} />
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyEyebrow}>No character sheets yet</div>
                            <h2>Start your first sheet</h2>
                            <p>Your saved characters will appear here once they are created.</p>
                        </div>
                    )}
                </section>
            ) : null}

            {tab === "campaigns" ? (
                <section className={styles.grid}>
                    {campaigns.length > 0 ? (
                        campaigns.map((campaign) => (
                            <CampaignCard key={campaign.id} campaign={campaign} />
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyEyebrow}>No campaigns yet</div>
                            <h2>Create or join a campaign</h2>
                            <p>Your campaigns will appear here once they exist in the library.</p>
                        </div>
                    )}
                </section>
            ) : null}

            {tab === "abilities" ? (
                <section className={styles.emptyState}>
                    <div className={styles.emptyEyebrow}>Under Construction</div>
                    <h2>Ability Library</h2>
                    <p>This is where saved and built abilities will live.</p>
                </section>
            ) : null}
        </section>
    );
}