import { validateGame } from "./game.js";

const STORAGE_KEY = "jeopardy-random-game-v1";

export function loadGame(expectedDataVersion) {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const game = JSON.parse(rawValue);
    if (!validateGame(game, expectedDataVersion)) {
      clearGame();
      return null;
    }

    return game;
  } catch (error) {
    console.warn("The saved game could not be loaded.", error);
    clearGame();
    return null;
  }
}

export function saveGame(game) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    return true;
  } catch (error) {
    console.warn("The current game could not be saved.", error);
    return false;
  }
}

export function clearGame() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("The saved game could not be cleared.", error);
  }
}
