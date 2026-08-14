import { loadManifest, loadRandomGameSelections } from "./data.js";
import {
  advanceRound,
  createGame,
  findClue,
  finishGame,
  formatCurrency,
  getDisplayRoundKey,
  isRoundComplete,
  revealClue,
  scoreClue
} from "./game.js";
import { clearGame, loadGame, saveGame } from "./storage.js";
import {
  fillResultsDialog,
  fillTransitionDialog,
  focusClue,
  focusFirstPlayableClue,
  renderBoard,
  updateDataSummary,
  updateRoundPresentation,
  updateStatus
} from "./ui.js";

const elements = {
  loadingPanel: document.querySelector("#loading-panel"),
  loadingMessage: document.querySelector("#loading-message"),
  errorPanel: document.querySelector("#error-panel"),
  errorMessage: document.querySelector("#error-message"),
  errorTechnicalDetails: document.querySelector("#error-technical-details"),
  retryButton: document.querySelector("#retry-button"),
  returnToGameButton: document.querySelector("#return-to-game-button"),
  roundPanel: document.querySelector("#round-panel"),
  board: document.querySelector("#game-board"),
  score: document.querySelector("#score-value"),
  correct: document.querySelector("#correct-count"),
  wrong: document.querySelector("#wrong-count"),
  answered: document.querySelector("#answered-count"),
  gameAnnouncement: document.querySelector("#game-announcement"),
  helpButton: document.querySelector("#help-button"),
  newGameButton: document.querySelector("#new-game-button"),
  roundKicker: document.querySelector("#round-kicker"),
  roundTitle: document.querySelector("#round-title"),
  roundNote: document.querySelector("#round-note"),
  roundProgress: document.querySelector("#round-progress"),
  boardInstruction: document.querySelector("#board-instruction"),
  dataSummary: document.querySelector("#data-summary"),
  clueDialog: document.querySelector("#clue-dialog"),
  dialogCategory: document.querySelector("#dialog-category"),
  dialogValue: document.querySelector("#dialog-value"),
  dialogClue: document.querySelector("#dialog-clue"),
  dialogResponse: document.querySelector("#dialog-response"),
  responsePanel: document.querySelector("#response-panel"),
  revealButton: document.querySelector("#reveal-button"),
  judgmentActions: document.querySelector("#judgment-actions"),
  correctButton: document.querySelector("#correct-button"),
  wrongButton: document.querySelector("#wrong-button"),
  helpDialog: document.querySelector("#help-dialog"),
  closeHelpButton: document.querySelector("#close-help-button"),
  resetDialog: document.querySelector("#reset-dialog"),
  cancelResetButton: document.querySelector("#cancel-reset-button"),
  confirmResetButton: document.querySelector("#confirm-reset-button"),
  transitionDialog: document.querySelector("#transition-dialog"),
  transitionKicker: document.querySelector("#transition-kicker"),
  transitionTitle: document.querySelector("#transition-title"),
  transitionSummary: document.querySelector("#transition-summary"),
  continueRoundButton: document.querySelector("#continue-round-button"),
  resultsDialog: document.querySelector("#results-dialog"),
  finalScore: document.querySelector("#final-score"),
  finalCorrect: document.querySelector("#final-correct"),
  finalWrong: document.querySelector("#final-wrong"),
  finalAccuracy: document.querySelector("#final-accuracy"),
  finalAnswered: document.querySelector("#final-answered"),
  resultsNewGameButton: document.querySelector("#results-new-game-button")
};

let manifest = null;
let game = null;
let fallbackGame = null;
let activeClueId = null;
let retryAction = null;
let busy = false;
let ignoreNextClueCloseEvent = false;

async function initialize() {
  closeAllDialogs();
  setBusy(true);
  showLoading("Loading the clue database…");

  try {
    manifest = await loadManifest();
    updateDataSummary(manifest, elements.dataSummary);

    const savedGame = loadGame(manifest.dataVersion);
    if (savedGame) {
      game = savedGame;
      fallbackGame = null;
      setBusy(false);
      showGame({ focusBoard: false });
      announce("Saved game restored.");
      return;
    }

    await generateAndDisplayGame({ preserveCurrentGame: false });
  } catch (error) {
    presentError(error, initialize, null);
  }
}

