import { getContext, setContext } from 'svelte';
import type { GamePageController } from './controller';

const GAME_PAGE_CONTEXT = Symbol('game-page');

export const setGamePageContext = (controller: GamePageController) => {
  setContext(GAME_PAGE_CONTEXT, controller);
};

export const getGamePageContext = () => {
  const controller = getContext<GamePageController>(GAME_PAGE_CONTEXT);
  if (!controller) {
    throw new Error('Game page context not set');
  }
  return controller;
};
