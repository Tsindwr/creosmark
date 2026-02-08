import React, { useState } from 'react';
import PotentialDisplay, { type PotentialState } from "./PotentialDisplay";

export default function PotentialShell() {
    const [potentials, setPotentials] = useState<Record<string, PotentialState>>({
        Might: { stress: 1, resistance: 2, score: 8 },
        Finesse: { stress: 0, resistance: 3, score:  7 },
        Nerve: { stress: 2, resistance: 1, score: 6 },
        Seep: { stress: 0, resistance: 0, score: 1 },
        Instinct: { stress: 1, resistance: 1, score: 2 },
        Wit: { stress: 3, resistance: 0, score: 5 },
        Heart: { stress: 0, resistance: 2, score: 3 },
        Tether: { stress: 4, resistance: 0, score: 4 }
    });

    return (
        <PotentialDisplay
            potentials={potentials}
            onChange={(cmd) => {
                setPotentials((prev) => {
                    const cur = prev[cmd.potential];
                    if (!cur) return prev;

                    const next = { ...prev };
                    if (cmd.type === "stress.inc") next[cmd.potential] = { ...cur, stress: cur.stress + 1 };
                    if (cmd.type === "stress.dec") next[cmd.potential] = { ...cur, stress: Math.max(0, cur.stress - 1) };
                    if (cmd.type === "resistance.inc") next[cmd.potential] = { ...cur, resistance: cur.resistance + 1 };
                    if (cmd.type === "resistance.dec") next[cmd.potential] = { ...cur,  resistance: Math.max(0, cur.resistance - 1) };
                    return next;
                });

                // later: push cmd into your "save queue"
                // queueCommand(cmd);
            }}
        />
    );
}