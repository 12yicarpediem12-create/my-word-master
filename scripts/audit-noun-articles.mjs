import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const envFilePath = path.join(projectRoot, ".env.local");

const LEADING_ARTICLES_REGEX =
  /^(il |la |lo |l'|i |gli |le |un |uno |una |un'|der |die |das |el |la |los |las |le |la |les |l')/i;

function printHelp() {
  console.log(`
Noun Article Audit (dry-run only)

Usage:
  node scripts/audit-noun-articles.mjs

What it does:
  - reads vocab rows from Supabase
  - finds noun records whose stored "word" begins with an article
  - counts affected rows by language
  - shows sample rows
  - detects possible same-language same-word same-POS collisions after stripping articles

Environment:
  - loads .env.local if present
  - uses SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
  - prefers SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY
  - falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY for read-only access if needed

This script never writes to the database.
`.trim());
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key]) continue;

    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function getNonEmptyEnv(name) {
  const value = process.env[name];
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function getSupabaseUrl() {
  return getNonEmptyEnv("SUPABASE_URL") || getNonEmptyEnv("NEXT_PUBLIC_SUPABASE_URL");
}

function getSupabaseKey() {
  return (
    getNonEmptyEnv("SUPABASE_SERVICE_ROLE_KEY") ||
    getNonEmptyEnv("SUPABASE_SERVICE_KEY") ||
    getNonEmptyEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}

function normalizePartOfSpeech(value) {
  return String(value || "").toLowerCase().trim();
}

function normalizeWord(value) {
  return String(value || "").toLowerCase().trim();
}

function stripLeadingArticle(value) {
  return String(value || "").replace(LEADING_ARTICLES_REGEX, "").trim();
}

function detectLeadingArticle(value) {
  const match = String(value || "").match(LEADING_ARTICLES_REGEX);
  return match?.[0]?.trim() || null;
}

function isNounRow(row) {
  return /\bnoun\b/i.test(normalizePartOfSpeech(row.part_of_speech));
}

async function fetchAllVocabRows(supabase) {
  const pageSize = 1000;
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from("vocab")
      .select("id, language_code, word, part_of_speech, gender, translation")
      .order("language_code", { ascending: true })
      .order("word", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const batch = data || [];
    rows.push(...batch);

    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

function summarizeByLanguage(rows) {
  const summary = new Map();

  for (const row of rows) {
    const entry = summary.get(row.language_code) || {
      language_code: row.language_code,
      count: 0,
      sample: [],
    };

    entry.count += 1;
    if (entry.sample.length < 5) {
      entry.sample.push({
        id: row.id,
        word: row.word,
        lemma_if_stripped: stripLeadingArticle(row.word),
        article: detectLeadingArticle(row.word),
        pos: row.part_of_speech || "",
        gender: row.gender || "",
      });
    }

    summary.set(row.language_code, entry);
  }

  return Array.from(summary.values()).sort((a, b) => b.count - a.count);
}

function findCollisionGroups(nounRowsWithArticles, allNounRows) {
  const groups = new Map();

  for (const row of allNounRows) {
    const key = [
      row.language_code,
      normalizePartOfSpeech(row.part_of_speech),
      normalizeWord(stripLeadingArticle(row.word)),
    ].join("|");

    const group = groups.get(key) || [];
    group.push({
      id: row.id,
      language_code: row.language_code,
      original_word: row.word,
      stripped_word: stripLeadingArticle(row.word),
      article: detectLeadingArticle(row.word),
      part_of_speech: row.part_of_speech || "",
      gender: row.gender || "",
      translation: row.translation || "",
      has_leading_article: Boolean(detectLeadingArticle(row.word)),
    });
    groups.set(key, group);
  }

  const candidateIds = new Set(nounRowsWithArticles.map((row) => row.id));

  return Array.from(groups.entries())
    .filter(([, rows]) => rows.length > 1 && rows.some((row) => candidateIds.has(row.id)))
    .map(([key, rows]) => ({
      key,
      language_code: rows[0]?.language_code || "",
      stripped_word: rows[0]?.stripped_word || "",
      part_of_speech: rows[0]?.part_of_speech || "",
      count: rows.length,
      rows,
    }))
    .sort((a, b) => b.count - a.count);
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    return;
  }

  loadEnvFile(envFilePath);

  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  if (!url || !key) {
    throw new Error(
      "Missing Supabase configuration. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL, plus a readable Supabase key."
    );
  }

  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const allRows = await fetchAllVocabRows(supabase);
  const nounRows = allRows.filter(isNounRow);
  const nounRowsWithArticles = nounRows.filter((row) => Boolean(detectLeadingArticle(row.word)));
  const languageSummary = summarizeByLanguage(nounRowsWithArticles);
  const collisionGroups = findCollisionGroups(nounRowsWithArticles, nounRows);

  console.log("\nNOUN ARTICLE AUDIT (dry-run only)");
  console.log("=".repeat(72));
  console.log(`Total vocab rows checked: ${allRows.length}`);
  console.log(`Total noun rows checked: ${nounRows.length}`);
  console.log(`Noun rows with leading articles in stored word: ${nounRowsWithArticles.length}`);
  console.log(`Languages affected: ${languageSummary.length}`);
  console.log(`Possible post-strip same-language same-word same-POS collision groups: ${collisionGroups.length}`);

  if (languageSummary.length > 0) {
    console.log("\nCounts by language");
    console.table(
      languageSummary.map((entry) => ({
        language_code: entry.language_code,
        rows_with_articles: entry.count,
      }))
    );

    console.log("\nSample rows by language");
    for (const entry of languageSummary) {
      console.log(`\n[${entry.language_code}] sample affected rows`);
      console.table(entry.sample);
    }
  } else {
    console.log("\nNo noun rows with leading articles were found.");
  }

  if (collisionGroups.length > 0) {
    console.log("\nPossible collisions after stripping leading articles");
    for (const group of collisionGroups.slice(0, 25)) {
      console.log(
        `\n[${group.language_code}] lemma="${group.stripped_word}" pos="${group.part_of_speech}" rows=${group.count}`
      );
      console.table(
        group.rows.map((row) => ({
          id: row.id,
          original_word: row.original_word,
          stripped_word: row.stripped_word,
          article: row.article || "",
          gender: row.gender,
          translation: row.translation,
          has_leading_article: row.has_leading_article,
        }))
      );
    }

    if (collisionGroups.length > 25) {
      console.log(`\n... ${collisionGroups.length - 25} additional collision groups omitted from console output.`);
    }
  } else {
    console.log("\nNo collisions were detected after simulated article stripping.");
  }

  console.log("\nAudit complete. No data was modified.");
}

main().catch((error) => {
  console.error("\nAudit failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
