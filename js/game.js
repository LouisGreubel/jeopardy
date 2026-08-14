export const GAME_SCHEMA_VERSION = 2;
export const GAME_MODE = "phase-4-full-game";
export const TOTAL_CLUE_COUNT = 61;

const PLAYABLE_ROUND_KEYS = ["round1", "round2", "final"];
const VALID_ROUND_KEYS = new Set([...PLAYABLE_ROUND_KEYS, "complete"]);
const VALID_CLUE_STATUSES = new Set(["unanswered", "revealed", "correct", "wrong"]);

const ROUND_DEFINITIONS = Object.freeze({
  round1: Object.freeze({
    key: "round1",
    kicker: "Round 1",
    title: "Jeopardy! Round",
    totalClues: 30,
    nextRound: "round2",
    continueLabel: "Start Double Jeopardy!",
    completionTitle: "Jeopardy! Round complete",
    note: "Complete all 30 clues to unlock Double Jeopardy!"
  }),
  round2: Object.freeze({
    key: "round2",
    kicker: "Round 2",
    title: "Double Jeopardy!",
    totalClues: 30,
    nextRound: "final",
    continueLabel: "Start Final Jeopardy!",
    completionTitle: "Double Jeopardy! complete",
    note: "Complete all 30 clues to unlock Final Jeopardy!"
  }),
  final: Object.freeze({
    key: "final",
    kicker: "Final Jeopardy!",
    title: "Final Jeopardy!",
    totalClues: 1,
    nextRound: "complete",
    continueLabel: "View results",
    completionTitle: "Game complete",
    note: "Reveal the final response and score it to finish the game."
  })
});

export function createGame(dataVersion, selections) {
  if (typeof dataVersion !== "string" || dataVersion.trim() === "") {
    throw new TypeError("A data version is required to create a game.");
  }

  if (!selections || typeof selections !== "object") {
    throw new TypeError("Random game selections are required.");
  }

  const roundOneCategories = selections.round1;
  const roundTwoCategories = selections.round2;
  const finalClue = selections.finalClue;

  if (!Array.isArray(roundOneCategories) || roundOneCategories.length !== 6) {
    throw new TypeError("Round 1 must contain exactly six categories.");
  }

  if (!Array.isArray(roundTwoCategories) || roundTwoCategories.length !== 6) {
    throw new TypeError("Round 2 must contain exactly six categories.");
  }

  if (!finalClue || typeof finalClue !== "object") {
    throw new TypeError("A Final Jeopardy clue is required.");
  }

  const game = {
    schemaVersion: GAME_SCHEMA_VERSION,
    mode: GAME_MODE,
    dataVersion,
    gameId: createGameId(),
    createdAt: new Date().toISOString(),
    completedAt: null,
    currentRound: "round1",
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    rounds: {
      round1: {
        key: "round1",
        categories: roundOneCategories.map(prepareCategory)
      },
      round2: {
        key: "round2",
        categories: roundTwoCategories.map(prepareCategory)
      },
      final: {
        key: "final",
        categories: [
          {
            id: `final-category-${finalClue.id}`,
            name: finalClue.category,
            clues: [prepareClue(finalClue)]
          }
        ]
      }
    }
  };

  if (!validateGame(game, dataVersion)) {
    throw new Error("The generated game did not pass its integrity checks.");
  }

  return game;
}

export function getRoundDefinition(roundKey) {
  return ROUND_DEFINITIONS[roundKey] ?? null;
}

export function getRound(game, roundKey = game?.currentRound) {
  if (!game || !PLAYABLE_ROUND_KEYS.includes(roundKey)) {
    return null;
  }

  return game.rounds?.[roundKey] ?? null;
}

export function getDisplayRoundKey(game) {
  if (!game) {
    return "round1";
  }

  return game.currentRound === "complete" ? "final" : game.currentRound;
}

export function findClue(game, clueId) {
  if (!game || typeof clueId !== "string") {
    return null;
  }

  for (const roundKey of PLAYABLE_ROUND_KEYS) {
    const round = getRound(game, roundKey);
    if (!round) {
      continue;
    }

    for (const category of round.categories) {
      const clue = category.clues.find((item) => item.id === clueId);
      if (clue) {
        return { roundKey, round, category, clue };
      }
    }
  }

  return null;
}

