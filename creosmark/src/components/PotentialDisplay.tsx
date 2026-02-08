import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type PotentialKey = string;

export type PotentialState = {
    score: number;
    stress: number;
    resistance: number;
    // optional: volatility/perks later
};

export type PotentialDisplayProps = {
    potentials: Record<PotentialKey, PotentialState>;

    // counts for how many pips to show
    maxStress?: number;
    maxResistance?: number;

    // geometry
    size?: number; // svg width/height
    ringRadius?: number;
    nodeRadius?: number;

    // arcs: degrees (start -> end). Using same idea as your prototype: 225^o to -45^o
    startDeg?: number;
    endDeg?: number;

    // called with a "command" style payload so we can queue autosaves later
    onChange?: (cmd: {
        type:
            | 'stress.set'
            | 'stress.inc'
            | 'stress.dec'
            | 'resistance.set'
            | 'resistance.inc'
            | 'resistance.dec';
        potential: PotentialKey;
        value?: number;
    }) => void;
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function degToRad(deg: number) {
    return (deg * Math.PI) / 180;
}

function polar(cx: number, cy: number, r: number, deg: number) {
    const a = degToRad(deg);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function distributeAngles(keys: string[], startDeg: number, endDeg: number) {
    const n = keys.length;
    if (n === 1) return [{ key: keys[0], deg: (startDeg + endDeg) / 2 }];
    const step = (endDeg - startDeg) / (n - 1);
    return keys.map((key, i) => ({ key, deg: startDeg + step * i }));
}

/**
 * Long-press helper:
 * - PointerDown starts a timer
 * - If held beyond threshold => treat as "secondary action"
 * - PointerUp cancels
 */
function useLongPress(thresholdMs = 450) {
    const timer = useRef<number | null>(null);
    const [fired, setFired] = useState(false);

    const start = useCallback((fn: () => void) => {
        setFired(false);
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
            setFired(true);
            fn();
        }, thresholdMs);
    }, [thresholdMs]);

    const cancel = useCallback(() => {
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = null;
    }, []);

    return {start, cancel, fired};
}

