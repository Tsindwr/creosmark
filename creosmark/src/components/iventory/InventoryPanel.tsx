import React, { useMemo, useState } from 'react';
import styles from './InventoryPanel.module.css';
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

type InventoryView = 'equipped' | 'inventory' | 'containers' | 'currency';

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

function getContainerName(
    containers: InventoryContainer[],
    containerId?: string | null,
) {
    if (!containerId) return "Loose";
    return containers.find((entry) => entry.id === containerId)?.name ?? "Unknown";
}

function silverValueLabel(inventory: InventoryState) {
    const baseSilver =
        inventory.currency.silver +
        inventory.currency.iron / 10 +
        inventory.currency.copper / 100;

    const customSilver = inventory.currency.custom.reduce(
        (sum, entry) => sum + entry.amount * entry.valueInSilver,
        0,
    );

    const total = baseSilver + customSilver;
    return total.toFixed(2);
}

export default function InventoryPanel({
    inventory,
    onChange,
}: InventoryPanelProps) {
    const [view, setView] = useState<InventoryView>("equipped");
    const [selectedContainerId, setSelectedContainerId] = useState<string | "all" | "loose">("all");
    const [newItemName, setNewItemName] = useState("");
    const [newContainerName, setNewContainerName] = useState("");
    const [newCurrencyName, setNewCurrencyName] = useState("");

    const equippedBySlot = useMemo(() => {
        const map = new Map<EquipSlotId, InventoryItem>();
        inventory.items.forEach((item) => {
            if (item.equippedSlot) map.set(item.equippedSlot, item);
        });
        return map;
    }, [inventory.items]);

    const visibleItems = useMemo(() => {
        if (selectedContainerId === "all") return inventory.items;
        if (selectedContainerId === "loose") {
            return inventory.items.filter((item) => !item.containerId);
        }
        return inventory.items.filter((item) => item.containerId === selectedContainerId);
    }, [inventory.items, selectedContainerId]);

    function updateItem(itemId: string, patch: Partial<InventoryItem>) {
        onChange({
            ...inventory,
            items: inventory.items.map((item) =>
                item.id === itemId ? { ...item, ...patch } : item,
            ),
        });
    }

    function removeItem(itemId: string) {
        onChange({
            ...inventory,
            items: inventory.items.filter((item) => item.id !== itemId),
        });
    }

    function equipItem(itemId: string, slotId: EquipSlotId) {
        const slot = EQUIPMENT_SLOTS.find((entry) => entry.id === slotId);
        const item = inventory.items.find((entry) => entry.id === itemId);
        if (!slot || !item || !canEquipToSlot(item, slot)) return;

        onChange({
            ...inventory,
            items: inventory.items.map((entry) => {
                if (entry.equippedSlot === slotId) {
                    return { ...entry, equippedSlot: null };
                }
                if (entry.id === itemId) {
                    return { ...entry, equippedSlot: slotId };
                }
                return entry;
            }),
        });
    }

    function unequipSlot(slotId: EquipSlotId) {
        onChange({
            ...inventory,
            items: inventory.items.map((item) =>
                item.equippedSlot === slotId ? { ...item, equippedSlot: null } : item,
            ),
        });
    }

    function addItem() {
        const name = newItemName.trim();
        if (!name) return;

        const next: InventoryItem = {
            id: crypto.randomUUID(),
            name,
            category: "gear",
            quantity: 1,
            containerId: null,
            equippedSlot: null,
        };

        onChange({
            ...inventory,
            items: [...inventory.items, next],
        });
        setNewItemName("");
        setView("inventory");
    }

    function addContainer() {
        const name = newContainerName.trim();
        if (!name) return;

        onChange({
            ...inventory,
            containers: [
                ...inventory.containers,
                {
                    id: crypto.randomUUID(),
                    name,
                    parentContainerId: null,
                },
            ],
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
                custom: [
                    ...inventory.currency.custom,
                    {
                        id: crypto.randomUUID(),
                        name,
                        amount: 0,
                        valueInSilver: 10,
                    },
                ],
            },
        });
        setNewCurrencyName("");
        setView("currency");
    }

    function updateCurrency<K extends "copper" | "iron" | "silver">(
        key: K,
        value: number,
    ) {
        onChange({
            ...inventory,
            currency: {
                ...inventory.currency,
                [key]: Math.max(0, Math.floor(value)),
            },
        });
    }

    function updateCustomCurrency(id: string, amount: number) {
        onChange({
            ...inventory,
            currency: {
                ...inventory.currency,
                custom: inventory.currency.custom.map((entry) =>
                    entry.id === id ? { ...entry, amount: Math.max(0, Math.floor(amount)) } : entry,
                ),
            },
        });
    }

    function renameCustomCurrency(id: string, name: string) {
        onChange({
            ...inventory,
            currency: {
                ...inventory.currency,
                custom: inventory.currency.custom.map((entry) =>
                    entry.id === id ? { ...entry, name } : entry,
                ),
            },
        });
    }

    function removeCustomCurrency(id: string) {
        onChange({
            ...inventory,
            currency: {
                ...inventory.currency,
                custom: inventory.currency.custom.filter((entry) => entry.id !== id),
            },
        });
    }

    return (
        <section className={styles.panel}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.eyebrow}>Inventory</div>
                    <h2 className={styles.title}>Loadout & Goods</h2>
                </div>

                <nav className={styles.nav}>
                    {[
                        ["equipped", "Equipped"],
                        ["inventory", "Items"],
                        ["containers", "Containers"],
                        ["currency", "Currency"],
                    ].map(([id, label]) => (
                        <button
                            key={id}
                            type={"button"}
                            className={`${styles.navButton} ${view === id ? styles.navButtonActive : ""}`}
                            onClick={() => setView(id as InventoryView)}
                        >
                            {label}
                        </button>
                    ))}
                </nav>

                <div className={styles.quickCreate}>
                    <label className={styles.fieldLabel}>Quick add item</label>
                    <div className={styles.inlineCreate}>
                        <input
                            className={styles.input}
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder={"Torch, rope, potion..."}
                        />
                        <button type={"button"} className={styles.addButton} onClick={addItem}>
                            Add
                        </button>
                    </div>

                    <label className={styles.fieldLabel}>Quick add container</label>
                    <div className={styles.inlineCreate}>
                        <input
                            className={styles.input}
                            value={newContainerName}
                            onChange={(e) => setNewContainerName(e.target.value)}
                            placeholder={"Backpack, Satchel..."}
                        />
                        <button type={'button'} className={styles.addButton} onClick={addContainer}>
                            Add
                        </button>
                    </div>

                    <label className={styles.fieldLabel}>Quick add currency</label>
                    <div className={styles.inlineCreate}>
                        <input
                            className={styles.input}
                            value={newCurrencyName}
                            onChange={(e) => setNewCurrencyName(e.target.value)}
                            placeholder={"Crowns, Gold..."}
                        />
                        <button type={'button'} className={styles.addButton} onClick={addCustomCurrency}>
                            Add
                        </button>
                    </div>
                </div>
            </aside>

            <div className={styles.content}>
                {view === 'equipped' ? (
                    <div className={styles.sectionStack}>
                        <div className={styles.sectionHeader}>
                            <div>
                                <div className={styles.eyebrow}>Body slots</div>
                                <h3>Equipped</h3>
                            </div>
                        </div>

                        <div className={styles.slotGrid}>
                            {EQUIPMENT_SLOTS.map((slot) => {
                                const equipped = equippedBySlot.get(slot.id);

                                return (
                                    <article key={slot.id} className={styles.slotCard}>
                                        <div className={styles.slotTop}>
                                            <strong>{slot.label}</strong>
                                            {equipped ? (
                                                <button
                                                    type={'button'}
                                                    className={styles.subtleButton}
                                                    onClick={() => unequipSlot(slot.id)}
                                                >
                                                    Unequip
                                                </button>
                                            ) : null}
                                        </div>

                                        {equipped ? (
                                            <div className={styles.equippedItem}>
                                                <div className={styles.itemName}>{equipped.name}</div>
                                                <div className={styles.itemMeta}>
                                                    <span>{equipped.category}</span>
                                                    {equipped.damage ? <span>{equipped.damage}</span> : null}
                                                    {equipped.targetPotential ? (
                                                        <span>{equipped.targetPotential}</span>
                                                    ) : null}
                                                </div>

                                                {equipped.properties?.length ? (
                                                    <div className={styles.tags}>
                                                        {equipped.properties?.map((prop) => (
                                                            <span key={prop} className={styles.tag}>
                                                                {prop}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : null}

                                                {(equipped.protectionMax || equipped.durabilityMax) ? (
                                                    <div className={styles.statBlock}>
                                                        {equipped.protectionMax ? (
                                                            <span>
                                                                Protection {equipped.protectionOpen ?? equipped.protectionMax}/
                                                                {equipped.protectionMax}
                                                            </span>
                                                        ) : null}
                                                        {equipped.durabilityMax ? (
                                                            <span>
                                                                Durability {equipped.durabilityStress ?? 0}/
                                                                {equipped.durabilityMax}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <div className={styles.emptySlot}>Nothing equipped.</div>
                                        )}

                                        <div className={styles.slotAssign}>
                                            <label className={styles.fieldLabel}>Equip item here</label>
                                            <select
                                                className={styles.select}
                                                value={''}
                                                onChange={(e) => {
                                                    if (!e.target.value) return;
                                                    equipItem(e.target.value, slot.id);
                                                    e.target.value = '';
                                                }}
                                            >
                                                <option value={''}>Choose item...</option>
                                                {inventory.items
                                                        .filter((item) => canEquipToSlot(item, slot))
                                                        .map((item) => (
                                                            <option key={item.id} value={item.id}>
                                                                {item.name}
                                                            </option>
                                                        ))}
                                            </select>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                ) : null}

                {view === 'inventory' ? (
                    <div className={styles.sectionStack}>
                        <div className={styles.sectionHeader}>
                            <div>
                                <div className={styles.eyebrow}>Items</div>
                                <h3>Inventory List</h3>
                            </div>
                            <div className={styles.filterRow}>
                                <button
                                    type={'button'}
                                    className={`${styles.filterButton} ${
                                        selectedContainerId === "all" ? styles.filterButtonActive : ""
                                    }`}
                                    onClick={() => setSelectedContainerId("all")}
                                >
                                    All
                                </button>
                                <button
                                    type={'button'}
                                    className={`${styles.filterButton} ${
                                        selectedContainerId === 'loose' ? styles.filterButtonActive : ""
                                    }`}
                                    onClick={() => setSelectedContainerId("loose")}
                                >
                                    Loose
                                </button>
                                {inventory.containers.map((container) => (
                                    <button
                                        key={container.id}
                                        type={'button'}
                                        className={`${styles.filterButton} ${
                                            selectedContainerId === container.id
                                                ? styles.filterButtonActive
                                                : ""
                                        }`}
                                        onClick={() => setSelectedContainerId(container.id)}
                                    >
                                        {container.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.itemList}>
                            {visibleItems.map((item) => (
                                <article key={item.id} className={styles.itemCard}>
                                    <div className={styles.itemHeader}>
                                        <div>
                                            <h4>{item.name}</h4>
                                            <div className={styles.itemMeta}>
                                                <span>{item.category}</span>
                                                <span>{getContainerName(inventory.containers, item.containerId)}</span>
                                                {item.equippedSlot ? <span>Equipped: {item.equippedSlot}</span> : null}
                                            </div>
                                        </div>

                                        <button
                                            type={'button'}
                                            className={styles.dangerButton}
                                            onClick={() => removeItem(item.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <div className={styles.itemControls}>
                                        <label className={styles.controlGroup}>
                                            <span>Qty</span>
                                            <input
                                                className={styles.input}
                                                type={'number'}
                                                min={0}
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    updateItem(item.id, { quantity: Math.max(0, Number(e.target.value) || 0) })
                                                }
                                            />
                                        </label>

                                        <label className={styles.controlGroup}>
                                            <span>Category</span>
                                            <select
                                                className={styles.select}
                                                value={item.category}
                                                onChange={(e) =>
                                                    updateItem(item.id, {
                                                        category: e.target.value as InventoryItem["category"],
                                                    })
                                                }
                                            >
                                                <option value={'weapon'}>Weapon</option>
                                                <option value={'armor'}>Armor</option>
                                                <option value={'tool'}>Tool</option>
                                                <option value={'gear'}>Gear</option>
                                                <option value={'consumable'}>Consumable</option>
                                                <option value={'treasure'}>Treasure</option>
                                                <option value={'ammo'}>Ammo</option>
                                                <option value={'material'}>Material</option>
                                                <option value={'other'}>Other</option>
                                            </select>
                                        </label>

                                        <label className={styles.controlGroup}>
                                            <span>Container</span>
                                            <select
                                                className={styles.select}
                                                value={item.containerId ?? ""}
                                                onChange={(e) => {
                                                    updateItem(item.id, {
                                                        containerId: e.target.value || null,
                                                    })
                                                }}
                                            >
                                                <option value={''}>Loose</option>
                                                {inventory.containers.map((container) => (
                                                    <option key={container.id} value={container.id}>
                                                        {container.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className={styles.controlGroup}>
                                            <span>Name</span>
                                            <input
                                                className={styles.input}
                                                value={item.name}
                                                onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                            />
                                        </label>
                                    </div>

                                    <div className={styles.itemControls}>
                                        <label className={styles.controlGroup}>
                                            <span>Damage</span>
                                            <input
                                                className={styles.input}
                                                value={item.damage ?? ""}
                                                onChange={(e) => updateItem(item.id, { damage: e.target.value || undefined })}
                                                placeholder={"1d6"}
                                            />
                                        </label>

                                        <label className={styles.controlGroup}>
                                            <span>Target Potential</span>
                                            <input
                                                className={styles.input}
                                                value={item.targetPotential ?? ""}
                                                onChange={(e) => updateItem(item.id, { targetPotential: e.target.value })}
                                                placeholder={"might"}
                                            />
                                        </label>

                                        <label className={styles.controlGroup}>
                                            <span>Range</span>
                                            <input
                                                className={styles.input}
                                                value={item.range ?? ""}
                                                onChange={(e) => updateItem(item.id, { range: e.target.value || undefined })}
                                                placeholder={"Here / Near / There"}
                                            />
                                        </label>

                                        <label className={styles.controlGroup}>
                                            <span>Properties</span>
                                            <input
                                                className={styles.input}
                                                value={item.properties?.join(", ") ?? ""}
                                                onChange={(e) =>
                                                    updateItem(item.id, {
                                                        properties: e.target.value
                                                            ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                                                            : [],
                                                    })
                                                }
                                                placeholder={"Thrown, Light, Reach"}
                                            />
                                        </label>
                                    </div>

                                    <div className={styles.itemControls}>
                                        <label className={styles.controlGroup}>
                                            <span>Durability Max</span>
                                            <input
                                                className={styles.input}
                                                type={'number'}
                                                min={0}
                                                value={item.durabilityMax ?? 0}
                                                onChange={(e) => {
                                                    updateItem(item.id, {
                                                        durabilityMax: Number(e.target.value) || 0,
                                                    })
                                                }}
                                            />
                                        </label>

                                        <label className={styles.controlGroup}>
                                            <span>Durability Stress</span>
                                            <input
                                                className={styles.input}
                                                type={'number'}
                                                min={0}
                                                value={item.durabilityStress ?? 0}
                                                onChange={(e) =>
                                                    updateItem(item.id, {
                                                        durabilityStress: Number(e.target.value) || 0
                                                    })
                                                }
                                            />
                                        </label>

                                        <label className={styles.controlGroup}>
                                            <span>Protection Max</span>
                                            <input
                                                className={styles.input}
                                                type={'number'}
                                                min={0}
                                                value={item.protectionMax ?? 0}
                                                onChange={(e) =>
                                                    updateItem(item.id, {
                                                        protectionMax: Number(e.target.value) || 0,
                                                    })
                                                }
                                            />
                                        </label>

                                        <label className={styles.controlGroup}>
                                            <span>Protection Open</span>
                                            <input
                                                className={styles.input}
                                                type={'number'}
                                                min={0}
                                                value={item.protectionOpen ?? 0}
                                                onChange={(e) =>
                                                    updateItem(item.id, {
                                                        protectionOpen: Number(e.target.value) || 0,
                                                    })
                                                }
                                            />
                                        </label>
                                    </div>

                                    <label className={styles.controlGroup}>
                                        <span>Notes</span>
                                        <textarea
                                            className={styles.textarea}
                                            value={item.notes ?? ""}
                                            onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                                            placeholder={"Origin, narrative significance, thrown location..."}
                                        />
                                    </label>
                                </article>
                            ))}

                            {visibleItems.length === 0 ? (
                                <div className={styles.emptyState}>No items yet.</div>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {view === 'containers' ? (
                    <div className={styles.sectionStack}>
                        <div className={styles.sectionHeader}>
                            <div>
                                <div className={styles.eyebrow}>Organization</div>
                                <h3>Containers</h3>
                            </div>
                        </div>

                        <div className={styles.containerList}>
                            {inventory.containers.map((container) => {
                                const containedItems = inventory.items.filter(
                                    (item) => item.containerId === container.id,
                                );

                                return (
                                    <article key={container.id} className={styles.containerCard}>
                                        <div className={styles.itemHeader}>
                                            <div>
                                                <h4>{container.name}</h4>
                                                <div className={styles.itemMeta}>
                                                    <span>{containedItems.length} item(s)</span>
                                                </div>
                                            </div>
                                        </div>

                                        <label className={styles.controlGroup}>
                                            <span>Name</span>
                                            <input
                                                className={styles.input}
                                                value={container.name}
                                                onChange={(e) =>
                                                    onChange({
                                                        ...inventory,
                                                        containers: inventory.containers.map((entry) =>
                                                            entry.id === container.id
                                                                ? { ...entry, name: e.target.value }
                                                                : entry,
                                                        ),
                                                    })
                                                }
                                            />
                                        </label>

                                        <label className={styles.controlGroup}>
                                            <span>Notes</span>
                                            <textarea
                                                className={styles.textarea}
                                                value={container.notes ?? ''}
                                                onChange={(e) =>
                                                    onChange({
                                                        ...inventory,
                                                        containers: inventory.containers.map((entry) =>
                                                            entry.id === container.id
                                                                ? { ...entry, notes: e.target.value }
                                                                : entry,
                                                        ),
                                                    })
                                                }
                                            />
                                        </label>

                                        <div className={styles.containerList}>
                                            {containedItems.map((item) => (
                                                <div key={item.id} className={styles.containedRow}>
                                                    <span>{item.name}</span>
                                                    <button
                                                        type={'button'}
                                                        className={styles.subtleButton}
                                                        onClick={() => updateItem(item.id, { containerId: null })}
                                                    >
                                                        Take out
                                                    </button>
                                                </div>
                                            ))}

                                            {containedItems.length === 0 ? (
                                                <div className={styles.emptyState}>Nothing in here.</div>
                                            ) : null}
                                        </div>
                                    </article>
                                );
                            })}

                            {inventory.containers.length === 0 ? (
                                    <div className={styles.emptyState}>No containers yet.</div>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {view === "currency" ? (
                    <div className={styles.sectionStack}>
                        <div className={styles.sectionHeader}>
                            <div>
                                <div className={styles.eyebrow}>Coin</div>
                                <h3>Currency</h3>
                            </div>
                            <div className={styles.valueBadge}>
                                Total silver value: {silverValueLabel(inventory)}
                            </div>
                        </div>

                        <div className={styles.currencyGrid}>
                            <article className={styles.currencyCard}>
                                <h4>Base denominations</h4>

                                <div className={styles.currencyInputs}>
                                    <label className={styles.controlGroup}>
                                        <span>Copper</span>
                                        <input
                                            className={styles.input}
                                            type={'number'}
                                            min={0}
                                            value={inventory.currency.copper}
                                            onChange={(e) => updateCurrency("copper", Number(e.target.value))}
                                        />
                                    </label>

                                    <label className={styles.controlGroup}>
                                        <span>Iron</span>
                                        <input
                                            className={styles.input}
                                            type={'number'}
                                            min={0}
                                            value={inventory.currency.iron}
                                            onChange={(e) => updateCurrency('iron', Number(e.target.value))}
                                        />
                                    </label>

                                    <label className={styles.controlGroup}>
                                        <span>Silver</span>
                                        <input
                                            className={styles.input}
                                            type={'number'}
                                            min={0}
                                            value={inventory.currency.silver}
                                            onChange={(e) => updateCurrency('silver', Number(e.target.value))}
                                        />
                                    </label>
                                </div>
                            </article>

                            <article className={styles.currencyCard}>
                                <h4>Custom currencies</h4>
                                <p className={styles.copy}>
                                    Each custom denomination is treated as worth 10 silver pieces.
                                </p>

                                <div className={styles.customCurrencyList}>
                                    {inventory.currency.custom.map((entry) => (
                                        <div key={entry.id} className={styles.customCurrencyRow}>
                                            <input
                                                className={styles.input}
                                                value={entry.name}
                                                onChange={(e) => renameCustomCurrency(entry.id, e.target.value)}
                                            />
                                            <input
                                                className={styles.input}
                                                type={'number'}
                                                min={0}
                                                value={entry.amount}
                                                onChange={(e) =>
                                                    updateCustomCurrency(entry.id, Number(e.target.value))
                                                }
                                            />
                                            <div className={styles.staticPill}>10 silver each</div>
                                            <button
                                                type={'button'}
                                                className={styles.dangerButton}
                                                onClick={() => removeCustomCurrency(entry.id)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}

                                    {inventory.currency.custom.length === 0 ? (
                                        <div className={styles.emptyState}>No custom currencies yet.</div>
                                    ) : null}
                                </div>
                            </article>
                        </div>
                    </div>
                ) : null}
            </div>
        </section>
    );
}