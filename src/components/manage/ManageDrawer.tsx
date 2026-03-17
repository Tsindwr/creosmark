import React from 'react';
import styles from './ManageDrawer.module.css';

type ManageDrawerProps = {
    open: boolean;
    onClose: () => void;
    onEnterEditMode: () => void;
    onReturnToPlay: () => void;
    isEditing: boolean;
};

export default function ManageDrawer({
    open,
    onClose,
    onEnterEditMode,
    onReturnToPlay,
    isEditing,
}: ManageDrawerProps) {
    if (!open) return null;

    return (
        <div className={styles.overlay}>
            <button
                type={'button'}
                className={styles.scrim}
                aria-label={'Close manage drawer'}
                onClick={onClose}
            />

            <aside className={styles.drawer}>
                <header className={styles.header}>
                    <div>
                        <div className={styles.eyebrow}>Sheet menu</div>
                        <h2 className={styles.title}>Manage Character</h2>
                    </div>

                    <button type={'button'} className={styles.close} onClick={onClose}>
                        ✕
                    </button>
                </header>

                <div className={styles.group}>
                    <div className={styles.groupLabel}>Views</div>

                    <button
                        type={'button'}
                        className={`${styles.action} ${!isEditing ? styles.actionActive : ""}`}
                        onClick={() => {
                            onReturnToPlay();
                            onClose();
                        }}
                    >
                        Play View
                    </button>

                    <button
                        type={'button'}
                        className={`${styles.actiono} ${isEditing ? styles.actionActive : ""}`}
                        onClick={() => {
                            onEnterEditMode();
                            onClose();
                        }}
                    >
                        Edit Character
                    </button>
                </div>

                <div className={styles.group}>
                    <div className={styles.groupLabel}>Later</div>

                    <div className={styles.note}>
                        Save/load, export, import, and duplication can live here (prereq: Supabase)
                    </div>
                </div>
            </aside>
        </div>
    );
}