export function revealClue(game, clueId) {
  const result = findClue(game, clueId);
  if (
    !result ||
    game.currentRound === "complete" ||
    result.roundKey !== game.currentRound ||
    result.clue.status !== "unanswered"
  ) {
    return false;
  }

  result.clue.status = "revealed";
  return true;
}

export function scoreClue(game, clueId, outcome) {
  const result = findClue(game, clueId);
  if (
    !result ||
    game.currentRound === "complete" ||
    result.roundKey !== game.currentRound ||
    result.clue.status !== "revealed"
  ) {
    return false;
  }

  if (outcome === "correct") {
    game.score += result.clue.value;
    game.correctCount += 1;
    result.clue.status = "correct";
    return true;
  }

  if (outcome === "wrong") {
    game.score -= result.clue.value;
    game.wrongCount += 1;
    result.clue.status = "wrong";
    return true;
  }

  return false;
}

export function advanceRound(game) {
  if (!game || !["round1", "round2"].includes(game.currentRound)) {
    return false;
  }

  if (!isRoundComplete(game, game.currentRound)) {
    return false;
  }

  const definition = getRoundDefinition(game.currentRound);
  game.currentRound = definition.nextRound;
  return true;
}

export function finishGame(game) {
  if (!game || game.currentRound !== "final" || !isRoundComplete(game, "final")) {
    return false;
  }

  game.currentRound = "complete";
  game.completedAt = new Date().toISOString();
  return true;
}

export function getAnsweredCount(game) {
  return Number(game?.correctCount ?? 0) + Number(game?.wrongCount ?? 0);
}

export function getTotalClueCount(game) {
  if (!game?.rounds) {
    return 0;
  }

  return PLAYABLE_ROUND_KEYS.reduce(
    (total, roundKey) => total + getRoundTotalClueCount(game, roundKey),
    0
  );
}

export function getRoundAnsweredCount(game, roundKey) {
  const round = getRound(game, roundKey);
  if (!round) {
    return 0;
  }

  return round.categories.reduce(
    (total, category) =>
      total + category.clues.filter((clue) => clue.status === "correct" || clue.status === "wrong").length,
    0
  );
}

export function getRoundTotalClueCount(game, roundKey) {
  const round = getRound(game, roundKey);
  if (!round) {
    return 0;
  }

  return round.categories.reduce((total, category) => total + category.clues.length, 0);
}

export function getRoundStats(game, roundKey) {
  const round = getRound(game, roundKey);
  const stats = {
    correct: 0,
    wrong: 0,
    answered: 0,
    total: 0,
    scoreChange: 0
  };

  if (!round) {
    return stats;
  }

  for (const category of round.categories) {
    for (const clue of category.clues) {
      stats.total += 1;
      if (clue.status === "correct") {
        stats.correct += 1;
        stats.answered += 1;
        stats.scoreChange += clue.value;
      } else if (clue.status === "wrong") {
        stats.wrong += 1;
        stats.answered += 1;
        stats.scoreChange -= clue.value;
      }
    }
  }

  return stats;
}

export function isRoundComplete(game, roundKey) {
  const total = getRoundTotalClueCount(game, roundKey);
  return total > 0 && getRoundAnsweredCount(game, roundKey) === total;
}

export function getAccuracy(game) {
  const answered = getAnsweredCount(game);
  return answered === 0 ? 0 : game.correctCount / answered;
}

export function formatCurrency(value) {
  const numericValue = Number(value);
  const absoluteValue = Math.abs(Number.isFinite(numericValue) ? numericValue : 0);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(absoluteValue);

  return numericValue < 0 ? `-${formatted}` : formatted;
}

export function formatPercentage(value) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(Number.isFinite(value) ? value : 0);
}

