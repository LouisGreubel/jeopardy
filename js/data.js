const MANIFEST_PATH = "./data/manifest.json";
const EXPECTED_MANIFEST_SCHEMA_VERSION = 2;
const CATEGORIES_PER_ROUND = 6;
const MAX_CATEGORY_SHARD_ATTEMPTS = 8;

export class DataLoadError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "DataLoadError";
  }
}

export async function loadManifest() {
  const response = await fetch(MANIFEST_PATH, { cache: "no-cache" });
  if (!response.ok) {
    throw new DataLoadError(`The clue manifest request failed with status ${response.status}.`);
  }

  let manifest;
  try {
    manifest = await response.json();
  } catch (error) {
    throw new DataLoadError("The clue manifest is not valid JSON.", { cause: error });
  }

  validateManifest(manifest);
  return manifest;
}

export async function loadRandomGameSelections(manifest, onProgress = () => {}) {
  validateManifest(manifest);

  onProgress("Choosing six Jeopardy! Round categories…");
  const round1 = await loadRandomCategorySet(manifest, "1", CATEGORIES_PER_ROUND);

  onProgress("Choosing six Double Jeopardy! categories…");
  const round2 = await loadRandomCategorySet(manifest, "2", CATEGORIES_PER_ROUND);

  onProgress("Choosing a Final Jeopardy! clue…");
  const finalClue = await loadRandomFinalClue(manifest);

  return { round1, round2, finalClue };
}

export function validateManifest(manifest) {
  if (!manifest || typeof manifest !== "object") {
    throw new DataLoadError("The clue manifest is missing or invalid.");
  }

  if (manifest.schemaVersion !== EXPECTED_MANIFEST_SCHEMA_VERSION) {
    throw new DataLoadError(
      `This app expects data schema ${EXPECTED_MANIFEST_SCHEMA_VERSION}, but the manifest uses ${manifest.schemaVersion}.`
    );
  }

  if (typeof manifest.dataVersion !== "string" || manifest.dataVersion.trim() === "") {
    throw new DataLoadError("The clue manifest does not contain a data version.");
  }

  validateCategoryRoundMetadata(manifest.rounds?.["1"], "Round 1");
  validateCategoryRoundMetadata(manifest.rounds?.["2"], "Round 2");
  validateFinalRoundMetadata(manifest.rounds?.final);

  const playableClueCount = manifest.totals?.playableClueCount;
  if (!Number.isInteger(playableClueCount) || playableClueCount < 61) {
    throw new DataLoadError("The clue manifest contains an invalid playable-clue total.");
  }
}

export function randomInt(maxExclusive) {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError("randomInt requires a positive safe integer.");
  }

  if (globalThis.crypto?.getRandomValues) {
    const range = 0x100000000;
    const limit = Math.floor(range / maxExclusive) * maxExclusive;
    const values = new Uint32Array(1);
    let value;

    do {
      globalThis.crypto.getRandomValues(values);
      value = values[0];
    } while (value >= limit);

    return value % maxExclusive;
  }

  return Math.floor(Math.random() * maxExclusive);
}

export function selectUniqueCategories(items, count = CATEGORIES_PER_ROUND) {
  if (!Array.isArray(items) || !Number.isInteger(count) || count <= 0) {
    return [];
  }

  const shuffled = [...items];
  shuffleInPlace(shuffled);

  const selected = [];
  const names = new Set();

  for (const category of shuffled) {
    if (!isValidCategoryRecord(category)) {
      continue;
    }

    const normalizedName = normalizeCategoryName(category.category);
    if (names.has(normalizedName)) {
      continue;
    }

    names.add(normalizedName);
    selected.push(category);

    if (selected.length === count) {
      return selected;
    }
  }

  return selected;
}

async function loadRandomCategorySet(manifest, sourceRoundKey, count) {
  const roundMetadata = manifest.rounds[sourceRoundKey];
  const expectedKind = sourceRoundKey === "1" ? "round1-categories" : "round2-categories";
  const attemptedShardIndexes = new Set();
  const maximumAttempts = Math.min(MAX_CATEGORY_SHARD_ATTEMPTS, roundMetadata.shards.length);

  while (attemptedShardIndexes.size < maximumAttempts) {
    const shardIndex = chooseWeightedShardIndex(roundMetadata.shards, attemptedShardIndexes);
    attemptedShardIndexes.add(shardIndex);

    const shardMetadata = roundMetadata.shards[shardIndex];
    const payload = await fetchShard(shardMetadata, manifest.dataVersion);
    validateShardEnvelope(payload, expectedKind, shardMetadata);

    const validItems = payload.items.filter((item) =>
      isValidCategoryRecord(item, roundMetadata.expectedValues)
    );
    const selected = selectUniqueCategories(validItems, count);

    if (selected.length === count) {
      return selected;
    }
  }

  throw new DataLoadError(
    `The app could not find ${count} distinct category names after checking ${maximumAttempts} data shards.`
  );
}

