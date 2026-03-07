"use server";

import { cookies } from "next/headers";
import { getSupabaseServerAdminClient } from "@/app/lib/supabase-server";

type ActionResult = { error?: string };

function getServerSupabase() {
  return getSupabaseServerAdminClient();
}

function parseAccessTokenFromCookieValue(rawValue: string): string | null {
  if (!rawValue) return null;

  const trimmed = rawValue.trim();
  if (trimmed.split(".").length === 3) return trimmed;

  const tryJson = (input: string): string | null => {
    try {
      const parsed = JSON.parse(input) as unknown;
      if (parsed && typeof parsed === "object" && "access_token" in parsed) {
        const token = (parsed as { access_token?: unknown }).access_token;
        return typeof token === "string" && token ? token : null;
      }
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") {
        const token = parsed[0];
        return token.split(".").length === 3 ? token : null;
      }
      return null;
    } catch {
      return null;
    }
  };

  const fromJson = tryJson(trimmed);
  if (fromJson) return fromJson;

  if (trimmed.startsWith("base64-")) {
    const decoded = Buffer.from(trimmed.slice("base64-".length), "base64").toString("utf8");
    const fromDecoded = tryJson(decoded);
    if (fromDecoded) return fromDecoded;
  }

  const tokenMatch = trimmed.match(/"access_token":"([^"]+)"/);
  if (tokenMatch?.[1]) return tokenMatch[1];

  return null;
}

