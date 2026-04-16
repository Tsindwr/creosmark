import { supabase } from "./../../lib/supabase/client";
import type { AbilityPublishDocument } from "../../domain";
import type { PublishedAbilityResult} from "../../application";

export type AbilityRow = {
    id: string;
    owner_id: string;
    title: string;
    ability_kind: string;
    status: "draft" | "published";
    ability_json: AbilityPublishDocument;
    created_at: string;
    updated_at: string;
    published_at: string | null;
};

async function requireUserId(): Promise<string> {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error) throw error;
    if (!user) throw new Error("You must be signed in.");

    return user.id;
}

export async function publishAbilityDocument(
    document: AbilityPublishDocument,
): Promise<PublishedAbilityResult> {
    const userId = await requireUserId();

    const { data, error } = await supabase
        .from("abilities")
        .insert({
            owner_id: userId,
            title: document.title,
            ability_kind: document.abilityKind,
            status: "draft",
            ability_json: document,
            published_at: new Date().toISOString(),
        })
        .select("id, title, updated_at")
        .single();

    if (error) throw error;

    return {
        id: data.id as string,
        title: data.title as string,
        updatedAt: data.updated_at as string,
    };
}