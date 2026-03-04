import React, { useMemo } from "react";

/**
 * PotentialWidget.tsx (visual-first)
 * ----------------------------------
 * Fixes:
 * 1) Arc span: use a 240° horseshoe (start 150°, end 30°) so nodes don’t overlap.
 * 2) Title placement: anchor title near bottom of the SVG so it doesn’t clip.
 * 3) Radii + node sizes: tuned so inner ring looks like linked beads, outer ring like spaced beads.
 * 4) Connector coloring: connectors turn grey when connecting into disabled nodes.
 */

/* ----------------------------- Types ----------------------------- */

export type PerkMark = {
    label?: string;
    color?: string;
};

export type PotentialWidgetProps = {
    title: string;

    /** Potential value = number of usable inner nodes (dark). */
    potentialValue: number;

    /** Filled within the usable nodes: stress from CLOCKWISE end, resistance from COUNTERCLOCKWISE end. */
    stress: number;
    resistance: number;

    /** Outer active nodes = volatilityDieMax - 1 */
    volatilityDieMax: number;

    /** Optional perk marks on outer ring (index -> mark) */
    volatilityPerks?: Record<number, PerkMark>;

    /** Visual sizing */
    size?: number;

    /** Soft caps for how many nodes exist on each ring */
    potentialCap?: number;
    volatilityCap?: number;

    /** Arc definition (degrees). Defaults tuned to match reference sketch. */
    startDeg?: number;
    endDeg?: number;

    /** Optional override radii */
    innerRadius?: number;
    outerRadius?: number;

    /** Optional override node radii */
    innerNodeR?: number;
    outerNodeR?: number;

    width?: number | string;
    height?: number | string;
    maxWidth?: number | string;
    maxHeight?: number | string;
    minWidth?: number | string;
    minHeight?: number | string;

    /** internal coordinate space (leave at 420 unless we redesign) */
    designSize?: number;

    /** if true, SVG preserves aspect ratio and fits inside bounds */
    preserveAspect?: "xMidYMid meet" | "xMidYMid slice" | "none";
};

/* ----------------------------- Theme tokens ----------------------------- */

const TOKENS = {
    ink: "var(--sunder-ink, #111111)",
    purple: "var(--sunder-purple, #6b4ce6)",
    gold: "var(--sunder-gold, #d2b24c)",
    paper: "var(--sunder-paper, #ffffff)",

    nodeActiveStroke: "var(--sunder-node-active, #111111)",
    nodeDisabledStroke: "var(--sunder-node-disabled, #b8b8b8)",

    stressFill: "var(--sunder-stress-fill, #6b4ce6)", // purple
    resistFill: "var(--sunder-resist-fill, #d2b24c)", // gold

    connectorActive: "var(--sunder-connector, #111111)",
    connectorDisabled: "var(--sunder-connector-disabled, #9e9e9e)",
};

/* ----------------------------- Geometry helpers ----------------------------- */

type Point = { x: number; y: number };

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const degToRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Standard polar-to-Cartesian for SVG:
 * - 0° = right
 * - 90° = down
 * - 180° = left
 * - 270° = up
 *
 * Because +Y is down in SVG, increasing degrees moves clockwise visually.
 */
