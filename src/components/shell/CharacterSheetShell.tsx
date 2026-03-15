import React, { useState } from "react";
import type {
    CharacterSheetState,
    PotentialKey,
    RollComposerDraft,
} from "../../types/sheet.ts";
import { SHEET_TABS, type SheetTabId } from "../../lib/sheet-data.ts";
import { createDraftFromSkill } from "../../lib/rolls.ts";
import SectionTabs from "./SectionTabs.tsx";
import OverviewSection from "../sections/OverviewSection.tsx";
import PotentialsList from "../potentials/PotentialsList.tsx";
import RollComposerFab from "../roll/RollComposerFab.tsx";
import SheetCard from "../common/SheetCard.tsx";
import AttacksPanel from "../attacks/AttacksPanel.tsx";
import GoalsPanel from "../story/GoalsPanel.tsx";
import KnacksDomainsPanel from "../story/KnacksDomainsPanel.tsx";
import InventoryPanel from "../iventory/InventoryPanel.tsx";
import DiceRoller from "../roll/DiceRoller.tsx";
import type { TestResult } from "../../lib/rolling/types.ts";
import styles from "./CharacterSheetShell.module.css";
import {buildTestStateFromDraft} from "../roll/rollDisplay.ts";

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

export default function CharacterSheetShell({
    initialSheet
}: CharacterSheetShellProps) {
  const [sheet, setSheet] = useState(initialSheet);
  const [activeTab, setActiveTab] = useState<SheetTabId>("overview");
  const [rollBuilderSeed, setRollBuilderSeed] =
    useState<Partial<RollComposerDraft> | null>(null);
  const [activeRollRequest, setActiveRollRequest] =
    useState<RollComposerDraft | null>(null);
  const [pendingResolvedRoll, setPendingResolvedRoll] =
    useState<TestResult | null>(null);

  const seedRoll = (seed: { potentialKey: PotentialKey; skillName: string }) => {
      setRollBuilderSeed({
          potentialKey: seed.potentialKey,
          skillName: seed.skillName,
      });
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={"header-wrapper"}>
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
            onStartRoll={seedRoll}
          />
        ) : null}

        {activeTab === "actions" ? (
          <AttacksPanel attacks={sheet.attacks} onStartRoll={seedRoll} />
        ) : null}

        {activeTab === "abilities" ? (
          <Placeholder
            title="Abilities"
            copy="Use this space next for the big ability browser and card detail panel."
          />
        ) : null}

        {activeTab === "inventory" ? (
          <InventoryPanel
            inventory={sheet.inventory}
            onChange={(inventory) => setSheet({ ...sheet, inventory })}
          />
        ) : null}

        {activeTab === "background" ? (
          <div className={styles.storyLayout}>
              <GoalsPanel goals={sheet.goals}
                          onChange={(goals) => setSheet({ ...sheet, goals })}
                          />
              <KnacksDomainsPanel domains={sheet.domains} knacks={sheet.knacks} />
          </div>
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
        domains={sheet.domains}
        knacks={sheet.knacks}
        initialDraft={rollBuilderSeed}
        onDraftConsumed={() => setRollBuilderSeed(null)}
        onRoll={(request) => {
          setActiveRollRequest(request);
        }}
      />

      <DiceRoller
        sheet={sheet}
        request={activeRollRequest}
        onClose={() => setActiveRollRequest(null)}
        onResolved={(result) => {
            setPendingResolvedRoll(result);
            console.log("SUNDER ROLL RESULT", result);
        }}
      />
    </div>
  );
}
