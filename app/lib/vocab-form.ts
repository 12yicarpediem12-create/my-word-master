import type { Category } from "./types";

const LEADING_ARTICLES_REGEX = /^(il |la |lo |l'|i |gli |le |un |uno |una |un'|der |die |das |el |la |los |las |le |la |les |l')/i;

export type DuplicateIndexEntry = {
  cleanWord: string;
  pos: string;
};

export type CategoryHierarchySelection = {
  l1: string;
  l2: string;
  l3: string;
  categoryId: string;
};

export function normalizeWordForLookup(word: string | null | undefined): string {
  return String(word || "").toLowerCase().replace(LEADING_ARTICLES_REGEX, "").trim();
}

export function getComparableLemma(word: string | null | undefined): string {
  return normalizeWordForLookup(word);
}

export function normalizePartOfSpeech(value: string | null | undefined): string {
  return String(value || "").toLowerCase().trim();
}

export function isNounPartOfSpeech(value: string | null | undefined): boolean {
  const normalized = normalizePartOfSpeech(value);
  return (
    /\bnoun\b/.test(normalized) ||
    /^n\.?$/.test(normalized) ||
    normalized === "substantive"
  );
}

export function isVerbPartOfSpeech(value: string | null | undefined): boolean {
  const normalized = normalizePartOfSpeech(value);
  return /\bverb\b/.test(normalized) || /^v\.?$/.test(normalized);
}

function getDisplayArticleForNoun(languageCode: string | null | undefined, gender: string | null | undefined): string | null {
  const lang = String(languageCode || "").toLowerCase();
  const normalizedGender = String(gender || "").toLowerCase();

  if (!normalizedGender) return null;

  const isMasculine = normalizedGender.includes("masc");
  const isFeminine = normalizedGender.includes("fem");
  const isNeuter = normalizedGender.includes("neut");

  if (lang === "it") {
    if (isMasculine && isFeminine) return "il/la";
    if (isMasculine) return "il";
    if (isFeminine) return "la";
  }

  if (lang === "es") {
    if (isMasculine && isFeminine) return "el/la";
    if (isMasculine) return "el";
    if (isFeminine) return "la";
  }

  if (lang === "fr") {
    if (isMasculine && isFeminine) return "le/la";
    if (isMasculine) return "le";
    if (isFeminine) return "la";
  }

  if (lang === "de") {
    if (isMasculine && isFeminine) return "der/die";
    if (isMasculine) return "der";
    if (isFeminine) return "die";
    if (isNeuter) return "das";
  }

  if (lang === "pt") {
    if (isMasculine && isFeminine) return "o/a";
    if (isMasculine) return "o";
    if (isFeminine) return "a";
  }

  return null;
}

export function getWordDisplayLabel(
  word: string | null | undefined,
  languageCode: string | null | undefined,
  partOfSpeech: string | null | undefined,
  gender: string | null | undefined
): string {
  const trimmedWord = String(word || "").trim();
  if (!trimmedWord) return "";
  if (!isNounPartOfSpeech(partOfSpeech)) return trimmedWord;

  const article = getDisplayArticleForNoun(languageCode, gender);
  if (!article) return trimmedWord;
  return `${article} ${trimmedWord}`;
}

export function normalizeRootWord(value: string | null | undefined): string {
  return String(value || "").replace(/^\*/, "").replace(/\s*↗$/, "");
}

export function buildDuplicateIndex(rows: Array<{ word: string; part_of_speech?: string | null }>): DuplicateIndexEntry[] {
  return rows.map((row) => ({
    cleanWord: normalizeWordForLookup(row.word),
    pos: normalizePartOfSpeech(row.part_of_speech),
  }));
}

export function buildDuplicateWordSet(rows: Array<{ word: string }>): Set<string> {
  return new Set(rows.map((row) => normalizeWordForLookup(row.word)));
}

export function hasDuplicateEntry(index: DuplicateIndexEntry[], word: string, partOfSpeech: string | null | undefined): boolean {
  const cleanWord = normalizeWordForLookup(word);
  const pos = normalizePartOfSpeech(partOfSpeech);

  if (!pos) return false;

  return index.some((entry) => entry.cleanWord === cleanWord && entry.pos === pos);
}

export function appendDuplicateEntry(index: DuplicateIndexEntry[], word: string, partOfSpeech: string | null | undefined): DuplicateIndexEntry[] {
  const pos = normalizePartOfSpeech(partOfSpeech);
  if (!pos) return index;

  return [
    ...index,
    {
      cleanWord: normalizeWordForLookup(word),
      pos,
    },
  ];
}

export function resolveCategoryHierarchy(
  categoryId: string | number | null,
  allCats: Category[]
): { l1: string; l2: string; l3: string } {
  if (!categoryId) {
    return { l1: "", l2: "", l3: "" };
  }

  let current = allCats.find((category) => String(category.id) === String(categoryId));
  let l1 = "";
  let l2 = "";
  let l3 = "";

  if (current?.level === 3) {
    l3 = String(current.id);
    current = allCats.find((category) => String(category.id) === String(current?.parent_id));
  }
  if (current?.level === 2) {
    l2 = String(current.id);
    current = allCats.find((category) => String(category.id) === String(current?.parent_id));
  }
  if (current?.level === 1) {
    l1 = String(current.id);
  }

  return { l1, l2, l3 };
}

export function getCategorySelection(categoryId: string | number | null, allCats: Category[]): CategoryHierarchySelection {
  const { l1, l2, l3 } = resolveCategoryHierarchy(categoryId, allCats);

  return {
    l1,
    l2,
    l3,
    categoryId: categoryId ? String(categoryId) : "",
  };
}

export function getCategorySelectionAfterL1Change(value: string): CategoryHierarchySelection {
  return {
    l1: value,
    l2: "",
    l3: "",
    categoryId: value,
  };
}

export function getCategorySelectionAfterL2Change(value: string, l1: string): CategoryHierarchySelection {
  return {
    l1,
    l2: value,
    l3: "",
    categoryId: value || l1,
  };
}

export function getCategorySelectionAfterL3Change(value: string, l1: string, l2: string): CategoryHierarchySelection {
  return {
    l1,
    l2,
    l3: value,
    categoryId: value || l2,
  };
}

export function getCategoryHierarchyOptions(categories: Category[], l1: string, l2: string) {
  return {
    l1Options: categories.filter((category) => category.level === 1),
    l2Options: l1 ? categories.filter((category) => String(category.parent_id) === l1) : [],
    l3Options: l2 ? categories.filter((category) => String(category.parent_id) === l2) : [],
  };
}
