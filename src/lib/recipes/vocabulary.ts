import vocabularyData from "../../../frontend/data/vocabulary.json";

export type VocabularyData = {
  staples: string[];
  synonyms: Record<string, string>;
  items: string[];
};

const data = vocabularyData as VocabularyData;

const CANONICAL_BY_LOWER = new Map<string, string>();
for (const item of data.items) {
  CANONICAL_BY_LOWER.set(item.toLowerCase(), item);
}

const SYNONYM_TO_CANONICAL = new Map<string, string>();
for (const [alias, canonical] of Object.entries(data.synonyms)) {
  SYNONYM_TO_CANONICAL.set(alias.toLowerCase().trim(), canonical);
}

const STAPLE_SET = new Set(data.staples.map((name) => name.toLowerCase()));

/** All canonical ingredient names (stable order from vocabulary.json). */
export function listVocabulary(): readonly string[] {
  return data.items;
}

/** Synonym map as lowercase alias → canonical display name. */
export function listSynonyms(): ReadonlyMap<string, string> {
  return SYNONYM_TO_CANONICAL;
}

export function isStapleName(name: string): boolean {
  const canonical = normalizeIngredientName(name);
  if (!canonical) return false;
  return STAPLE_SET.has(canonical.toLowerCase());
}

/**
 * Collapse whitespace, strip punctuation noise, resolve synonyms,
 * and return the canonical vocabulary name (or null if unknown).
 */
export function normalizeIngredientName(raw: string): string | null {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/[^a-z0-9\s'-]/g, "")
    .replace(/\s+/g, " ");
  if (!cleaned) return null;

  const fromSynonym = SYNONYM_TO_CANONICAL.get(cleaned);
  if (fromSynonym) return fromSynonym;

  const direct = CANONICAL_BY_LOWER.get(cleaned);
  if (direct) return direct;

  // Try singular-ish / plural-ish fallbacks for common pantry typing.
  if (cleaned.endsWith("es")) {
    const withoutEs = CANONICAL_BY_LOWER.get(cleaned.slice(0, -2));
    if (withoutEs) return withoutEs;
  }
  if (cleaned.endsWith("s")) {
    const withoutS = CANONICAL_BY_LOWER.get(cleaned.slice(0, -1));
    if (withoutS) return withoutS;
  }

  return null;
}

/** Suggestions for autocomplete: names that start with or contain the query. */
export function suggestIngredientNames(query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return data.items.slice(0, limit);

  const starts: string[] = [];
  const contains: string[] = [];
  for (const item of data.items) {
    const lower = item.toLowerCase();
    if (lower.startsWith(q)) starts.push(item);
    else if (lower.includes(q)) contains.push(item);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

export function vocabularySize(): number {
  return data.items.length;
}
