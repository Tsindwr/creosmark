import React, { useMemo, useState } from 'react';
import styles from './InventoryPanel.module.css';
import Sidebar from '../common/Sidebar';
import type {
    EquipSlotId,
    EquipmentSlot,
    InventoryContainer,
    InventoryItem,
    InventoryState,
} from '../../types/inventory';

type InventoryPanelProps = {
    inventory: InventoryState;
    onChange: (next: InventoryState) => void;
};

type InventoryView = 'equipped' | 'items' | 'containers' | 'currency';

const EQUIPMENT_SLOTS: EquipmentSlot[] = [
    { id: "mainHand", label: "Main Hand", accepts: ["weapon", "tool", "other"] },
    { id: "offHand", label: "Off Hand", accepts: ["weapon", "tool", "armor", "other"] },
    { id: 'head', label: 'Head', accepts: ['armor', 'other'] },
    { id: 'body', label: 'Body', accepts: ['armor', 'other'] },
    { id: 'back', label: 'Back', accepts: ['armor', 'gear', 'other'] },
    { id: 'hands', label: 'Hands', accepts: ['armor', 'gear', 'other'] },
    { id: 'feet', label: 'Feet', accepts: ['armor', 'other'] },
    { id: 'accessory1', label: 'Accessory I', accepts: ['any'] },
    { id: 'accessory2', label: 'Accessory II', accepts: ['any'] },
];

function canEquipToSlot(item: InventoryItem, slot: EquipmentSlot) {
    return slot.accepts.includes('any') || slot.accepts.includes(item.category);
}

function getContainerName(containers: InventoryContainer[], containerId?: string | null) {
    if (!containerId) return null;
    return containers.find((c) => c.id === containerId)?.name ?? "Unknown";
}

function silverValueLabel(inventory: InventoryState) {
    const base =
        inventory.currency.silver +
        inventory.currency.iron / 10 +
        inventory.currency.copper / 100;
    const custom = inventory.currency.custom.reduce(
        (sum, e) => sum + e.amount * e.valueInSilver,
        0,
    );
    return (base + custom).toFixed(2);
}

const CATEGORY_LABELS: Record<string, string> = {
    weapon: "Weapon", armor: "Armor", tool: "Tool", gear: "Gear",
    consumable: "Consumable", treasure: "Treasure", ammo: "Ammo",
    material: "Material", other: "Other",
};