export function validateGame(game, expectedDataVersion) {
  try {
    if (!game || typeof game !== "object") {
      return false;
    }

    if (game.schemaVersion !== GAME_SCHEMA_VERSION || game.mode !== GAME_MODE) {
      return false;
    }

    if (
      typeof game.dataVersion !== "string" ||
      (typeof expectedDataVersion === "string" && game.dataVersion !== expectedDataVersion)
    ) {
      return false;
    }

    if (!VALID_ROUND_KEYS.has(game.currentRound)) {
      return false;
    }

    if (!Number.isInteger(game.score) || !Number.isInteger(game.correctCount) || !Number.isInteger(game.wrongCount)) {
      return false;
    }

    if (game.correctCount < 0 || game.wrongCount < 0 || !game.rounds || typeof game.rounds !== "object") {
      return false;
    }

    const expectedCategoryCounts = { round1: 6, round2: 6, final: 1 };
    const expectedCluesPerCategory = { round1: 5, round2: 5, final: 1 };
    const seenCategoryIds = new Set();
    const seenClueIds = new Set();
    let calculatedCorrect = 0;
    let calculatedWrong = 0;
    let calculatedScore = 0;

    for (const roundKey of PLAYABLE_ROUND_KEYS) {
      const round = game.rounds[roundKey];
      if (!round || round.key !== roundKey || !Array.isArray(round.categories)) {
        return false;
      }

      if (round.categories.length !== expectedCategoryCounts[roundKey]) {
        return false;
      }

      const seenNames = new Set();
      for (const category of round.categories) {
        if (
          !category ||
          typeof category.id !== "string" ||
          typeof category.name !== "string" ||
          category.name.trim() === "" ||
          !Array.isArray(category.clues) ||
          category.clues.length !== expectedCluesPerCategory[roundKey] ||
          seenCategoryIds.has(category.id)
        ) {
          return false;
        }

        seenCategoryIds.add(category.id);
        const normalizedName = normalizeCategoryName(category.name);
        if (seenNames.has(normalizedName)) {
          return false;
        }
        seenNames.add(normalizedName);

        for (const clue of category.clues) {
          if (
            !clue ||
            typeof clue.id !== "string" ||
            seenClueIds.has(clue.id) ||
            !Number.isInteger(clue.value) ||
            clue.value <= 0 ||
            typeof clue.clue !== "string" ||
            clue.clue.trim() === "" ||
            typeof clue.response !== "string" ||
            clue.response.trim() === "" ||
            !VALID_CLUE_STATUSES.has(clue.status)
          ) {
            return false;
          }

          seenClueIds.add(clue.id);
          if (clue.status === "correct") {
            calculatedCorrect += 1;
            calculatedScore += clue.value;
          } else if (clue.status === "wrong") {
            calculatedWrong += 1;
            calculatedScore -= clue.value;
          }
        }
      }
    }

    if (seenClueIds.size !== TOTAL_CLUE_COUNT || getTotalClueCount(game) !== TOTAL_CLUE_COUNT) {
      return false;
    }

    if (
      game.correctCount !== calculatedCorrect ||
      game.wrongCount !== calculatedWrong ||
      game.score !== calculatedScore ||
      getAnsweredCount(game) !== calculatedCorrect + calculatedWrong
    ) {
      return false;
    }

    if (game.currentRound === "round2" && !isRoundComplete(game, "round1")) {
      return false;
    }

    if (
      game.currentRound === "final" &&
      (!isRoundComplete(game, "round1") || !isRoundComplete(game, "round2"))
    ) {
      return false;
    }

    if (
      game.currentRound === "complete" &&
      (!isRoundComplete(game, "round1") ||
        !isRoundComplete(game, "round2") ||
        !isRoundComplete(game, "final"))
    ) {
      return false;
    }

    return true;
  } catch (error) {
    console.warn("A saved game failed validation.", error);
    return false;
  }
}

function prepareCategory(sourceCategory) {
  if (
    !sourceCategory ||
    typeof sourceCategory.id !== "string" ||
    typeof sourceCategory.category !== "string" ||
    !Array.isArray(sourceCategory.clues)
  ) {
    throw new TypeError("A selected category has an invalid shape.");
  }

  return {
    id: sourceCategory.id,
    name: sourceCategory.category,
    clues: sourceCategory.clues.map(prepareClue)
  };
}

function prepareClue(sourceClue) {
  if (
    !sourceClue ||
    typeof sourceClue.id !== "string" ||
    !Number.isInteger(sourceClue.value) ||
    typeof sourceClue.clue !== "string" ||
    typeof sourceClue.response !== "string"
  ) {
    throw new TypeError("A selected clue has an invalid shape.");
  }

  return {
    id: sourceClue.id,
    value: sourceClue.value,
    clue: sourceClue.clue,
    response: sourceClue.response,
    status: "unanswered"
  };
}

function createGameId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `game-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeCategoryName(name) {
  return String(name).normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleUpperCase("en-US");
}
