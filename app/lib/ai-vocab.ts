const POS_LABEL_PATTERN =
  /\b(noun|verb|adjective|adverb|pronoun|preposition|conjunction|interjection|article|determiner|expression|phrase|idiom|particle|numeral|classifier|auxiliary verb|modal verb|proper noun|phrasal verb)\b/i;

export type AiVocabSuccess = {
  status: "ok";
  error?: undefined;
  word: string;
  translation: string;
  part_of_speech: string;
  gender: string | null;
  verb_type: string | null;
  conjugation: string | null;
  example_sentence: string | null;
  example_translation: string | null;
  category_id: string | null;
  root_word: string | null;
  notes: string | null;
};

export type AiVocabNeedsHint = {
  status: "needs_hint";
  reason: string;
  candidates: string[];
  error: string;
  word: string;
  translation: string;
  part_of_speech: string;
  gender: null;
  verb_type: null;
  conjugation: null;
  example_sentence: null;
  example_translation: null;
  category_id: null;
  root_word: null;
  notes: null;
};

export type AiVocabError = {
  status: "error";
  error: string;
  word: string;
  translation: string;
  part_of_speech: string;
  gender: null;
  verb_type: null;
  conjugation: null;
  example_sentence: null;
  example_translation: null;
  category_id: null;
  root_word: null;
  notes: null;
};

type NormalizeAiVocabParams = {
  requestedWord: string;
  allowedCategoryIds?: Set<string>;
};

function stripHintSuffix(value: string): string {
  return value.replace(/\s*\(Hint:\s*[\s\S]*\)\s*$/i, "").trim();
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNullableString(value: unknown): string | null {
  const cleaned = cleanString(value);
  return cleaned || null;
}

function cleanCategoryId(value: unknown, allowedCategoryIds?: Set<string>): string | null {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).trim();
  if (!cleaned) return null;
  if (!/^\d+$/.test(cleaned)) return null;
  if (allowedCategoryIds && !allowedCategoryIds.has(cleaned)) return null;
  return cleaned;
}

function createNeedsHint(reason: string, candidates: string[] = []): AiVocabNeedsHint {
  return {
    status: "needs_hint",
    reason,
    candidates,
    error: "AI needs a more specific hint. Specify the intended part of speech or meaning.",
    word: "",
    translation: "",
    part_of_speech: "",
    gender: null,
    verb_type: null,
    conjugation: null,
    example_sentence: null,
    example_translation: null,
    category_id: null,
    root_word: null,
    notes: null,
  };
}

function parseCandidateList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanString(item))
    .filter(Boolean)
    .slice(0, 5);
}

function hasPosSeparator(value: string): boolean {
  return /[\/;,]/.test(value) || /\b(?:and|or)\b/i.test(value);
}

function isMixedPartOfSpeech(value: string): boolean {
  const normalized = value.toLowerCase().trim();
  return !normalized || hasPosSeparator(normalized);
}

function hasBlendedSenseSignal(value: string): boolean {
  const normalized = value.toLowerCase().trim();
  if (!normalized) return false;

  if (POS_LABEL_PATTERN.test(normalized) && hasPosSeparator(normalized)) {
    return true;
  }

  if (/\b(?:both|either|also)\b/.test(normalized) && POS_LABEL_PATTERN.test(normalized)) {
    return true;
  }

  if (/\b(?:used as|functions as|can be|serves as)\b/.test(normalized) && POS_LABEL_PATTERN.test(normalized)) {
    return true;
  }

  return false;
}

function translationLooksBroad(value: string): boolean {
  return /\s\/\s|;/.test(value);
}

function partOfSpeechIncludes(partOfSpeech: string, label: string): boolean {
  return partOfSpeech.toLowerCase().includes(label.toLowerCase());
}

export function normalizeAiVocabResponse(
  raw: unknown,
  { requestedWord, allowedCategoryIds }: NormalizeAiVocabParams
): AiVocabSuccess | AiVocabNeedsHint {
  if (!raw || typeof raw !== "object") {
    return createNeedsHint("invalid_json_shape");
  }

  const result = raw as Record<string, unknown>;
  const status = cleanString(result.status).toLowerCase();

  if (status === "needs_hint") {
    return createNeedsHint(cleanString(result.reason) || "ambiguous_part_of_speech", parseCandidateList(result.candidates));
  }

  const word = cleanString(result.word) || stripHintSuffix(requestedWord);
  const translation = cleanString(result.translation);
  const partOfSpeech = cleanString(result.part_of_speech);
  const notes = cleanNullableString(result.notes);
  const exampleSentence = cleanNullableString(result.example_sentence);
  const exampleTranslation = cleanNullableString(result.example_translation);

  if (!word || !translation || !partOfSpeech) {
    return createNeedsHint("missing_core_fields");
  }

  if (isMixedPartOfSpeech(partOfSpeech)) {
    return createNeedsHint("ambiguous_part_of_speech");
  }

  if (
    hasBlendedSenseSignal(translation) ||
    hasBlendedSenseSignal(notes || "") ||
    hasBlendedSenseSignal(exampleTranslation || "") ||
    translationLooksBroad(translation)
  ) {
    return createNeedsHint("blended_senses");
  }

  const isNoun = partOfSpeechIncludes(partOfSpeech, "noun");
  const isVerb = partOfSpeechIncludes(partOfSpeech, "verb");

  return {
    status: "ok",
    word,
    translation,
    part_of_speech: partOfSpeech,
    gender: isNoun ? cleanNullableString(result.gender) : null,
    verb_type: cleanNullableString(result.verb_type),
    conjugation: isVerb ? cleanNullableString(result.conjugation) : null,
    example_sentence: exampleSentence,
    example_translation: exampleTranslation,
    category_id: cleanCategoryId(result.category_id, allowedCategoryIds),
    root_word: cleanNullableString(result.root_word),
    notes,
  };
}
