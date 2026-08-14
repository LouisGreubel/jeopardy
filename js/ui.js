import {
  formatCurrency,
  formatPercentage,
  getAccuracy,
  getAnsweredCount,
  getDisplayRoundKey,
  getRound,
  getRoundAnsweredCount,
  getRoundDefinition,
  getRoundStats,
  getRoundTotalClueCount,
  getTotalClueCount
} from "./game.js";

export function renderBoard(boardElement, game, onClueSelected) {
  const roundKey = getDisplayRoundKey(game);
  const round = getRound(game, roundKey);

  boardElement.replaceChildren();
  boardElement.classList.toggle("final-board", roundKey === "final");
  boardElement.dataset.round = roundKey;

  if (!round) {
    boardElement.setAttribute("aria-label", "No active game board");
    return;
  }

  const definition = getRoundDefinition(roundKey);
  boardElement.setAttribute("aria-label", `${definition.title} game board`);

  for (const category of round.categories) {
    const column = document.createElement("section");
    column.className = "category-column";
    column.setAttribute("aria-label", category.name);

    const header = document.createElement("header");
    header.className = `category-header ${getCategoryLengthClass(category.name)}`.trim();
    header.title = category.name;

    const heading = document.createElement("h3");
    heading.textContent = category.name;
    header.append(heading);
    column.append(header);

    for (const clue of category.clues) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `clue-card clue-${clue.status}`;
      button.dataset.clueId = clue.id;
      button.dataset.categoryId = category.id;

      const isCompleted = clue.status === "correct" || clue.status === "wrong";
      const isInactiveRound = game.currentRound === "complete" || roundKey !== game.currentRound;
      button.disabled = isCompleted || isInactiveRound;
      button.setAttribute(
        "aria-label",
        `${category.name} for ${formatCurrency(clue.value)}. ${getClueStatusLabel(clue.status)}`
      );

      const value = document.createElement("span");
      value.className = "clue-value";
      value.textContent = formatCurrency(clue.value);
      button.append(value);

      if (clue.status === "revealed") {
        const pending = document.createElement("span");
        pending.className = "clue-pending";
        pending.textContent = "!";
        pending.setAttribute("aria-hidden", "true");
        button.append(pending);
      }

      if (isCompleted) {
        const result = document.createElement("span");
        result.className = `clue-result ${clue.status}`;
        result.textContent = clue.status === "correct" ? "✓" : "×";
        result.setAttribute("aria-hidden", "true");
        button.append(result);
      }

      button.addEventListener("click", () => onClueSelected(category.id, clue.id));
      column.append(button);
    }

    boardElement.append(column);
  }
}

export function updateStatus(game, elements) {
  const hasGame = Boolean(game);
  elements.score.textContent = formatCurrency(hasGame ? game.score : 0);
  elements.correct.textContent = String(hasGame ? game.correctCount : 0);
  elements.wrong.textContent = String(hasGame ? game.wrongCount : 0);
  elements.answered.textContent = hasGame
    ? `${getAnsweredCount(game)} / ${getTotalClueCount(game)}`
    : "0 / 61";
}

export function updateRoundPresentation(game, elements) {
  const roundKey = getDisplayRoundKey(game);
  const definition = getRoundDefinition(roundKey);
  const answered = getRoundAnsweredCount(game, roundKey);
  const total = getRoundTotalClueCount(game, roundKey);

  elements.roundKicker.textContent = definition.kicker;
  elements.roundTitle.textContent = definition.title;
  elements.roundNote.textContent = definition.note;
  elements.roundProgress.textContent = `${answered} / ${total} clues completed`;
  elements.boardInstruction.textContent =
    roundKey === "final"
      ? "Tap the Final Jeopardy dollar value to open the clue."
      : "Tap any dollar value to open the clue in a large popup.";
}

export function updateDataSummary(manifest, element) {
  const total = manifest?.totals?.playableClueCount;
  if (!Number.isInteger(total)) {
    element.textContent = "Random clue database loaded.";
    return;
  }

  element.textContent = `Randomly generated from ${total.toLocaleString("en-US")} playable clues.`;
}

export function fillTransitionDialog(game, elements) {
  const roundKey = game.currentRound;
  const definition = getRoundDefinition(roundKey);
  const stats = getRoundStats(game, roundKey);

  elements.transitionKicker.textContent = definition.kicker;
  elements.transitionTitle.textContent = definition.completionTitle;
  elements.transitionSummary.textContent =
    `${stats.correct} right, ${stats.wrong} wrong this round. ` +
    `Your current score is ${formatCurrency(game.score)}.`;
  elements.continueRoundButton.textContent = definition.continueLabel;
}

export function fillResultsDialog(game, elements) {
  elements.finalScore.textContent = formatCurrency(game.score);
  elements.finalCorrect.textContent = String(game.correctCount);
  elements.finalWrong.textContent = String(game.wrongCount);
  elements.finalAccuracy.textContent = formatPercentage(getAccuracy(game));
  elements.finalAnswered.textContent = `${getAnsweredCount(game)} / ${getTotalClueCount(game)}`;
}

export function focusClue(boardElement, clueId) {
  if (!boardElement || typeof clueId !== "string") {
    return false;
  }

  const button = Array.from(boardElement.querySelectorAll(".clue-card")).find(
    (item) => item.dataset.clueId === clueId
  );

  if (!button) {
    return false;
  }

  button.focus({ preventScroll: true });
  return true;
}

export function focusFirstPlayableClue(boardElement) {
  boardElement.querySelector(".clue-card:not(:disabled)")?.focus({ preventScroll: true });
}

function getCategoryLengthClass(name) {
  const length = String(name).replace(/\s+/g, " ").trim().length;
  if (length >= 45) {
    return "category-header-very-long";
  }

  if (length >= 29) {
    return "category-header-long";
  }

  return "";
}

function getClueStatusLabel(status) {
  if (status === "correct") {
    return "Answered correctly.";
  }

  if (status === "wrong") {
    return "Answered incorrectly.";
  }

  if (status === "revealed") {
    return "Response revealed but not yet scored. Select to reopen the clue.";
  }

  return "Unanswered. Select to open the clue.";
}
