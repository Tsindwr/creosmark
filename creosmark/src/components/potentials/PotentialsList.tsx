import React from "react";
import PotentialWidget from "./PotentialWidget.tsx";
import styles from "./PotentialsList.module.css";
import type { PotentialState } from "../../types/sheet.ts";

type PotentialsListProps = {
  potentials: PotentialState[];
  onChange?: (next: PotentialState[]) => void;
  tileMin?: number;
  tileMax?: number;
};

export default function PotentialsList({
  potentials,
  onChange,
  tileMin = 150,
  tileMax = 210,
}: PotentialsListProps) {
  return (
    <section
      className={styles.grid}
      style={
        {
          ["--tile-min" as any]: `${tileMin}px`,
          ["--tile-max" as any]: `${tileMax}px`,
        } as React.CSSProperties
      }
    >
      {potentials.map((potential) => (
        <div key={potential.key} className={styles.tile}>
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
            minWidth={tileMin}
            minHeight={tileMin}
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
      ))}
    </section>
  );
}
