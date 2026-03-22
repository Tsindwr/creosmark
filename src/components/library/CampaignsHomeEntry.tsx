import React from 'react';
import AppShell from '../app/AppShell';
import AuthGate from "../auth/AuthGate.tsx";
import SignInScreen from "../auth/SignInScreen.tsx";
import CampaignsLibraryFromDb from './CampaignsLibraryFromDb';

export default function CampaignsHomeEntry() {
    return (
        <AppShell activePath={'/campaign'}>
            <AuthGate fallback={<SignInScreen />}>
                <CampaignsLibraryFromDb />
            </AuthGate>
        </AppShell>
    )
}