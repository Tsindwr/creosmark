import React, { useState } from "react";
import type { CharacterSheetState } from "../../types/sheet.ts";
import { SHEET_TABS, type SheetTabId } from "../../lib/sheet-data.ts";
import SectionTabs from "./SectionTabs.tsx";
import OverviewSection from "../sections/OverviewSection.tsx";
import PotentialsList from "../potentials/PotentialsList.tsx";
import RollComposerFab from "../roll/RollComposerFab.tsx";
import SheetCard from "../common/SheetCard.tsx";
import styles from "./CharacterSheetShell.module.css";

type CharacterSheetShellProps = {
  initialSheet: CharacterSheetState;
};

function Placeholder({ title, copy }: { title: string; copy: string }) {
  return (
    <SheetCard title={title} eyebrow="Coming next">
      <p className={styles.placeholder}>{copy}</p>
    </SheetCard>
  );
}

export default function CharacterSheetShell({ initialSheet }: CharacterSheetShellProps) {
  const [sheet, setSheet] = useState(initialSheet);
  const [activeTab, setActiveTab] = useState<SheetTabId>("overview");

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div>
          {sheet.header.partyName ? <div className={styles.party}>{sheet.header.partyName}</div> : null}
          <h1 className={styles.name}>{sheet.header.name}</h1>
          <div className={styles.meta}>
            <span>{sheet.header.archetype}</span>
            <span>{sheet.header.origin}</span>
          </div>
        </div>

        <div className={styles.sideMeta}>
          <div className={styles.badge}>Player · {sheet.header.playerName}</div>
          <div className={styles.badge}>Level {sheet.header.level}</div>
          {sheet.header.tier ? <div className={styles.badge}>Tier {sheet.header.tier}</div> : null}
        </div>
      </header>

      <SectionTabs tabs={SHEET_TABS} activeTab={activeTab} onChange={(id) => setActiveTab(id as SheetTabId)} />

      <main className={styles.content}>
        {activeTab === "overview" ? <OverviewSection sheet={sheet} onChange={setSheet} /> : null}

        {activeTab === "potentials" ? (
          <PotentialsList
            potentials={sheet.potentials}
            onChange={(potentials) => setSheet({ ...sheet, potentials })}
            tileMin={155}
            tileMax={215}
          />
        ) : null}

        {activeTab === "actions" ? (
          <Placeholder
            title="Actions"
            copy="This tab is ready for the attacks list, built abilities, and default action cards."
          />
        ) : null}

        {activeTab === "abilities" ? (
          <Placeholder
            title="Abilities"
            copy="Use this space next for the big ability browser and card detail panel."
          />
        ) : null}

        {activeTab === "inventory" ? (
          <Placeholder
            title="Inventory"
            copy="The page 2 equipment area can become an equipment manager with armor locations and carried items."
          />
        ) : null}

        {activeTab === "background" ? (
          <Placeholder
            title="Background"
            copy="Origin, goals, flaws, knacks, and domains belong here once those editors are built."
          />
        ) : null}

        {activeTab === "notes" ? (
          <Placeholder
            title="Notes"
            copy="Use this tab for campaign notes, reminders, and fallout history."
          />
        ) : null}
      </main>

      <RollComposerFab
        potentials={sheet.potentials}
        onRoll={(request) => {
          console.log("ROLL REQUEST", request);
        }}
      />
    </div>
  );
}