async function generateAndDisplayGame({ preserveCurrentGame = true } = {}) {
  const previousGame = preserveCurrentGame ? game : null;
  fallbackGame = previousGame;
  activeClueId = null;
  closeAllDialogs();
  setBusy(true);
  showLoading("Building a new 61-clue game…");

  try {
    if (!manifest) {
      elements.loadingMessage.textContent = "Loading the clue database…";
      manifest = await loadManifest();
      updateDataSummary(manifest, elements.dataSummary);
    }

    const selections = await loadRandomGameSelections(manifest, (message) => {
      elements.loadingMessage.textContent = message;
    });

    const newGame = createGame(manifest.dataVersion, selections);
    game = newGame;
    fallbackGame = null;
    clearGame();
    saveGame(game);
    setBusy(false);
    showGame({ focusBoard: true });
    announce("New game ready. Round 1 has begun.");
  } catch (error) {
    presentError(
      error,
      () => generateAndDisplayGame({ preserveCurrentGame: Boolean(previousGame) }),
      previousGame
    );
  }
}

function showLoading(message) {
  elements.loadingMessage.textContent = message;
  elements.loadingPanel.hidden = false;
  elements.errorPanel.hidden = true;
  elements.roundPanel.hidden = true;
}

function showGame({ focusBoard = false } = {}) {
  if (!game) {
    return;
  }

  elements.loadingPanel.hidden = true;
  elements.errorPanel.hidden = true;
  elements.roundPanel.hidden = false;
  elements.newGameButton.disabled = false;

  renderCurrentRound();

  requestAnimationFrame(() => {
    if (showRequiredProgressDialog()) {
      return;
    }

    if (focusBoard) {
      focusFirstPlayableClue(elements.board);
    }
  });
}

function renderCurrentRound() {
  if (!game) {
    updateStatus(null, elements);
    return;
  }

  renderBoard(elements.board, game, openClue);
  updateStatus(game, elements);
  updateRoundPresentation(game, elements);
  saveGame(game);
}

function openClue(_categoryId, clueId) {
  if (busy || !game) {
    return;
  }

  const result = findClue(game, clueId);
  if (
    !result ||
    result.roundKey !== game.currentRound ||
    result.clue.status === "correct" ||
    result.clue.status === "wrong"
  ) {
    return;
  }

  activeClueId = clueId;
  elements.dialogCategory.textContent = result.category.name;
  elements.dialogValue.textContent = formatCurrency(result.clue.value);
  elements.dialogClue.textContent = result.clue.clue;
  elements.dialogResponse.textContent = result.clue.response;

  const alreadyRevealed = result.clue.status === "revealed";
  elements.responsePanel.hidden = !alreadyRevealed;
  elements.revealButton.hidden = alreadyRevealed;
  elements.judgmentActions.hidden = !alreadyRevealed;

  if (!elements.clueDialog.open) {
    elements.clueDialog.showModal();
  }

  requestAnimationFrame(() => {
    (alreadyRevealed ? elements.wrongButton : elements.revealButton).focus();
  });
}

function revealActiveClue() {
  if (!activeClueId || !game || !revealClue(game, activeClueId)) {
    return;
  }

  elements.responsePanel.hidden = false;
  elements.revealButton.hidden = true;
  elements.judgmentActions.hidden = false;
  saveGame(game);
  announce("Correct response revealed. Choose whether you were right or wrong.");
  elements.wrongButton.focus();
}

function judgeActiveClue(outcome) {
  if (!activeClueId || !game) {
    return;
  }

  const result = findClue(game, activeClueId);
  if (!result || !scoreClue(game, activeClueId, outcome)) {
    return;
  }

  const value = result.clue.value;
  activeClueId = null;
  if (elements.clueDialog.open) {
    ignoreNextClueCloseEvent = true;
    elements.clueDialog.close();
  }

  if (game.currentRound === "final" && isRoundComplete(game, "final")) {
    finishGame(game);
  }

  renderCurrentRound();
  announce(
    outcome === "correct"
      ? `Correct. ${formatCurrency(value)} added. Your score is ${formatCurrency(game.score)}.`
      : `Incorrect. ${formatCurrency(value)} subtracted. Your score is ${formatCurrency(game.score)}.`
  );

  requestAnimationFrame(() => {
    if (!showRequiredProgressDialog()) {
      focusFirstPlayableClue(elements.board);
    }
  });
}

function showRequiredProgressDialog() {
  if (!game) {
    return false;
  }

  if (game.currentRound === "complete") {
    fillResultsDialog(game, elements);
    if (!elements.resultsDialog.open) {
      elements.resultsDialog.showModal();
    }
    return true;
  }

  if (
    ["round1", "round2"].includes(game.currentRound) &&
    isRoundComplete(game, game.currentRound)
  ) {
    fillTransitionDialog(game, elements);
    if (!elements.transitionDialog.open) {
      elements.transitionDialog.showModal();
    }
    return true;
  }

  return false;
}