export default function PotentialDisplay({
    potentials,
    size = 340,
    ringRadius = 120,
    nodeRadius = 10,
    startDeg = 2,
    endDeg = -45,
    onChange,
}: PotentialDisplayProps) {
    const keys = useMemo(() => Object.keys(potentials), [potentials]);

    const cx = size / 2;
    const cy = size / 2;

    // One ring position per Potential (i.e. 3 Potentials => 3 positions spaced evenly around the arc)
    const potentialAngles = useMemo(
        () => distributeAngles(keys, startDeg, endDeg),
        [keys, startDeg, endDeg]
    );

    // Interaction: decide whether you're editing stress or resistance at the node-level.
    // Easiest default;
    // - Left click/tap => stress inc
    // - Right click / long-press => stress dec
    // If you want resistance edits too, you can:
    // - shift+click => resistance inc
    // - shift+right-click / alt+click => resistance dec
    const applyInc = useCallback(
        (potential: PotentialKey, kind: 'stress' | 'resistance') => {
            if (!onChange) return;
            onChange({
                type: kind === 'stress' ? 'stress.inc' : 'resistance.inc',
                potential,
            });
        },
        [onChange]
    );

    const applyDec = useCallback(
        (potential: PotentialKey, kind: 'stress' | 'resistance') => {
            if (!onChange) return;
            onChange({
                type: kind === 'stress' ? 'stress.dec' : 'resistance.dec',
                potential,
            });
        },
        [onChange]
    );

    const { start: startLongPress, cancel: cancelLongPress, fired } = useLongPress(450);

    const styles = {
        ink: "var(--sunder-ink, #1a1a1a)",
        paper: "var(--sunder-paper, #f6f2e8)",
        frame: "var(--sunder-frame, #6b4ce6)",
        accent: "var(--sunder-accent, #e26b6b)",
        stress: "var(--sunder-stress, #e26b6b)",
        resist: "var(--sunder-resist, #4c8fd1)",
        empty: "var(--sunder-empty, rgba(0,0,0,0.12))",
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role={"group"}
            aria-label={"Potential display"}
            style={{ display: "block" }}
        >
            {/* Background */}
            <circle
                cx={cx}
                cy={cy}
                r={ringRadius + 34}
                fill={styles.paper}
                stroke={styles.frame}
                strokeWidth={3}
            />
            <circle
                cx={cx}
                cy={cy}
                r={ringRadius + 18}
                fill={"none"}
                stroke={styles.accent}
                strokeWidth={2}
                opacity={0.8}
            />

            {/* Center label */}
            <g>
                <circle
                    cx={cx}
                    cy={cy}
                    r={ringRadius * 0.45}
                    fill={"none"}
                    stroke={styles.frame}
                    strokeWidth={2}
                    opacity={0.35}
                />
                <text
                    x={cx}
                    y={cy - 6}
                    textAnchor={"middle"}
                    fontSize={14}
                    fill={styles.ink}
                    style={{ fontFamily: "var(--md-text-font, system-ui)" }}
                >
                    POTENTIALS
                </text>
                <text
                    x={cx}
                    y={cy + 14}
                    textAnchor={"middle"}
                    fontSize={11}
                    fill={styles.ink}
                    opacity={0.8}
                    style={{ fontFamily: "var(--md-text-font, system-ui)" }}
                >
                    click Stress+ • shift+click Resistance+
                </text>
            </g>

            {/* One node per Potential, each with its own slot ring */}
            {potentialAngles.map(({ key, deg }) => {
                const p = polar(cx, cy, ringRadius, deg);

                const st = potentials[key];
                const score = clamp(st?.score ?? 0, 0, 20);
                const stress = clamp(st?.stress ?? 0, 0, score);
                const resistance = clamp(st?.resistance ?? 0, 0, score - stress);

                // Slots: [0 .. score-1]
                // Stress occupies from left => indices 0 .. stress-1
                // Resistance occupies from right => indices score-resistance .. score-1
                const stressEnd = stress - 1;
                const resStart = score - resistance;

                const pipR = nodeRadius * 0.35;
                const pipOrbit = nodeRadius * 1.75;

                const label = `${key} (score ${score})`;
                const labelOffset = nodeRadius + 14;
                const lx = Math.cos(degToRad(deg)) * labelOffset;
                const ly = Math.sin(degToRad(deg)) * labelOffset;

                return (
                    <g
                        key={key}
                        transform={`translate(${p.x} ${p.y})`}
                        style={{ cursor: "pointer" }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            // right click => decrement (stress by default, shift => resistance)
                            if (e.shiftKey) applyDec(key, "resistance");
                            else applyDec(key, "stress");
                        }}
                        onPointerDown={(e) => {
                            (e.currentTarget as SVGGElement).setPointerCapture?.(e.pointerId);

                            // long-press => decrement (stress by default, shift => resistance)
                            // (pointer events don't always preserve modifier keys on mobile; shift is mostly desktop)
                            startLongPress(() => applyDec(key, e.shiftKey ? "resistance" : "stress"));
                        }}
                        onPointerUp={(e) => {
                            cancelLongPress();
                            if (fired) return;

                            // click => increment (stress by default , shift => resistance)
                            applyInc(key, e.shiftKey ? "resistance" : "stress");
                        }}
                        onPointerCancel={() => cancelLongPress()}
                        role={"button"}
                        aria-label={label}
                        tabIndex={0}
                        onKeyDown={(e) => {
                            // keyboard:
                            // Enter/Space => stress inc
                            // Shift+Enter/Space => resistance inc
                            // Delete/Backspace => stress dec
                            // Shift+Delete/Backspace => resistance dec
                            if (e.key === "Enter" || e.key === " ") {
                                applyInc(key, e.shiftKey ? "resistance" : "stress");
                            }
                            if (e.key === "Backspace" || e.key === "Delete") {
                                applyDec(key, e.shiftKey ? "resistance" : "stress");
                            }
                        }}
                    >
                        {/* Main node "badge" */}
                        <circle r={nodeRadius + 3} fill={styles.paper} stroke={styles.frame} strokeWidth={2.5} />
                        <circle r={nodeRadius - 2} fill={styles.frame} opacity={0.08} />

                        {/* Name label */}
                        <text
                            x={lx}
                            y={ly}
                            textAnchor={Math.cos(degToRad(deg)) > 0.2 ? "start"
                                        : Math.cos(degToRad(deg)) < -0.2 ? "end"
                                        : "middle"}
                            dominantBaseline={"middle"}
                            fontSize={11}
                            fill={styles.ink}
                            style={{ fontFamily: "var(--md-text-font, system-ui)" }}
                        >
                            {key}
                        </text>

                        {/* Slot ring: score slots, filled from both ends */}
                        {Array.from({ length: score }).map((_, i) => {
                            // Spread slots symmetrically around the node's angle.
                            const arcSpan = Math.min(140, score * 14); // degrees
                            const start = deg - arcSpan / 2;
                            const step = arcSpan / Math.max(1, score - 1);

                            const pipDeg = start + i * step;

                            const px = pipOrbit * Math.cos(degToRad(pipDeg));
                            const py = pipOrbit * Math.sin(degToRad(pipDeg));

                            const isStress = i <= stressEnd;
                            const isResist = i >= resStart; // fills from right
                            const isFilled = isStress || isResist;

                            const fill = isStress ? styles.stress : isResist ? styles.resist : "transparent";
                            const stroke = isStress
                                ? styles.stress
                                : isResist
                                ? styles.resist
                                : styles.empty;

                            return (
                                <circle
                                    key={i}
                                    cx={px}
                                    cy={py}
                                    r={pipR}
                                    fill={fill}
                                    stroke={stroke}
                                    strokeWidth={1}
                                    opacity={isFilled ? 0.95 : 0.35}
                                />
                            );
                        })}
                    </g>
                );
            })}
        </svg>
    );
}

