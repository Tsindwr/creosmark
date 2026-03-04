import React, { useMemo } from "react";
import PotentialWidget, { type PotentialWidgetProps } from "./PotentialWidget.tsx";
import styles from "./PotentialsList.module.css";

const POTENTIAL_TITLES = [
    "MIGHT",
    "FINESSE",
    "NERVE",
    "SEEP",
    "INSTINCT",
    "WIT",
    "HEART",
    "TETHER",
] as const;

type PotentialsListProps = {
    tileMin?: number;
    tileMax?: number;
}

export default function PotentialsList({ tileMin = 150, tileMax = 210 }: PotentialsListProps) {
    const potentials = useMemo<PotentialWidgetProps[]>(
        () =>
            POTENTIAL_TITLES.map((title, i) => ({
                title,
                potentialValue: i + 1,
                stress: 0,
                resistance: 0,
                volatilityDieMax: 4,
                potentialCap: 12,
                volatilityCap: 12,
            })),
        []
    );

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
            {potentials.map((p) => (
                <div key={p.title} className={styles.tile}>
                    <PotentialWidget {...p} width={"100%"} height={"100%"} minWidth={tileMin} minHeight={tileMin} />
                </div>
            ))}
        </section>
    );
}