function continueToNextRound() {
  if (!game || !advanceRound(game)) {
    return;
  }

  if (elements.transitionDialog.open) {
    elements.transitionDialog.close();
  }

  renderCurrentRound();
  const roundName = game.currentRound === "round2" ? "Double Jeopardy" : "Final Jeopardy";
  announce(`${roundName} has begun.`);
  requestAnimationFrame(() => focusFirstPlayableClue(elements.board));
}

function openHelp() {
  if (!elements.helpDialog.open) {
    elements.helpDialog.showModal();
  }
}

function closeHelp() {
  if (elements.helpDialog.open) {
    elements.helpDialog.close();
  }
}

function requestNewGame() {
  if (busy || !game || elements.resetDialog.open) {
    return;
  }

  elements.resetDialog.showModal();
}

function confirmNewGame() {
  if (elements.resetDialog.open) {
    elements.resetDialog.close();
  }
  generateAndDisplayGame({ preserveCurrentGame: true });
}

function startAnotherGameFromResults() {
  if (elements.resultsDialog.open) {
    elements.resultsDialog.close();
  }
  generateAndDisplayGame({ preserveCurrentGame: true });
}

function presentError(error, retry, previousGame) {
  console.error("The game could not be prepared.", error);
  setBusy(false);
  retryAction = retry;
  fallbackGame = previousGame;

  elements.loadingPanel.hidden = true;
  elements.roundPanel.hidden = true;
  elements.errorPanel.hidden = false;
  elements.newGameButton.disabled = true;

  const fileProtocolHelp = window.location.protocol === "file:"
    ? " Open the project through Phoenix Code Live Preview rather than opening index.html directly."
    : "";

  elements.errorMessage.textContent =
    "The browser could not load or validate the clue files." + fileProtocolHelp;
  elements.errorTechnicalDetails.textContent =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  elements.returnToGameButton.hidden = !previousGame;
}

function returnToSavedGame() {
  if (!fallbackGame) {
    return;
  }

  game = fallbackGame;
  fallbackGame = null;
  retryAction = null;
  setBusy(false);
  showGame({ focusBoard: false });
}

function announce(message) {
  if (!elements.gameAnnouncement) {
    return;
  }

  elements.gameAnnouncement.textContent = "";
  requestAnimationFrame(() => {
    elements.gameAnnouncement.textContent = message;
  });
}

function setBusy(value) {
  busy = value;
  elements.newGameButton.disabled = value || !game;
  elements.retryButton.disabled = value;
  elements.returnToGameButton.disabled = value;
}

function closeAllDialogs() {
  activeClueId = null;

  if (elements.clueDialog.open) {
    ignoreNextClueCloseEvent = true;
    elements.clueDialog.close();
  }

  for (const dialog of [
    elements.helpDialog,
    elements.resetDialog,
    elements.transitionDialog,
    elements.resultsDialog
  ]) {
    if (dialog.open) {
      dialog.close();
    }
  }
}

elements.revealButton.addEventListener("click", revealActiveClue);
elements.correctButton.addEventListener("click", () => judgeActiveClue("correct"));
elements.wrongButton.addEventListener("click", () => judgeActiveClue("wrong"));
elements.helpButton.addEventListener("click", openHelp);
elements.closeHelpButton.addEventListener("click", closeHelp);
elements.newGameButton.addEventListener("click", requestNewGame);
elements.cancelResetButton.addEventListener("click", () => elements.resetDialog.close());
elements.confirmResetButton.addEventListener("click", confirmNewGame);
elements.continueRoundButton.addEventListener("click", continueToNextRound);
elements.resultsNewGameButton.addEventListener("click", startAnotherGameFromResults);
elements.retryButton.addEventListener("click", () => retryAction?.());
elements.returnToGameButton.addEventListener("click", returnToSavedGame);

elements.clueDialog.addEventListener("close", () => {
  if (ignoreNextClueCloseEvent) {
    ignoreNextClueCloseEvent = false;
    return;
  }

  const clueIdToRefocus = activeClueId;
  const shouldRefreshBoard = Boolean(clueIdToRefocus && game);
  activeClueId = null;
  if (shouldRefreshBoard) {
    renderCurrentRound();
    requestAnimationFrame(() => focusClue(elements.board, clueIdToRefocus));
  }
});

elements.helpDialog.addEventListener("click", (event) => {
  if (event.target === elements.helpDialog) {
    elements.helpDialog.close();
  }
});

elements.resetDialog.addEventListener("click", (event) => {
  if (event.target === elements.resetDialog) {
    elements.resetDialog.close();
  }
});

for (const requiredDialog of [elements.transitionDialog, elements.resultsDialog]) {
  requiredDialog.addEventListener("cancel", (event) => event.preventDefault());
}

updateStatus(null, elements);
initialize();
