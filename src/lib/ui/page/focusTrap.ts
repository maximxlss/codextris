import { tick } from 'svelte';
import { getFocusableElements, trapFocusWithin } from '$lib/game/ui/modals';

type FocusTrapDeps = {
  isTrapOpen: () => boolean;
  getActiveModalEl: () => HTMLElement | null;
};

export const createFocusTrap = (deps: FocusTrapDeps) => {
  let trapActive = false;
  let lastFocused: Element | null = null;

  const trapFocus = (event: KeyboardEvent) => {
    if (!deps.isTrapOpen() || event.key !== 'Tab') return;
    trapFocusWithin(deps.getActiveModalEl(), event);
  };

  const update = (_isOpen?: boolean) => {
    void _isOpen;
    if (deps.isTrapOpen() && !trapActive) {
      trapActive = true;
      lastFocused = document.activeElement;
      tick().then(() => {
        const modalEl = deps.getActiveModalEl();
        const focusable = getFocusableElements(modalEl);
        if (focusable[0]) {
          focusable[0].focus();
        } else {
          modalEl?.focus();
        }
      });
      document.addEventListener('keydown', trapFocus);
      return;
    }

    if (!deps.isTrapOpen() && trapActive) {
      trapActive = false;
      document.removeEventListener('keydown', trapFocus);
      if (lastFocused instanceof HTMLElement) {
        lastFocused.focus();
      }
    }
  };

  const cleanup = () => {
    if (!trapActive) return;
    trapActive = false;
    document.removeEventListener('keydown', trapFocus);
  };

  return {
    update,
    cleanup
  };
};