async function requireAuthenticatedUserId(): Promise<string> {
  const cookieStore = await cookies();
  const directTokenCookie = cookieStore.get("wm-access-token");
  const authCookie = cookieStore
    .getAll()
    .find((cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"));

  const directToken = directTokenCookie?.value ? decodeURIComponent(directTokenCookie.value) : null;
  const token = directToken || (authCookie ? parseAccessTokenFromCookieValue(authCookie.value) : null);
  if (!token) {
    throw new Error("Authentication required.");
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new Error("Authentication required.");
  }
  return data.user.id;
}

export type VocabWritePayload = {
  language_code: string;
  word: string;
  translation: string;
  part_of_speech?: string | null;
  gender?: string | null;
  verb_type?: string | null;
  category_id?: string | number | null;
  example_sentence?: string | null;
  example_translation?: string | null;
  conjugation?: string | null;
  notes?: string | null;
  root_word?: string | null;
  is_remembered?: boolean;
};

export async function addVocabWord(payload: VocabWritePayload): Promise<ActionResult> {
  try {
    if (!payload.word?.trim() || !payload.translation?.trim() || !payload.language_code?.trim()) {
      return { error: "Missing required fields." };
    }

    const userId = await requireAuthenticatedUserId();
    const supabase = getServerSupabase();
    const { error } = await supabase.from("vocab").insert([
      {
        user_id: userId,
        language_code: payload.language_code,
        word: payload.word.trim(),
        translation: payload.translation.trim(),
        part_of_speech: payload.part_of_speech || null,
        gender: payload.gender || null,
        verb_type: payload.verb_type || null,
        category_id: payload.category_id || null,
        example_sentence: payload.example_sentence || null,
        example_translation: payload.example_translation || null,
        conjugation: payload.conjugation || null,
        notes: payload.notes || null,
        root_word: payload.root_word || null,
        is_remembered: payload.is_remembered ?? false,
      },
    ]);

    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown server error" };
  }
}

export async function bulkInsertVocabWords(languageCode: string, items: Omit<VocabWritePayload, "language_code">[]): Promise<ActionResult> {
  try {
    if (!languageCode?.trim()) return { error: "Missing language code." };
    if (!Array.isArray(items) || items.length === 0) return {};
    if (items.some((item) => !item.word?.trim() || !item.translation?.trim())) {
      return { error: "Each item must include both word and translation." };
    }

    const userId = await requireAuthenticatedUserId();
    const supabase = getServerSupabase();
    const rows = items.map((item) => ({
      user_id: userId,
      language_code: languageCode,
      word: item.word.trim(),
      translation: item.translation.trim(),
      part_of_speech: item.part_of_speech || null,
      gender: item.gender || null,
      verb_type: item.verb_type || null,
      category_id: item.category_id || null,
      example_sentence: item.example_sentence || null,
      example_translation: item.example_translation || null,
      conjugation: item.conjugation || null,
      notes: item.notes || null,
      root_word: item.root_word || null,
      is_remembered: item.is_remembered ?? false,
    }));

    const { error } = await supabase.from("vocab").insert(rows);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown server error" };
  }
}

export async function bulkDeleteVocab(ids: string[]): Promise<ActionResult> {
  try {
    if (!Array.isArray(ids) || ids.length === 0) return {};
    const normalizedIds = ids.map((id) => id.trim()).filter(Boolean);
    if (normalizedIds.length === 0) return {};

    const userId = await requireAuthenticatedUserId();
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("vocab")
      .delete()
      .in("id", normalizedIds)
      .eq("user_id", userId)
      .select("id");

    if (error) return { error: error.message };
    if (!data || data.length !== normalizedIds.length) {
      return { error: "Some words were not deleted because they are not accessible." };
    }
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown server error" };
  }
}

export type VocabUpdatePayload = {
  word: string;
  translation: string;
  part_of_speech?: string | null;
  notes?: string | null;
  example_sentence?: string | null;
  example_translation?: string | null;
  category_id?: string | number | null;
  conjugation?: string | null;
  gender?: string | null;
  verb_type?: string | null;
  root_word?: string | null;
};

export async function updateVocabWord(wordId: string, payload: VocabUpdatePayload): Promise<ActionResult> {
  try {
    if (!wordId) return { error: "Missing word id." };

    const userId = await requireAuthenticatedUserId();
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("vocab")
      .update({
        word: payload.word,
        translation: payload.translation,
        part_of_speech: payload.part_of_speech || null,
        notes: payload.notes || null,
        example_sentence: payload.example_sentence || null,
        example_translation: payload.example_translation || null,
        category_id: payload.category_id || null,
        conjugation: payload.conjugation || null,
        gender: payload.gender || null,
        verb_type: payload.verb_type || null,
        root_word: payload.root_word || null,
      })
      .eq("id", wordId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error) return { error: error.message };
    if (!data) return { error: "Word not found or not accessible." };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown server error" };
  }
}

export async function setVocabRemembered(wordId: string, isRemembered: boolean): Promise<ActionResult> {
  try {
    if (!wordId) return { error: "Missing word id." };
    const userId = await requireAuthenticatedUserId();
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("vocab")
      .update({ is_remembered: isRemembered })
      .eq("id", wordId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error) return { error: error.message };
    if (!data) return { error: "Word not found or not accessible." };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown server error" };
  }
}

export async function deleteVocabWord(wordId: string): Promise<ActionResult> {
  try {
    if (!wordId) return { error: "Missing word id." };
    const userId = await requireAuthenticatedUserId();
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("vocab")
      .delete()
      .eq("id", wordId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error) return { error: error.message };
    if (!data) return { error: "Word not found or not accessible." };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown server error" };
  }
}

export type StudyResultPayload = {
  wordId: string;
  is_remembered: boolean;
  last_reviewed: string;
  next_review_date: string;
  repetition: number;
  efactor: number;
  interval: number;
  mistake_count: number;
};

export async function applyStudyResult(payload: StudyResultPayload): Promise<ActionResult> {
  try {
    if (!payload.wordId) return { error: "Missing word id." };

    const userId = await requireAuthenticatedUserId();
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("vocab")
      .update({
        is_remembered: payload.is_remembered,
        last_reviewed: payload.last_reviewed,
        next_review_date: payload.next_review_date,
        repetition: payload.repetition,
        efactor: payload.efactor,
        interval: payload.interval,
        mistake_count: payload.mistake_count,
      })
      .eq("id", payload.wordId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error) return { error: error.message };
    if (!data) return { error: "Word not found or not accessible." };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown server error" };
  }
}
