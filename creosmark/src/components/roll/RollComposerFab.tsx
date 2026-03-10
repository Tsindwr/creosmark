import React, { useMemo, useState } from "react";
import styles from "./RollComposerFab.module.css";
import type { PotentialState } from "../../types/sheet.ts";

type RollRequest = {
  potential: string;
  skill: string;
  mode: "normal" | "advantage" | "disadvantage";
  extraVolatility: number;
};

type RollComposerFabProps = {
  potentials: PotentialState[];
  onRoll?: (request: RollRequest) => void;
};

export default function RollComposerFab({ potentials, onRoll }: RollComposerFabProps) {
  const [open, setOpen] = useState(false);
  const [potentialKey, setPotentialKey] = useState(potentials[0]?.key ?? "might");
  const [skill, setSkill] = useState("");
  const [mode, setMode] = useState<RollRequest["mode"]>("normal");
  const [extraVolatility, setExtraVolatility] = useState(0);

  const selected = useMemo(
    () => potentials.find((potential) => potential.key === potentialKey) ?? potentials[0],
    [potentialKey, potentials],
  );

  const availableSkills = selected?.skills ?? [];

  return (
    <>
      <button type="button" className={styles.fab} onClick={() => setOpen((value) => !value)}>
        Roll
      </button>

      {open ? (
        <aside className={styles.drawer}>
          <header className={styles.header}>
            <div>
              <div className={styles.eyebrow}>Quick action</div>
              <h3 className={styles.title}>Compose a roll</h3>
            </div>
            <button type="button" className={styles.close} onClick={() => setOpen(false)}>
              ✕
            </button>
          </header>

          <label className={styles.field}>
            <span>Potential</span>
            <select value={potentialKey} onChange={(e) => setPotentialKey(e.target.value as PotentialState["key"])}>
              {potentials.map((potential) => (
                <option key={potential.key} value={potential.key}>
                  {potential.title}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Skill</span>
            <select value={skill} onChange={(e) => setSkill(e.target.value)}>
              <option value="">Choose a skill</option>
              {availableSkills.map((entry) => (
                <option key={entry.name} value={entry.name}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Advantage state</span>
            <select value={mode} onChange={(e) => setMode(e.target.value as RollRequest["mode"])}>
              <option value="normal">Normal</option>
              <option value="advantage">Advantage</option>
              <option value="disadvantage">Disadvantage</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>Additional volatility dice</span>
            <input
              type="number"
              min={0}
              max={5}
              value={extraVolatility}
              onChange={(e) => setExtraVolatility(Number(e.target.value) || 0)}
            />
          </label>

          <button
            type="button"
            className={styles.rollButton}
            onClick={() =>
              onRoll?.({
                potential: selected?.title ?? potentialKey,
                skill,
                mode,
                extraVolatility,
              })
            }
          >
            Roll
          </button>
        </aside>
      ) : null}
    </>
  );
}
