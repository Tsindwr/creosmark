import React from "react";
import AuthStatus from "../auth/AuthStatus";
import styles from "./AppShell.module.css";

type AppShellProps = {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    aside?: React.ReactNode;
};

export default function AppShell({
    eyebrow = "Sunder Library",
    title,
    subtitle,
    children,
    aside,
}: AppShellProps) {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.brandBlock}>
                    <div className={styles.eyebrow}>{eyebrow}</div>
                    <h1 className={styles.title}>{title}</h1>
                    {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
                </div>

                <div className={styles.authBlock}>
                    <AuthStatus />
                </div>
            </header>

            <div className={styles.body}>
                <main className={styles.main}>{children}</main>
                {aside ? <aside className={styles.aside}>{aside}</aside> : null}
            </div>
        </div>
    );
}