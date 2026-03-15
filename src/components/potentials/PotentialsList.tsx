import React from "react";
import PotentialWidget from "./PotentialWidget.tsx";
import styles from "./PotentialsList.module.css";
import type { PotentialState, PotentialKey } from "../../types/sheet.ts";

type PotentialsListProps = {
  potentials: PotentialState[];
  onChange?: (next: PotentialState[]) => void;
  onStartRoll?: (seed: { potentialKey: PotentialKey; skillName: string}) => void;
};

export default function PotentialsList({
  potentials,
  onChange,
  onStartRoll
}: PotentialsListProps) {
  return (
    <section className={styles.grid}>
      {potentials.map((potential) => (
          <article key={potential.key} className={styles.card}>
            <div className={styles.widgetWrap}>
              <PotentialWidget
                title={potential.title}
                potentialValue={potential.score}
                stress={potential.stress}
                resistance={potential.resistance}
                volatilityDieMax={potential.volatilityDieMax}
                charged={potential.charged}
                volatilityPerks={potential.perks}
                width="100%"
                height="100%"
                onChange={
                  onChange
                    ? (next) =>
                        onChange(
                          potentials.map((entry) =>
                            entry.key === potential.key ? { ...entry, ...next } : entry,
                          ),
                        )
                    : undefined
                }
              />
            </div>

            <div className={styles.skillsCol}>
              {potential.skills.map((skill) => (
                  <button
                      key={skill.name}
                      type={"button"}
                      className={styles.skillRow}
                      onClick={() =>
                        onStartRoll?.({
                          potentialKey: potential.key,
                          skillName: skill.name,
                        })
                      }
                  >
                    <div className={styles.skillMain}>
                      <div className={styles.skillTopLine}>
                        <strong>{skill.name}</strong>
                        {skill.proficient ? <span className={styles.badge}>Prof.</span> : null}
                      </div>
                      <p>{skill.summary}</p>
                    </div>
                    <span className={styles.rollHint}>Roll</span>
                  </button>
              ))}
            </div>
          </article>
      ))}
    </section>
  );
}
