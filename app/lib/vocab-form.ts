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

function getComparableSurfaceLemma(word: string): string {
  return word
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getComparableRootLemma(rootWord: string): string {
  return normalizeRootWord(rootWord)
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getRootLanguageLabel(rootWord: string): string {
  const match = normalizeRootWord(rootWord).match(/\(([^)]+)\)\s*$/);
  return match ? match[1].trim().toLowerCase() : "";
}

function getCurrentLanguageLabels(languageCode: string): string[] {
  const normalized = languageCode.trim().toLowerCase();

  if (normalized === "it") return ["italian", "italiano"];
  if (normalized === "es") return ["spanish", "espanol", "español"];
  if (normalized === "fr") return ["french", "francais", "français"];
  if (normalized === "de") return ["german", "deutsch"];
  if (normalized === "pt") return ["portuguese", "portugues", "português"];

  return [normalized];
}

function isRomanceLanguageCode(languageCode: string): boolean {
  const normalized = languageCode.trim().toLowerCase();
  return normalized === "it" || normalized === "es" || normalized === "fr" || normalized === "pt";
}

function getBigramDiceCoefficient(left: string, right: string): number {
  if (left === right) return 1;
  if (left.length < 2 || right.length < 2) return 0;

  const leftBigrams = new Map<string, number>();
  for (let index = 0; index < left.length - 1; index++) {
    const gram = left.slice(index, index + 2);
    leftBigrams.set(gram, (leftBigrams.get(gram) || 0) + 1);
  }

  let overlap = 0;
  for (let index = 0; index < right.length - 1; index++) {
    const gram = right.slice(index, index + 2);
    const count = leftBigrams.get(gram) || 0;
    if (count > 0) {
      overlap += 1;
      leftBigrams.set(gram, count - 1);
    }
  }

  return (2 * overlap) / ((left.length - 1) + (right.length - 1));
}

function looksOpaqueHistoricalRoot(word: string, rootWord: string, languageCode: string): boolean {
  if (!isRomanceLanguageCode(languageCode)) return false;

  const rootLanguage = getRootLanguageLabel(rootWord);
  if (rootLanguage !== "latin") return false;

  const surfaceLemma = getComparableSurfaceLemma(word);
  const rootLemma = getComparableRootLemma(rootWord);

  if (surfaceLemma.length < 5 || rootLemma.length < 5) return false;

  const similarity = getBigramDiceCoefficient(surfaceLemma, rootLemma);

  return similarity < 0.32;
}

export function isSuspiciousRootWord(
  word: string | null | undefined,
  rootWord: string | null | undefined,
  languageCode: string | null | undefined
): boolean {
  const normalizedRoot = normalizeRootWord(rootWord);
  const normalizedLanguage = String(languageCode || "").trim().toLowerCase();
  const surfaceWord = String(word || "").trim();

  if (!normalizedRoot || !normalizedLanguage || !surfaceWord) return false;

  if (!/^.+ \([A-Za-z][A-Za-z\s-]*\)$/.test(normalizedRoot)) {
    return true;
  }

  if (/\((?:Late Latin|Vulgar Latin|Medieval Latin|Post-Classical Latin)\)$/i.test(normalizedRoot)) {
    return true;
  }

  const rootLanguage = getRootLanguageLabel(normalizedRoot);
  if (getCurrentLanguageLabels(normalizedLanguage).includes(rootLanguage)) {
    return true;
  }

  const rootLemma = getComparableRootLemma(normalizedRoot);
  const surfaceLemma = getComparableSurfaceLemma(surfaceWord);

  if (rootLemma === surfaceLemma) {
    return true;
  }

  return looksOpaqueHistoricalRoot(surfaceWord, normalizedRoot, normalizedLanguage);
}

export function sanitizeRootWordForImport(
  word: string | null | undefined,
  rootWord: string | null | undefined,
  languageCode: string | null | undefined
): string {
  const normalizedRoot = normalizeRootWord(rootWord);
  if (!normalizedRoot) return "";
  return isSuspiciousRootWord(word, normalizedRoot, languageCode) ? "" : normalizedRoot;
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
