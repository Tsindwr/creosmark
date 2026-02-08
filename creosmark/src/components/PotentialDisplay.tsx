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
        maxStress = 4,
        maxResistance = 4,
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

        // Left half = stress, Right half = resistance
        const stressKeys = useMemo(() => keys.slice(0, Math.ceil(keys.length / 2)), [keys]);
        const resKeys = useMemo(() => keys.slice(Math.ceil(keys.length / 2)), [keys]);


    }