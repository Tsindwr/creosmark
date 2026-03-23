import React from 'react';
import AppShell from "../app/AppShell.tsx";
import AbilityBuilderShell from "./AbilityBuilderShell.tsx";

export default function AbilityBuilderPageEntry() {
    return (
        <AppShell activePath={'/creosmark/abilities'}>
            <AbilityBuilderShell />
        </AppShell>
    );
}