function polar(cx: number, cy: number, r: number, deg: number): Point {
    const a = degToRad(deg);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/**
 * Angles distributed along an arc from startDeg to endDeg.
 * If endDeg < startDeg, we assume the arc crosses 0° and we add 360° to endDeg.
 *
 * Example (what we WANT): start=150, end=30
 * 30 < 150 => end becomes 390
 * span = 390-150 = 240 degrees  ✅ horseshoe
 */
function anglesForArc(count: number, startDeg: number, endDeg: number): number[] {
    if (count <= 1) return [startDeg];

    const end = endDeg < startDeg ? endDeg + 360 : endDeg;
    const step = (end - startDeg) / (count - 1);

    const out: number[] = [];
    for (let i = 0; i < count; i++) out.push(startDeg + step * i);
    return out;
}

/** Pull line endpoints inward so the connector doesn’t intrude into the circles. */
function shortenSegment(a: Point, b: Point, shrink: number): { a: Point; b: Point } {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    return {
        a: { x: a.x + ux * shrink, y: a.y + uy * shrink },
        b: { x: b.x - ux * shrink, y: b.y - uy * shrink },
    };
}

/* ----------------------------- Nodes ----------------------------- */

function PotentialTrackNode(props: {
    cx: number;
    cy: number;
    r: number;
    state: "disabled" | "empty" | "stress" | "resistance";
}) {
    const { cx, cy, r, state } = props;

    const disabled = state === "disabled";
    const stroke = disabled ? TOKENS.nodeDisabledStroke : TOKENS.nodeActiveStroke;

    const fill =
        state === "stress"
            ? TOKENS.stressFill
            : state === "resistance"
                ? TOKENS.resistFill
                : TOKENS.paper;

    const opacity = disabled ? 0.55 : 1;

    return (
        <circle
            cx={cx}
            cy={cy}
            r={r}
            fill={fill}
            stroke={stroke}
            strokeWidth={4}
            opacity={opacity}
        />
    );
}

function VolatilityPerkNode(props: {
    cx: number;
    cy: number;
    r: number;
    active: boolean;
    perk?: PerkMark;
}) {
    const { cx, cy, r, active, perk } = props;

    const stroke = active ? TOKENS.nodeActiveStroke : TOKENS.nodeDisabledStroke;
    const opacity = active ? 1 : 0.55;

    const markerR = r * 0.45;

    return (
        <g opacity={opacity}>
            <circle cx={cx} cy={cy} r={r} fill={TOKENS.paper} stroke={stroke} strokeWidth={4} />

            {perk?.color ? <circle cx={cx} cy={cy} r={markerR} fill={perk.color} opacity={0.85} /> : null}

            {perk?.label ? (
                <text
                    x={cx}
                    y={cy + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={Math.max(9, r * 0.95)}
                    fill={TOKENS.ink}
                    style={{ fontFamily: "var(--md-text-font, system-ui)", fontWeight: 800 }}
                >
                    {perk.label}
                </text>
            ) : null}
        </g>
    );
}

/* ----------------------------- ArcTrack ----------------------------- */

/**
 * ArcTrack renders:
 * - optional connectors between adjacent nodes
 * - then nodes at points along the arc
 *
 * We allow the caller to style each connector segment (for active vs disabled look).
 */
function ArcTrack(props: {
    center: Point;
    radius: number;
    count: number;
    startDeg: number;
    endDeg: number;

    connect?: boolean;
    connectorShrink?: number;
    connectorWidth?: number;

    /** segment index -> {stroke, opacity} */
    connectorStyle?: (segmentIndex: number) => { stroke: string; opacity?: number };

    renderNode: (args: { index: number; deg: number; p: Point }) => React.ReactNode;
}) {
    const {
        center,
        radius,
        count,
        startDeg,
        endDeg,
        connect = false,
        connectorShrink = 14,
        connectorWidth = 8,
        connectorStyle,
        renderNode,
    } = props;

    const angles = useMemo(() => anglesForArc(count, startDeg, endDeg), [count, startDeg, endDeg]);
    const points = useMemo(
        () => angles.map((deg) => polar(center.x, center.y, radius, deg)),
        [angles, center.x, center.y, radius]
    );

    return (
        <g>
            {/* Connectors first (behind nodes) */}
            {connect
                ? points.slice(0, -1).map((p1, i) => {
                    const p2 = points[i + 1];
                    const seg = shortenSegment(p1, p2, connectorShrink);

                    const style = connectorStyle?.(i) ?? { stroke: TOKENS.connectorActive, opacity: 0.9 };

                    return (
                        <line
                            key={`seg-${i}`}
                            x1={seg.a.x}
                            y1={seg.a.y}
                            x2={seg.b.x}
                            y2={seg.b.y}
                            stroke={style.stroke}
                            strokeWidth={connectorWidth}
                            strokeLinecap="round"
                            opacity={style.opacity ?? 0.9}
                        />
                    );
                })
                : null}

            {/* Nodes */}
            {points.map((p, index) => (
                <g key={`node-${index}`}>{renderNode({ index, deg: angles[index], p })}</g>
            ))}
        </g>
    );
}

/* ----------------------------- Main widget ----------------------------- */

export default function PotentialWidget({
    title,
    potentialValue,
    stress,
    resistance,
    volatilityDieMax,
    volatilityPerks = {},

    potentialCap = 12,
    volatilityCap = 12,

    // ✅ KEY FIX: 150 -> 30 is a 240° arc (leaves a bottom gap)
    startDeg = 150,
    endDeg = 30,

    // If not overridden, compute radii from size for consistent spacing.
    innerRadius,
    outerRadius,

    innerNodeR = 15,
    outerNodeR = 13,

    width = "100%",
    height = "auto",
    maxWidth,
    maxHeight,
    minWidth,
    minHeight,
    designSize = 420,
    preserveAspect = "xMidYMid meet",
}: PotentialWidgetProps) {
    const size = designSize;

    /**
     * Layout: put the center slightly ABOVE true middle so the title fits comfortably.
     * (Previous title was off-canvas; this avoids that.)
     */
    const cx = size / 2;
    const cy = size * 0.46;

    const center: Point = { x: cx, y: cy };

    // Derived radii (tuned to resemble the reference)
    const innerR = innerRadius ?? size * 0.28; // ~118 when size=420
    const outerR = outerRadius ?? innerR + innerNodeR + outerNodeR + size * 0.06; // comfortable gap

    /* -------------------- INNER ring fill rules -------------------- */

    const activeSlots = clamp(potentialValue, 0, potentialCap);

    // Clamp fills so visuals never exceed usable nodes.
    const resistCount = clamp(resistance, 0, activeSlots);
    const stressCount = clamp(stress, 0, activeSlots - resistCount);

    // Resistance occupies from CCW/start (low indices)
    // Stress occupies from CW/end (high indices)
    const stressStartIndex = activeSlots - stressCount;

    /* -------------------- OUTER ring active range -------------------- */

    const outerActiveSlots = clamp(volatilityDieMax - 1, 0, volatilityCap);

    /* -------------------- Typography positions -------------------- */

    // Place title safely within canvas, near bottom
    const titleY = size - 44;

    // Center score sits in the ring area
    const scoreY = cy + 6;


    return (
        <svg
            viewBox={`0 0 ${size} ${size}`}
            width={typeof width === "number" ? `${width}px` : width}
            height={height === "auto" ? undefined : typeof height === "number" ? `${height}px` : height}
            preserveAspectRatio={preserveAspect}
            // viewBox={`0 0 ${size} ${size}`}
            // role="img"
            aria-label={`${title} potential widget`}
            style={{
                display: "block",
                background: "transparent",
                width: typeof width === "number" ? `${width}px` : width,
                height: height === "auto" ? "auto" : typeof height === "number" ? `${height}px` : height,
                maxWidth: maxWidth ? (typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth) : undefined,
                maxHeight: maxHeight ? (typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight) : undefined,
                minWidth: minWidth ? (typeof minWidth === "number" ? `${minWidth}px` : minWidth) : undefined,
                minHeight: minHeight ? (typeof minHeight === "number" ? `${minHeight}px` : minHeight) : undefined,
            }}
        >
            {/* OUTER ARC: volatility perk nodes (separate beads) */}
            <ArcTrack
                center={center}
                radius={outerR}
                count={volatilityCap}
                startDeg={startDeg}
                endDeg={endDeg}
                connect={false}
                renderNode={({ index, p }) => (
                    <VolatilityPerkNode
                        cx={p.x}
                        cy={p.y}
                        r={outerNodeR}
                        active={index < outerActiveSlots}
                        perk={volatilityPerks[index]}
                    />
                )}
            />

            {/* INNER ARC: potential track nodes (linked chain) */}
            <ArcTrack
                center={center}
                radius={innerR}
                count={potentialCap}
                startDeg={startDeg}
                endDeg={endDeg}
                connect={true}
                connectorWidth={innerNodeR * 0.55} // scale connector thickness with node size
                connectorShrink={innerNodeR + 3} // keeps lines out of circle interiors
                connectorStyle={(segIndex) => {
                    // A connector segment joins node segIndex -> segIndex+1.
                    // If either endpoint is disabled, render the connector grey.
                    const aEnabled = segIndex < activeSlots;
                    const bEnabled = segIndex + 1 < activeSlots;
                    const enabled = aEnabled && bEnabled;

                    return enabled
                        ? { stroke: TOKENS.connectorActive, opacity: 0.92 }
                        : { stroke: TOKENS.connectorDisabled, opacity: 0.55 };
                }}
                renderNode={({ index, p }) => {
                    if (index >= activeSlots) {
                        return <PotentialTrackNode cx={p.x} cy={p.y} r={innerNodeR} state="disabled" />;
                    }

                    const isResistance = index < resistCount;
                    const isStress = index >= stressStartIndex && index < activeSlots;

                    const state = isResistance
                        ? ("resistance" as const)
                        : isStress
                            ? ("stress" as const)
                            : ("empty" as const);

                    return <PotentialTrackNode cx={p.x} cy={p.y} r={innerNodeR} state={state} />;
                }}
            />

            {/* CENTER SCORE */}
            <text
                x={cx}
                y={scoreY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={size * 0.23} // scales with widget size
                fill={TOKENS.gold}
                style={{
                    fontFamily: "var(--md-text-font, system-ui)",
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                }}
            >
                {activeSlots}
            </text>

            {/* TITLE */}
            <text
                x={cx}
                y={titleY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={size * 0.085}
                fill={TOKENS.purple}
                style={{
                    fontFamily: "var(--md-text-font, system-ui)",
                    fontWeight: 900,
                    letterSpacing: "0.08em",
                }}
            >
                {title.toUpperCase()}
            </text>
        </svg>
    );
}