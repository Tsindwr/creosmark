import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    addEdge,
    Background,
    Controls,
    Handle,
    MiniMap,
    Position,
    ReactFlow,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow,
    type Connection,
    type Edge,
    type NodeProps,
} from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import styles from './AbilityBuilderShell.module.css';
import type {
    AbilityBuilderNode,
    AbilityKind,
    AbilityLane,
    AbilityRootData,
    AbilityRootNodeType,
    FreeformData,
    FreeformNodeType,
    ModifierData,
    ModifierFamily,
    ModifierNodeType,
    PaletteTemplate,
} from '../../domain/ability-builder/types';
import { buildPaletteSections } from '../../domain/ability-builder/palette';
import {
    calculateTotalFromCost,
    computeAbilitySummary,
    formatCost,
    toneForFamily,
} from '../../domain/ability-builder/pricing';
import {
    buildBlankActionPreset,
    buildBlankSurgePreset,
} from '../../domain/ability-builder/presets';
import {
    createNodeFromTemplate,
    exportBlueprintJson,
} from '../../application/ability-builder/commands';


function LaneBadge({ lane }: { lane: AbilityLane }) {
    return <span className={styles.laneBadge}>{lane}</span>;
}

function AbilityRootNode({ data, selected }: NodeProps<AbilityRootNodeType>) {
    return (
        <div className={`${styles.node} ${styles.rootNode} ${selected ? styles.nodeSelected : ""}`}>
            <Handle type={'target'} position={Position.Top} className={styles.handle} />
            <div className={styles.nodeHeader}>
                <span className={styles.nodeEyebrow}>{data.abilityKind}</span>
                <strong>{data.title}</strong>
            </div>
            <p className={styles.nodeCopy}>{data.summary || "Describe the card's job."}</p>
            <Handle type={'source'} position={Position.Bottom} className={styles.handle} />
        </div>
    );
}

function ModifierNode({ data, selected }: NodeProps<ModifierNodeType>) {
    return (
        <div
            className={`${styles.node} ${styles.modifierNode} ${styles[`tone${toneForFamily(data.family)}`]} ${
                selected ? styles.nodeSelected : ""
            }`}
            >
            <Handle type={'target'} position={Position.Top} className={styles.handle} />
            <div className={styles.nodeHeader}>
                <span className={styles.nodeEyebrow}>{data.family}</span>
                <strong>{data.label}</strong>
            </div>
            <LaneBadge lane={data.lane} />
            <p className={styles.nodeCopy}>{data.description}</p>
            <div className={styles.nodeCost}>{formatCost(data.cost)}</div>
            <Handle type={'source'} position={Position.Bottom} className={styles.handle} />
        </div>
    );
}

function FreeformNode({ data, selected }: NodeProps<FreeformNodeType>) {
    return (
        <div className={`${styles.node} ${styles.freeformNode} ${selected ? styles.nodeSelected : ""}`}>
            <Handle type={'target'} position={Position.Top} className={styles.handle} />
            <div className={styles.nodeHeader}>
                <span className={styles.nodeEyebrow}>fallback</span>
                <strong>{data.title}</strong>
            </div>
            <LaneBadge lane={data.lane} />
            <p className={styles.nodeCopy}>{data.text}</p>
            <Handle type={'source'} position={Position.Bottom} className={styles.handle} />
        </div>
    );
}

const nodeTypes = {
    abilityRoot: AbilityRootNode,
    marketModifier: ModifierNode,
    freeformText: FreeformNode,
};

