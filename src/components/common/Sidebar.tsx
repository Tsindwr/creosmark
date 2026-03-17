import React, { useEffect } from "react";
import styles from "./Sidebar.module.css";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  /** CSS width value, e.g. "360px" or "40vw" */
  width?: string;
};

/**
 * Generic sliding side-panel.
 * Fill with inventory editing, roll history, character management, etc.
 */
export default function Sidebar({
  open,
  onClose,
  title,
  children,
  width = "360px",
}: SidebarProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Dimming overlay */}
      <div
        className={[styles.backdrop, open ? styles.backdropOpen : ""]
          .filter(Boolean)
          .join(" ")}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={[styles.panel, open ? styles.panelOpen : ""]
          .filter(Boolean)
          .join(" ")}
        style={{ "--sidebar-width": width } as React.CSSProperties}
        aria-modal={open}
        aria-label={title ?? "Side panel"}
        hidden={!open}
      >
        <div className={styles.panelHeader}>
          {title ? <h2 className={styles.panelTitle}>{title}</h2> : <span />}
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        <div className={styles.panelBody}>{children}</div>
      </aside>
    </>
  );
}
