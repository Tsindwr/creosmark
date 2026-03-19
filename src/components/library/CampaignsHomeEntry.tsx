import React from 'react';
import AppShell from '../app/AppShell';
import AuthGate from "../auth/AuthGate.tsx";
import SignInScreen from "../auth/SignInScreen.tsx";
import CampaignsLibraryFromDb from './CampaignsLibraryFromDb';

export default function CampaignsHomeEntry() {
    return (
        <AppShell title={"Your campaigns"}
                  subtitle={"View the campaigns you run or belong to, create a new one, or join one from the cloud."}
          >
            <AuthGate fallback={<SignInScreen />}>
                <CampaignsLibraryFromDb />
            </AuthGate>
        </AppShell>
    )
}