function AbilityBuilderInner() {
    const initial = useMemo(() => buildBlankActionPreset(), []);
    const [nodes, setNodes, onNodesChange] = useNodesState<AbilityBuilderNode>(initial.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initial.nodes[0]?.id ?? null);
    const [sidebarMode, setSidebarMode] = useState<'palette' | 'inspector'>(
        initial.nodes[0] ? 'inspector' : 'palette',
    )
    const [openPaletteId, setOpenPaletteId] = useState<string>('roots');
    const paletteSections = useMemo(() => buildPaletteSections(), []);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const { screenToFlowPosition, fitView } = useReactFlow<AbilityBuilderNode, Edge>();

    useEffect(() => {
        const element = wrapperRef.current;
        if (!element) return;

        let frame = 0;

        const updateAvailableHeight = () => {
            cancelAnimationFrame(frame);

            frame = window.requestAnimationFrame(() => {
                const rect = element.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const bottomGap = 8;
                const available = Math.max(420, viewportHeight - rect.top - bottomGap);

                element.style.setProperty('--ability-builder-height', `${available}px`);
            });
        };

        updateAvailableHeight();

        const resizeObserver = new ResizeObserver(() => {
            updateAvailableHeight();
        });

        resizeObserver.observe(document.body);
        window.addEventListener('resize', updateAvailableHeight);

        return () => {
            cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateAvailableHeight);
        };
    }, []);

    const onConnect = useCallback(
        (connection: Connection) => {
            setEdges((current) => {
                return addEdge(
                    {
                        ...connection,
                        animated: false,
                        markerEnd: { type: 'arrowclosed' },
                    },
                    current,
                )
            });
        },
        [setEdges],
    );

    const onDragStart = useCallback((event: React.DragEvent, template: PaletteTemplate) => {
        event.dataTransfer.setData('application/sunder-ability-node', JSON.stringify(template));
        event.dataTransfer.effectAllowed = 'move';
    }, []);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const raw = event.dataTransfer.getData('application/sunder-ability-node');
            if (!raw) return;

            const template = JSON.parse(raw) as PaletteTemplate;
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = createNodeFromTemplate(template, position);

            setNodes((current) => [...current, newNode]);
            setSelectedNodeId(newNode.id);
            setSidebarMode('inspector');
        },
        [screenToFlowPosition, setNodes],
    );

    const selectedNode = useMemo(
        () => nodes.find((node) => node.id === selectedNodeId) ?? null,
        [nodes, selectedNodeId],
    );

    const summary = useMemo(() => computeAbilitySummary(nodes), [nodes]);

    function updateSelectedAbilityRoot(
        updater: (data: AbilityRootData) => AbilityRootData,
    ) {
        if (!selectedNodeId) return;

        setNodes((current) =>
            current.map((node): AbilityBuilderNode => {
                if (node.id !== selectedNodeId || node.type !== 'abilityRoot') return node;

                return {
                    ...node,
                    data: updater(node.data),
                };
            }),
        );
    }

    function updateSelectedModifier(
        updater: (data: ModifierData) => ModifierData,
    ) {
        if (!selectedNodeId) return;

        setNodes((current) =>
            current.map((node): AbilityBuilderNode => {
                if (node.id !== selectedNodeId || node.type !== 'marketModifier') return node;

                return {
                    ...node,
                    data: updater(node.data),
                };
            }),
        );
    }

    function updateSelectedFreeform(
        updater: (data: FreeformData) => FreeformData,
    ) {
        if (!selectedNodeId) return;
        setNodes((current) =>
            current.map((node): AbilityBuilderNode => {
                if (node.id !== selectedNodeId || node.type !== 'freeformText') return node;

                return {
                    ...node,
                    data: updater(node.data),
                };
            }),
        );
    }

    function loadPreset(kind: 'action' | 'surge') {
        const next = kind === 'surge' ? buildBlankSurgePreset() : buildBlankActionPreset();

        setNodes(next.nodes);
        setEdges(next.edges);
        setSelectedNodeId(next.nodes[0]?.id ?? null);
        setSidebarMode(next.nodes[0] ? 'inspector' : 'palette');

        requestAnimationFrame(() => {
            fitView({ padding: 0.2, duration: 300 });
        });
    }

    function exportJson() {
        exportBlueprintJson(nodes, edges, summary);
    }

    return (
        <div className={styles.shell} ref={wrapperRef}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarTabs}>
                    <button
                        type="button"
                        className={`${styles.sidebarTab} ${sidebarMode === 'palette' ? styles.sidebarTabActive : ''}`}
                        onClick={() => setSidebarMode('palette')}
                    >
                        Palette
                    </button>

                    <button
                        type="button"
                        className={`${styles.sidebarTab} ${sidebarMode === 'inspector' ? styles.sidebarTabActive : ''}`}
                        onClick={() => {
                            if (selectedNode) {
                                setSidebarMode('inspector');
                            }
                        }}
                        disabled={!selectedNode}
                    >
                        Inspector
                    </button>
                </div>

                <div className={styles.sidebarBody}>
                    {sidebarMode === 'palette' ? (
                        <>
                            <div className={styles.sidebarSection}>
                                <div className={styles.eyebrow}>Ability Builder</div>
                                <h2 className={styles.sidebarTitle}>Block workspace</h2>
                                <p className={styles.sidebarCopy}>
                                    Drag blocks into the graph.
                                </p>
                            </div>

                            <div className={styles.sidebarSection}>
                                <div className={styles.presetRow}>
                                    <button
                                        type="button"
                                        className={styles.smallButton}
                                        onClick={() => loadPreset('action')}
                                    >
                                        Blank Action
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.smallButton}
                                        onClick={() => loadPreset('surge')}
                                    >
                                        Blank Surge
                                    </button>
                                </div>
                            </div>

                            <div className={styles.paletteAccordion}>
                                {paletteSections.map((section) => {
                                    const open = openPaletteId === section.id;

                                    return (
                                        <section key={section.id} className={styles.accordionSection}>
                                            <button
                                                type="button"
                                                className={styles.accordionToggle}
                                                onClick={() => setOpenPaletteId(open ? "" : section.id)}
                                                aria-expanded={open}
                                            >
                                                <span>{section.title}</span>
                                                <span className={styles.accordionMeta}>
                                                {section.items.length}
                                                    <span className={styles.accordionChevron}>
                                                    {open ? "−" : "+"}
                                                </span>
                                            </span>
                                            </button>

                                            {open ? (
                                                <div className={styles.palettePanel}>
                                                    <div className={styles.paletteGrid}>
                                                        {section.items.map((item) => (
                                                            <button
                                                                key={`${section.id}-${item.label}`}
                                                                type="button"
                                                                draggable
                                                                className={styles.paletteItem}
                                                                onDragStart={(event) => onDragStart(event, item)}
                                                            >
                                                                {item.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </section>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.sidebarSection}>
                                <div className={styles.eyebrow}>Inspector</div>
                                <h2 className={styles.sidebarTitle}>
                                    {selectedNode ? 'Selected block' : 'No selection'}
                                </h2>
                            </div>

                            {selectedNode ? (
                                <>
                                    {selectedNode.type === 'abilityRoot' ? (
                                        <div className={styles.editorStack}>
                                            <label className={styles.field}>
                                                <span>Title</span>
                                                <input
                                                    value={selectedNode.data.title}
                                                    onChange={(event) =>
                                                        updateSelectedAbilityRoot((data) => ({
                                                            ...data,
                                                            title: event.target.value,
                                                        }))
                                                    }
                                                />
                                            </label>

                                            <label className={styles.field}>
                                                <span>Kind</span>
                                                <select
                                                    value={selectedNode.data.abilityKind}
                                                    onChange={(event) =>
                                                        updateSelectedAbilityRoot((data) => ({
                                                            ...data,
                                                            abilityKind: event.target.value as AbilityKind,
                                                        }))
                                                    }
                                                >
                                                    <option value="action">Action</option>
                                                    <option value="surge">Surge</option>
                                                    <option value="trait">Trait</option>
                                                    <option value="option">Option</option>
                                                </select>
                                            </label>

                                            <label className={styles.field}>
                                                <span>Summary</span>
                                                <textarea
                                                    value={selectedNode.data.summary}
                                                    onChange={(event) =>
                                                        updateSelectedAbilityRoot((data) => ({
                                                            ...data,
                                                            summary: event.target.value,
                                                        }))
                                                    }
                                                />
                                            </label>
                                        </div>
                                    ) : null}

                                    {selectedNode.type === 'marketModifier' ? (
                                        <div className={styles.editorStack}>
                                            <label className={styles.field}>
                                                <span>Label</span>
                                                <input
                                                    value={selectedNode.data.label}
                                                    onChange={(event) =>
                                                        updateSelectedModifier((data) => ({
                                                            ...data,
                                                            label: event.target.value,
                                                        }))
                                                    }
                                                />
                                            </label>

                                            <label className={styles.field}>
                                                <span>Lane</span>
                                                <select
                                                    value={selectedNode.data.lane}
                                                    onChange={(event) =>
                                                        updateSelectedModifier((data) => ({
                                                            ...data,
                                                            lane: event.target.value as AbilityLane,
                                                        }))
                                                    }
                                                >
                                                    <option value="body">Body</option>
                                                    <option value="focus">Focus</option>
                                                    <option value="flipside">Flipside</option>
                                                    <option value="option">Option</option>
                                                </select>
                                            </label>

                                            <label className={styles.field}>
                                                <span>Family</span>
                                                <select
                                                    value={selectedNode.data.family}
                                                    onChange={(event) =>
                                                        updateSelectedModifier((data) => ({
                                                            ...data,
                                                            family: event.target.value as ModifierFamily,
                                                        }))
                                                    }
                                                >
                                                    <option value="activation">Activation</option>
                                                    <option value="effect">Effect</option>
                                                    <option value="narrative">Narrative</option>
                                                    <option value="caveat">Caveat</option>
                                                    <option value="consequence">Consequence</option>
                                                    <option value="special">Special</option>
                                                </select>
                                            </label>

                                            <label className={styles.field}>
                                                <span>Description</span>
                                                <textarea
                                                    value={selectedNode.data.description}
                                                    onChange={(event) =>
                                                        updateSelectedModifier((data) => ({
                                                            ...data,
                                                            description: event.target.value,
                                                        }))
                                                    }
                                                />
                                            </label>

                                            <div className={styles.costGrid}>
                                                <label className={styles.field}>
                                                    <span>Strings</span>
                                                    <input
                                                        type="number"
                                                        step="1"
                                                        value={selectedNode.data.cost.strings}
                                                        onChange={(event) =>
                                                            updateSelectedModifier((data) => ({
                                                                ...data,
                                                                cost: {
                                                                    ...data.cost,
                                                                    strings: Number(event.target.value) || 0,
                                                                },
                                                            }))
                                                        }
                                                    />
                                                </label>

                                                <label className={styles.field}>
                                                    <span>Beats</span>
                                                    <input
                                                        type="number"
                                                        step="1"
                                                        value={selectedNode.data.cost.beats}
                                                        onChange={(event) =>
                                                            updateSelectedModifier((data) => ({
                                                                ...data,
                                                                cost: {
                                                                    ...data.cost,
                                                                    beats: Number(event.target.value) || 0,
                                                                },
                                                            }))
                                                        }
                                                    />
                                                </label>

                                                <label className={styles.field}>
                                                    <span>Enh.</span>
                                                    <input
                                                        type="number"
                                                        step="1"
                                                        value={selectedNode.data.cost.enhancements}
                                                        onChange={(event) =>
                                                            updateSelectedModifier((data) => ({
                                                                ...data,
                                                                cost: {
                                                                    ...data.cost,
                                                                    enhancements: Number(event.target.value) || 0,
                                                                },
                                                            }))
                                                        }
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    ) : null}

                                    {selectedNode.type === 'freeformText' ? (
                                        <div className={styles.editorStack}>
                                            <label className={styles.field}>
                                                <span>Title</span>
                                                <input
                                                    value={selectedNode.data.title}
                                                    onChange={(event) =>
                                                        updateSelectedFreeform((data) => ({
                                                            ...data,
                                                            title: event.target.value,
                                                        }))
                                                    }
                                                />
                                            </label>

                                            <label className={styles.field}>
                                                <span>Lane</span>
                                                <select
                                                    value={selectedNode.data.lane}
                                                    onChange={(event) =>
                                                        updateSelectedFreeform((data) => ({
                                                            ...data,
                                                            lane: event.target.value as AbilityLane,
                                                        }))
                                                    }
                                                >
                                                    <option value="body">Body</option>
                                                    <option value="focus">Focus</option>
                                                    <option value="flipside">Flipside</option>
                                                    <option value="option">Option</option>
                                                </select>
                                            </label>

                                            <label className={styles.field}>
                                                <span>Text</span>
                                                <textarea
                                                    value={selectedNode.data.text}
                                                    onChange={(event) =>
                                                        updateSelectedFreeform((data) => ({
                                                            ...data,
                                                            text: event.target.value,
                                                        }))
                                                    }
                                                />
                                            </label>
                                        </div>
                                    ) : null}

                                    <div className={styles.sidebarSection}>
                                        <div className={styles.eyebrow}>Rule Checks</div>
                                        <div className={styles.warningList}>
                                            {summary.warnings.length > 0 ? (
                                                summary.warnings.map((warning) => (
                                                    <div key={warning} className={styles.warning}>
                                                        {warning}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className={styles.okay}>
                                                    No obvious structural warnings yet.
                                                </div>
                                            )}
                                            {summary.notes.map((note) => (
                                                <div key={note} className={styles.note}>
                                                    {note}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className={styles.emptyInspector}>
                                    No node selected.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </aside>

            <section className={styles.workspace} onDragOver={onDragOver} onDrop={onDrop}>
                <div className={styles.toolbar}>
                    {summary.isAction ? (
                        <>
                            <div className={styles.summaryBlock}>
                                <span className={styles.toolbarLabel}>Paid (Focus + Base)</span>
                                <strong>{formatCost(summary.paid)}</strong>
                            </div>
                            {/*<div className={styles.summaryBlock}>*/}
                            {/*    <span className={styles.toolbarLabel}>Focus</span>*/}
                            {/*    <strong>{formatCost(summary.focus)}</strong>*/}
                            {/*</div>*/}
                            {/*<div className={styles.summaryBlock}>*/}
                            {/*    <span className={styles.toolbarLabel}>Body</span>*/}
                            {/*    <strong>{formatCost(summary.body)}</strong>*/}
                            {/*</div>*/}
                            <div className={`${styles.summaryBlock} ${summary.isFlipsideOverBudget ? styles.summaryBlockOver : ''}`}>
                                <span className={styles.toolbarLabel}>
                                    Flipside used / budget
                                </span>
                                <strong>
                                    {calculateTotalFromCost(summary.flipside)} / {summary.flipsideBudgetStrings} Strings
                                    {summary.flipsideBudgetEnhancements > 0
                                        ? ` · ${summary.flipside.enhancements} / ${summary.flipsideBudgetEnhancements} Enh.`
                                        : ''}
                                </strong>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.summaryBlock}>
                                <span className={styles.toolbarLabel}>Total</span>
                                <strong>{formatCost(summary.total)}</strong>
                            </div>
                            <div className={styles.summaryBlock}>
                                <span className={styles.toolbarLabel}>Body</span>
                                <strong>{formatCost(summary.body)}</strong>
                            </div>
                        </>
                    )}

                    <button type={'button'} className={styles.exportButton} onClick={exportJson}>
                        Export JSON
                    </button>
                </div>

                <ReactFlow<AbilityBuilderNode, Edge>
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                    onPaneClick={() => setSelectedNodeId(null)}
                    fitView
                    className={styles.flow}
                    defaultEdgeOptions={{ markerEnd: { type: 'arrowclosed' } }}
                    >
                    <Background gap={24} size={1} />
                    <MiniMap pannable zoomable />
                    <Controls />
                </ReactFlow>
            </section>
        </div>
    );
}

export default function AbilityBuilderShell() {
    return (
        <ReactFlowProvider>
            <AbilityBuilderInner />
        </ReactFlowProvider>
    );
}