async function loadRandomFinalClue(manifest) {
  const roundMetadata = manifest.rounds.final;
  const shardIndex = chooseWeightedShardIndex(roundMetadata.shards);
  const shardMetadata = roundMetadata.shards[shardIndex];
  const payload = await fetchShard(shardMetadata, manifest.dataVersion);
  validateShardEnvelope(payload, "final-clues", shardMetadata);

  const validItems = payload.items.filter(isValidFinalClue);
  if (validItems.length === 0) {
    throw new DataLoadError(`The selected Final Jeopardy shard ${shardMetadata.path} has no usable clues.`);
  }

  return validItems[randomInt(validItems.length)];
}

async function fetchShard(shardMetadata, dataVersion) {
  const path = shardMetadata?.path;
  if (typeof path !== "string" || path.trim() === "") {
    throw new DataLoadError("A clue shard has no valid path in the manifest.");
  }

  const versionQuery = typeof dataVersion === "string" && dataVersion.trim() !== ""
    ? `?v=${encodeURIComponent(dataVersion)}`
    : "";
  const response = await fetch(`./data/${path}${versionQuery}`);
  if (!response.ok) {
    throw new DataLoadError(`The clue file ${path} failed to load with status ${response.status}.`);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new DataLoadError(`The clue file ${path} is not valid JSON.`, { cause: error });
  }
}

function validateCategoryRoundMetadata(metadata, label) {
  if (!metadata || metadata.kind !== "category-shards") {
    throw new DataLoadError(`${label} category-shard metadata is missing.`);
  }

  if (
    !Number.isInteger(metadata.categoryCount) ||
    metadata.categoryCount < CATEGORIES_PER_ROUND ||
    !Array.isArray(metadata.expectedValues) ||
    metadata.expectedValues.length !== 5
  ) {
    throw new DataLoadError(`${label} metadata contains invalid category counts or clue values.`);
  }

  validateShardList(metadata.shards, label);
}

function validateFinalRoundMetadata(metadata) {
  if (!metadata || metadata.kind !== "clue-shards") {
    throw new DataLoadError("Final Jeopardy shard metadata is missing.");
  }

  if (!Number.isInteger(metadata.clueCount) || metadata.clueCount < 1) {
    throw new DataLoadError("Final Jeopardy metadata contains an invalid clue count.");
  }

  validateShardList(metadata.shards, "Final Jeopardy");
}

function validateShardList(shards, label) {
  if (!Array.isArray(shards) || shards.length === 0) {
    throw new DataLoadError(`${label} does not contain any clue shards.`);
  }

  for (const shard of shards) {
    if (
      !shard ||
      typeof shard.path !== "string" ||
      !Number.isInteger(shard.count) ||
      shard.count <= 0
    ) {
      throw new DataLoadError(`${label} contains invalid shard metadata.`);
    }
  }
}

function validateShardEnvelope(payload, expectedKind, shardMetadata) {
  if (
    !payload ||
    payload.schemaVersion !== EXPECTED_MANIFEST_SCHEMA_VERSION ||
    payload.kind !== expectedKind ||
    !Array.isArray(payload.items)
  ) {
    throw new DataLoadError(`The clue file ${shardMetadata.path} has an unexpected structure.`);
  }

  if (payload.items.length !== shardMetadata.count) {
    throw new DataLoadError(
      `The clue file ${shardMetadata.path} contains ${payload.items.length} records; the manifest expected ${shardMetadata.count}.`
    );
  }
}

function isValidCategoryRecord(category, expectedValues = null) {
  if (
    !category ||
    typeof category.id !== "string" ||
    typeof category.category !== "string" ||
    category.category.trim() === "" ||
    !Array.isArray(category.clues) ||
    category.clues.length !== 5
  ) {
    return false;
  }

  const values = [];
  for (const clue of category.clues) {
    if (!isValidClue(clue)) {
      return false;
    }
    values.push(clue.value);
  }

  if (Array.isArray(expectedValues)) {
    return values.every((value, index) => value === expectedValues[index]);
  }

  return true;
}

function isValidFinalClue(clue) {
  return (
    isValidClue(clue) &&
    typeof clue.category === "string" &&
    clue.category.trim() !== ""
  );
}

function isValidClue(clue) {
  return (
    clue &&
    typeof clue.id === "string" &&
    Number.isInteger(clue.value) &&
    clue.value > 0 &&
    typeof clue.clue === "string" &&
    clue.clue.trim() !== "" &&
    typeof clue.response === "string" &&
    clue.response.trim() !== ""
  );
}

function chooseWeightedShardIndex(shards, excludedIndexes = new Set()) {
  const available = shards
    .map((shard, index) => ({ shard, index }))
    .filter(({ index }) => !excludedIndexes.has(index));

  if (available.length === 0) {
    throw new DataLoadError("No untried clue shards remain.");
  }

  const totalWeight = available.reduce((total, { shard }) => total + shard.count, 0);
  let target = randomInt(totalWeight);

  for (const { shard, index } of available) {
    if (target < shard.count) {
      return index;
    }
    target -= shard.count;
  }

  return available[available.length - 1].index;
}

function shuffleInPlace(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
}

function normalizeCategoryName(name) {
  return String(name).normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleUpperCase("en-US");
}