// ── Item Detail Panel (renders inside Sidebar body) ────────────────────────
function ItemDetail({
    item,
    inventory,
    onChange,
    onRemove,
}: {
    item: InventoryItem;
    inventory: InventoryState;
    onChange: (patch: Partial<InventoryItem>) => void;
    onRemove: () => void;
}) {
    return (
        <div className={styles.detailForm}>
            <div className={styles.detailGroup}>
                <label className={styles.fieldLabel}>Name</label>
                <input
                    className={styles.input}
                    value={item.name}
                    onChange={(e) => onChange({ name: e.target.value })}
                />
            </div>

            <div className={styles.detailRow}>
                <div className={styles.detailGroup}>
                    <label className={styles.fieldLabel}>Category</label>
                    <select
                        className={styles.select}
                        value={item.category}
                        onChange={(e) => onChange({ category: e.target.value as InventoryItem["category"] })}
                    >
                        {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.detailGroup}>
                    <label className={styles.fieldLabel}>Qty</label>
                    <input
                        className={styles.input}
                        type="number"
                        min={0}
                        value={item.quantity}
                        onChange={(e) => onChange({ quantity: Math.max(0, Number(e.target.value) || 0) })}
                    />
                </div>
            </div>

            <div className={styles.detailGroup}>
                <label className={styles.fieldLabel}>Container</label>
                <select
                    className={styles.select}
                    value={item.containerId ?? ""}
                    onChange={(e) => onChange({ containerId: e.target.value || null })}
                >
                    <option value="">Loose</option>
                    {inventory.containers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div className={styles.detailDivider}>Combat stats</div>

            <div className={styles.detailRow}>
                <div className={styles.detailGroup}>
                    <label className={styles.fieldLabel}>Damage</label>
                    <input
                        className={styles.input}
                        value={item.damage ?? ""}
                        onChange={(e) => onChange({ damage: e.target.value || undefined })}
                        placeholder="1d6"
                    />
                </div>
                <div className={styles.detailGroup}>
                    <label className={styles.fieldLabel}>Target Potential</label>
                    <input
                        className={styles.input}
                        value={item.targetPotential ?? ""}
                        onChange={(e) => onChange({ targetPotential: e.target.value || undefined })}
                        placeholder="might"
                    />
                </div>
            </div>

            <div className={styles.detailRow}>
                <div className={styles.detailGroup}>
                    <label className={styles.fieldLabel}>Range</label>
                    <input
                        className={styles.input}
                        value={item.range ?? ""}
                        onChange={(e) => onChange({ range: e.target.value || undefined })}
                        placeholder="Here / Near / There"
                    />
                </div>
                <div className={styles.detailGroup}>
                    <label className={styles.fieldLabel}>Properties</label>
                    <input
                        className={styles.input}
                        value={item.properties?.join(", ") ?? ""}
                        onChange={(e) =>
                            onChange({
                                properties: e.target.value
                                    ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                                    : [],
                            })
                        }
                        placeholder="Thrown, Light"
                    />
                </div>
            </div>

            <div className={styles.detailDivider}>Durability & Protection</div>

            <div className={styles.detailRow}>
                <div className={styles.detailGroup}>
                    <label className={styles.fieldLabel}>Durability Max</label>
                    <input
                        className={styles.input}
                        type="number"
                        min={0}
                        value={item.durabilityMax ?? 0}
                        onChange={(e) => onChange({ durabilityMax: Number(e.target.value) || 0 })}
                    />
                </div>
                <div className={styles.detailGroup}>
                    <label className={styles.fieldLabel}>Durability Stress</label>
                    <input
                        className={styles.input}
                        type="number"
                        min={0}
                        value={item.durabilityStress ?? 0}
                        onChange={(e) => onChange({ durabilityStress: Number(e.target.value) || 0 })}
                    />
                </div>
            </div>

            <div className={styles.detailRow}>
                <div className={styles.detailGroup}>
                    <label className={styles.fieldLabel}>Protection Max</label>
                    <input
                        className={styles.input}
                        type="number"
                        min={0}
                        value={item.protectionMax ?? 0}
                        onChange={(e) => onChange({ protectionMax: Number(e.target.value) || 0 })}
                    />
                </div>
                <div className={styles.detailGroup}>
                    <label className={styles.fieldLabel}>Protection Open</label>
                    <input
                        className={styles.input}
                        type="number"
                        min={0}
                        value={item.protectionOpen ?? 0}
                        onChange={(e) => onChange({ protectionOpen: Number(e.target.value) || 0 })}
                    />
                </div>
            </div>

            <div className={styles.detailGroup}>
                <label className={styles.fieldLabel}>Notes</label>
                <textarea
                    className={styles.textarea}
                    value={item.notes ?? ""}
                    onChange={(e) => onChange({ notes: e.target.value })}
                    placeholder="Origin, narrative significance..."
                />
            </div>

            <button type="button" className={styles.dangerButton} onClick={onRemove}>
                Remove item
            </button>
        </div>
    );
}

// ── Container Detail Panel ─────────────────────────────────────────────────
function ContainerDetail({
    container,
    containedItems,
    inventory,
    onRename,
    onNotes,
    onRemoveItem,
    onRemoveContainer,
}: {
    container: InventoryContainer;
    containedItems: InventoryItem[];
    inventory: InventoryState;
    onRename: (name: string) => void;
    onNotes: (notes: string) => void;
    onRemoveItem: (itemId: string) => void;
    onRemoveContainer: () => void;
}) {
    return (
        <div className={styles.detailForm}>
            <div className={styles.detailGroup}>
                <label className={styles.fieldLabel}>Name</label>
                <input
                    className={styles.input}
                    value={container.name}
                    onChange={(e) => onRename(e.target.value)}
                />
            </div>
            <div className={styles.detailGroup}>
                <label className={styles.fieldLabel}>Notes</label>
                <textarea
                    className={styles.textarea}
                    value={container.notes ?? ""}
                    onChange={(e) => onNotes(e.target.value)}
                />
            </div>
            <div className={styles.detailDivider}>Contents ({containedItems.length})</div>
            {containedItems.length === 0 ? (
                <div className={styles.emptyState}>Nothing stored here.</div>
            ) : (
                containedItems.map((item) => (
                    <div key={item.id} className={styles.containedRow}>
                        <span>{item.name}</span>
                        <button
                            type="button"
                            className={styles.subtleButton}
                            onClick={() => onRemoveItem(item.id)}
                        >
                            Take out
                        </button>
                    </div>
                ))
            )}
            <button type="button" className={styles.dangerButton} onClick={onRemoveContainer}>
                Remove container
            </button>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function InventoryPanel({ inventory, onChange }: InventoryPanelProps) {
    const [view, setView] = useState<InventoryView>("equipped");
    const [selectedContainerId, setSelectedContainerId] = useState<string | "all" | "loose">("all");
    const [newItemName, setNewItemName] = useState("");
    const [newContainerName, setNewContainerName] = useState("");
    const [newCurrencyName, setNewCurrencyName] = useState("");

    // Sidebar state
    const [sidebarItemId, setSidebarItemId] = useState<string | null>(null);
    const [sidebarContainerId, setSidebarContainerId] = useState<string | null>(null);
    const sidebarOpen = sidebarItemId !== null || sidebarContainerId !== null;
    const sidebarItem = sidebarItemId ? inventory.items.find((i) => i.id === sidebarItemId) ?? null : null;
    const sidebarContainer = sidebarContainerId ? inventory.containers.find((c) => c.id === sidebarContainerId) ?? null : null;

    const equippedBySlot = useMemo(() => {
        const map = new Map<EquipSlotId, InventoryItem>();
        inventory.items.forEach((item) => {
            if (item.equippedSlot) map.set(item.equippedSlot, item);
        });
        return map;
    }, [inventory.items]);

    const visibleItems = useMemo(() => {
        if (selectedContainerId === "all") return inventory.items;
        if (selectedContainerId === "loose") return inventory.items.filter((i) => !i.containerId);
        return inventory.items.filter((i) => i.containerId === selectedContainerId);
    }, [inventory.items, selectedContainerId]);

    function updateItem(itemId: string, patch: Partial<InventoryItem>) {
        onChange({
            ...inventory,
            items: inventory.items.map((item) => item.id === itemId ? { ...item, ...patch } : item),
        });
    }

    function removeItem(itemId: string) {
        if (sidebarItemId === itemId) setSidebarItemId(null);
        onChange({ ...inventory, items: inventory.items.filter((i) => i.id !== itemId) });
    }

    function equipItem(itemId: string, slotId: EquipSlotId) {
        const slot = EQUIPMENT_SLOTS.find((s) => s.id === slotId);
        const item = inventory.items.find((i) => i.id === itemId);
        if (!slot || !item || !canEquipToSlot(item, slot)) return;
        onChange({
            ...inventory,
            items: inventory.items.map((entry) => {
                if (entry.equippedSlot === slotId) return { ...entry, equippedSlot: null };
                if (entry.id === itemId) return { ...entry, equippedSlot: slotId };
                return entry;
            }),
        });
    }

    function unequipSlot(slotId: EquipSlotId) {
        onChange({
            ...inventory,
            items: inventory.items.map((i) => i.equippedSlot === slotId ? { ...i, equippedSlot: null } : i),
        });
    }

    function addItem() {
        const name = newItemName.trim();
        if (!name) return;
        onChange({
            ...inventory,
            items: [...inventory.items, {
                id: crypto.randomUUID(), name, category: "gear", quantity: 1,
                containerId: null, equippedSlot: null,
            }],
        });
        setNewItemName("");
        setView("items");
    }

    function addContainer() {
        const name = newContainerName.trim();
        if (!name) return;
        onChange({
            ...inventory,
            containers: [...inventory.containers, { id: crypto.randomUUID(), name, parentContainerId: null }],
        });
        setNewContainerName("");
        setView("containers");
    }

    function addCustomCurrency() {
        const name = newCurrencyName.trim();
        if (!name) return;
        onChange({
            ...inventory,
            currency: {
                ...inventory.currency,
                custom: [...inventory.currency.custom, {
                    id: crypto.randomUUID(), name, amount: 0, valueInSilver: 10,
                }],
            },
        });
        setNewCurrencyName("");
    }

    function updateCurrency<K extends "copper" | "iron" | "silver">(key: K, value: number) {
        onChange({ ...inventory, currency: { ...inventory.currency, [key]: Math.max(0, Math.floor(value)) } });
    }

    function updateCustomCurrency(id: string, amount: number) {
        onChange({
            ...inventory,
            currency: {
                ...inventory.currency,
                custom: inventory.currency.custom.map((e) =>
                    e.id === id ? { ...e, amount: Math.max(0, Math.floor(amount)) } : e,
                ),
            },
        });
    }

    function renameCustomCurrency(id: string, name: string) {
        onChange({
            ...inventory,
            currency: {
                ...inventory.currency,
                custom: inventory.currency.custom.map((e) => e.id === id ? { ...e, name } : e),
            },
        });
    }

    function removeCustomCurrency(id: string) {
        onChange({
            ...inventory,
            currency: {
                ...inventory.currency,
                custom: inventory.currency.custom.filter((e) => e.id !== id),
            },
        });
    }

    function removeContainer(containerId: string) {
        if (sidebarContainerId === containerId) setSidebarContainerId(null);
        onChange({
            ...inventory,
            containers: inventory.containers.filter((c) => c.id !== containerId),
            items: inventory.items.map((i) => i.containerId === containerId ? { ...i, containerId: null } : i),
        });
    }

    const VIEWS: { id: InventoryView; label: string }[] = [
        { id: "equipped", label: "Equipped" },
        { id: "items", label: "Items" },
        { id: "containers", label: "Containers" },
        { id: "currency", label: "Currency" },
    ];

    return (
        <section className={styles.panel}>
            {/* ── Tab bar + quick-add ── */}
            <div className={styles.toolbar}>
                <nav className={styles.tabs}>
                    {VIEWS.map(({ id, label }) => (
                        <button
                            key={id}
                            type="button"
                            className={`${styles.tab} ${view === id ? styles.tabActive : ""}`}
                            onClick={() => setView(id)}
                        >
                            {label}
                        </button>
                    ))}
                </nav>

                <div className={styles.quickAdd}>
                    {view === "items" && (
                        <>
                            <input
                                className={styles.quickInput}
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder="Add item..."
                                onKeyDown={(e) => e.key === "Enter" && addItem()}
                            />
                            <button type="button" className={styles.addBtn} onClick={addItem}>+ Add</button>
                        </>
                    )}
                    {view === "containers" && (
                        <>
                            <input
                                className={styles.quickInput}
                                value={newContainerName}
                                onChange={(e) => setNewContainerName(e.target.value)}
                                placeholder="Add container..."
                                onKeyDown={(e) => e.key === "Enter" && addContainer()}
                            />
                            <button type="button" className={styles.addBtn} onClick={addContainer}>+ Add</button>
                        </>
                    )}
                    {view === "currency" && (
                        <>
                            <input
                                className={styles.quickInput}
                                value={newCurrencyName}
                                onChange={(e) => setNewCurrencyName(e.target.value)}
                                placeholder="Add currency..."
                                onKeyDown={(e) => e.key === "Enter" && addCustomCurrency()}
                            />
                            <button type="button" className={styles.addBtn} onClick={addCustomCurrency}>+ Add</button>
                        </>
                    )}
                </div>
            </div>

            {/* ── Equipped view ── */}
            {view === "equipped" && (
                <div className={styles.content}>
                    <div className={styles.listHeader}>
                        <span>Slot</span>
                        <span>Item</span>
                        <span>Stats</span>
                        <span></span>
                    </div>
                    {EQUIPMENT_SLOTS.map((slot) => {
                        const equipped = equippedBySlot.get(slot.id);
                        return (
                            <div key={slot.id} className={styles.slotRow}>
                                <span className={styles.slotLabel}>{slot.label}</span>

                                {equipped ? (
                                    <>
                                        <div className={styles.rowName}>
                                            <button
                                                type="button"
                                                className={styles.nameBtn}
                                                onClick={() => { setSidebarContainerId(null); setSidebarItemId(equipped.id); }}
                                            >
                                                {equipped.name}
                                            </button>
                                            <div className={styles.rowMeta}>
                                                <span className={styles.catPill}>{CATEGORY_LABELS[equipped.category]}</span>
                                                {equipped.properties?.map((p) => (
                                                    <span key={p} className={styles.propPill}>{p}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className={styles.rowStats}>
                                            {equipped.damage ? <span>{equipped.damage}</span> : null}
                                            {equipped.protectionMax ? (
                                                <span>Prot {equipped.protectionOpen ?? equipped.protectionMax}/{equipped.protectionMax}</span>
                                            ) : null}
                                        </div>
                                        <button
                                            type="button"
                                            className={styles.subtleButton}
                                            onClick={() => unequipSlot(slot.id)}
                                        >
                                            Unequip
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className={styles.emptySlot}>
                                            <select
                                                className={styles.slotSelect}
                                                value=""
                                                onChange={(e) => {
                                                    if (!e.target.value) return;
                                                    equipItem(e.target.value, slot.id);
                                                    e.target.value = "";
                                                }}
                                            >
                                                <option value="">— empty —</option>
                                                {inventory.items.filter((i) => canEquipToSlot(i, slot)).map((i) => (
                                                    <option key={i.id} value={i.id}>{i.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <span />
                                        <span />
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Items view ── */}
            {view === "items" && (
                <div className={styles.content}>
                    {/* Container filter pills */}
                    {inventory.containers.length > 0 && (
                        <div className={styles.filterRow}>
                            {[
                                { id: "all", label: "All" },
                                { id: "loose", label: "Loose" },
                                ...inventory.containers.map((c) => ({ id: c.id, label: c.name })),
                            ].map(({ id, label }) => (
                                <button
                                    key={id}
                                    type="button"
                                    className={`${styles.filterPill} ${selectedContainerId === id ? styles.filterPillActive : ""}`}
                                    onClick={() => setSelectedContainerId(id)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className={styles.listHeader}>
                        <span>Name</span>
                        <span>Type</span>
                        <span>Qty</span>
                        <span>Stored in</span>
                        <span></span>
                    </div>

                    {visibleItems.map((item) => (
                        <div
                            key={item.id}
                            className={`${styles.itemRow} ${sidebarItemId === item.id ? styles.itemRowActive : ""}`}
                        >
                            <button
                                type="button"
                                className={styles.nameBtn}
                                onClick={() => { setSidebarContainerId(null); setSidebarItemId(item.id); }}
                            >
                                {item.name}
                                {item.equippedSlot ? <span className={styles.equippedBadge}>E</span> : null}
                            </button>
                            <span className={styles.catPill}>{CATEGORY_LABELS[item.category]}</span>
                            <span className={styles.qty}>{item.quantity}</span>
                            <span className={styles.container}>{getContainerName(inventory.containers, item.containerId) ?? "—"}</span>
                            <button
                                type="button"
                                className={styles.detailBtn}
                                onClick={() => { setSidebarContainerId(null); setSidebarItemId(item.id); }}
                                aria-label={`Edit ${item.name}`}
                            >
                                ›
                            </button>
                        </div>
                    ))}

                    {visibleItems.length === 0 && (
                        <div className={styles.emptyState}>No items yet. Use the Add field above.</div>
                    )}
                </div>
            )}

            {/* ── Containers view ── */}
            {view === "containers" && (
                <div className={styles.content}>
                    <div className={`${styles.listHeader} ${styles.listHeader3}`}>
                        <span>Container</span>
                        <span>Items</span>
                        <span></span>
                    </div>

                    {inventory.containers.map((container) => {
                        const count = inventory.items.filter((i) => i.containerId === container.id).length;
                        return (
                            <div
                                key={container.id}
                                className={`${styles.itemRow} ${styles.itemRow3} ${sidebarContainerId === container.id ? styles.itemRowActive : ""}`}
                            >
                                <button
                                    type="button"
                                    className={styles.nameBtn}
                                    onClick={() => { setSidebarItemId(null); setSidebarContainerId(container.id); }}
                                >
                                    {container.name}
                                </button>
                                <span className={styles.qty}>{count} item{count !== 1 ? "s" : ""}</span>
                                <button
                                    type="button"
                                    className={styles.detailBtn}
                                    onClick={() => { setSidebarItemId(null); setSidebarContainerId(container.id); }}
                                    aria-label={`Edit ${container.name}`}
                                >
                                    ›
                                </button>
                            </div>
                        );
                    })}

                    {inventory.containers.length === 0 && (
                        <div className={styles.emptyState}>No containers yet. Use the Add field above.</div>
                    )}
                </div>
            )}

            {/* ── Currency view ── */}
            {view === "currency" && (
                <div className={styles.content}>
                    <div className={styles.currencyTotal}>
                        Total value: <strong>{silverValueLabel(inventory)} silver</strong>
                    </div>

                    <div className={styles.currencyBaseRow}>
                        {(["copper", "iron", "silver"] as const).map((key) => (
                            <label key={key} className={styles.currencyField}>
                                <span className={styles.fieldLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                <input
                                    className={styles.input}
                                    type="number"
                                    min={0}
                                    value={inventory.currency[key]}
                                    onChange={(e) => updateCurrency(key, Number(e.target.value))}
                                />
                            </label>
                        ))}
                    </div>

                    {inventory.currency.custom.length > 0 && (
                        <>
                            <div className={styles.listHeader}>
                                <span>Custom currency</span>
                                <span>Amount</span>
                                <span>Value (silver)</span>
                                <span></span>
                            </div>
                            {inventory.currency.custom.map((entry) => (
                                <div key={entry.id} className={styles.currencyRow}>
                                    <input
                                        className={styles.input}
                                        value={entry.name}
                                        onChange={(e) => renameCustomCurrency(entry.id, e.target.value)}
                                    />
                                    <input
                                        className={styles.input}
                                        type="number"
                                        min={0}
                                        value={entry.amount}
                                        onChange={(e) => updateCustomCurrency(entry.id, Number(e.target.value))}
                                    />
                                    <span className={styles.catPill}>{entry.valueInSilver} ea</span>
                                    <button
                                        type="button"
                                        className={styles.dangerButton}
                                        onClick={() => removeCustomCurrency(entry.id)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </>
                    )}

                    {inventory.currency.custom.length === 0 && (
                        <div className={styles.emptyState}>No custom currencies yet.</div>
                    )}
                </div>
            )}

            {/* ── Detail Sidebar ── */}
            <Sidebar
                open={sidebarOpen}
                onClose={() => { setSidebarItemId(null); setSidebarContainerId(null); }}
                title={sidebarItem?.name ?? sidebarContainer?.name ?? "Detail"}
                width="380px"
                modal={false}
            >
                {sidebarItem && (
                    <ItemDetail
                        item={sidebarItem}
                        inventory={inventory}
                        onChange={(patch) => updateItem(sidebarItem.id, patch)}
                        onRemove={() => removeItem(sidebarItem.id)}
                    />
                )}
                {sidebarContainer && (
                    <ContainerDetail
                        container={sidebarContainer}
                        containedItems={inventory.items.filter((i) => i.containerId === sidebarContainer.id)}
                        inventory={inventory}
                        onRename={(name) =>
                            onChange({
                                ...inventory,
                                containers: inventory.containers.map((c) =>
                                    c.id === sidebarContainer.id ? { ...c, name } : c,
                                ),
                            })
                        }
                        onNotes={(notes) =>
                            onChange({
                                ...inventory,
                                containers: inventory.containers.map((c) =>
                                    c.id === sidebarContainer.id ? { ...c, notes } : c,
                                ),
                            })
                        }
                        onRemoveItem={(itemId) => updateItem(itemId, { containerId: null })}
                        onRemoveContainer={() => removeContainer(sidebarContainer.id)}
                    />
                )}
            </Sidebar>
        </section>
    );
}
