import React, { useMemo } from "react";
import type { CharacterSheetState } from "../../types/sheet.ts";
import styles from "./RollComposerDrawer.module.css";

type Props = {
  open: boolean;
  sheet: CharacterSheetState;
  onClose: () => void;
};

export default function RollComposerDrawer({ open, sheet, onClose }: Props) {
  const allSkills = useMemo(
    () =>
      sheet.potentials.flatMap((potential) =>
        potential.skills.map((skill) => ({
          value: `${potential.key}:${skill.name}`,
          label: `${potential.title} / ${skill.name}`,
        }))
      ),
    [sheet.potentials]
  );

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Roll composer">
      <div className={styles.backdrop} onClick={onClose} />

      <aside className={styles.drawer}>
        <header className={styles.header}>
          <div>
            <h2>Create Roll</h2>
            <p>Build the exact roll first, then hand it to your rules engine.</p>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            Close
          </button>
        </header>

        <div className={styles.formGrid}>
          <label>
            <span>Skill</span>
            <select>
              {allSkills.map((skill) => (
                <option key={skill.value} value={skill.value}>
                  {skill.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Knacks</span>
            <input type="text" placeholder="acrobatics, horseback riding" />
          </label>

          <label>
            <span>Domains</span>
            <input type="text" placeholder="Flow, Thread" />
          </label>

          <label>
            <span>Advantage state</span>
            <select>
              <option value="normal">Normal</option>
              <option value="advantage">Advantage</option>
              <option value="disadvantage">Disadvantage</option>
            </select>
          </label>

          <label>
            <span>Additional volatility dice</span>
            <input type="number" min={0} defaultValue={0} />
          </label>

          <label>
            <span>Riskiness level</span>
            <select>
              <option value="0">Uncertain</option>
              <option value="1">Risky</option>
              <option value="2">Dire</option>
              <option value="3">Desperate</option>
            </select>
          </label>
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.rollBtn}>
            Roll
          </button>
        </footer>
      </aside>
    </div>
  );
}
