import React from 'react';
import AuthGate from '../auth/AuthGate';
import SignInScreen from "../auth/SignInScreen.tsx";
import CharacterSheetFromDb from "./CharacterSheetFromDb.tsx";
import CharacterBuilderPageEntry from "./CharacterBuilderPageEntry.tsx";
import { useQueryParam} from "../../lib/useQueryParams.ts";

type CharacterSheetQueryPageEntryProps = {
    mode: 'play' | 'edit';
};

function InnerCharacterSheetQueryPageEntry({
    mode,
}: CharacterSheetQueryPageEntryProps) {
    const { value: characterId, ready } = useQueryParam('id');

    if (!ready) {
        return <main style={{ padding: '1.5rem' }}>Loading...</main>;
    }

    if (!characterId) {
        return <main style={{ padding: '1.5rem' }}>Missing character id.</main>;
    }

    return mode === 'edit' ? (
        <CharacterBuilderPageEntry characterId={characterId} />
    ) : (
        <CharacterSheetFromDb characterId={characterId} initialMode={'play'} />
    );
}

export default function CharacterSheetQueryPageEntry({ mode }: CharacterSheetQueryPageEntryProps) {
    return (
        <AuthGate fallback={<SignInScreen />}>
            <InnerCharacterSheetQueryPageEntry mode={mode} />
        </AuthGate>
    );
}