'use client';

import * as React from 'react';

type FocusHandler = (event: Event) => void;

/**
 * The element that should get focus back when a modal closes.
 *
 * Radix only restores focus to a `<DialogTrigger>`. Most dialogs here are
 * opened from a plain button or a dropdown-menu item, so focus would fall to
 * `<body>` and keyboard users lose their place. A menu item disappears with its
 * menu, so the menu's own trigger is the sensible target in that case.
 */
function findOpener(): HTMLElement | null {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || active === document.body) return null;
  const menu = active.closest('[role="menu"]');
  if (!menu) return active;
  const triggerId = menu.getAttribute('aria-labelledby');
  return triggerId ? document.getElementById(triggerId) : null;
}

/**
 * Handlers for Radix `Dialog.Content` / `AlertDialog.Content` that remember the
 * opener when the dialog takes focus and return focus to it on close. Pass the
 * caller's own handlers so they still run first (and can cancel the return by
 * calling `preventDefault`).
 */
export function useFocusReturn(handlers: {
  onOpenAutoFocus?: FocusHandler;
  onCloseAutoFocus?: FocusHandler;
} = {}) {
  const opener = React.useRef<HTMLElement | null>(null);
  const { onOpenAutoFocus, onCloseAutoFocus } = handlers;

  return {
    onOpenAutoFocus: (event: Event) => {
      // Focus has not moved into the dialog yet, so this is still the opener.
      opener.current = findOpener();
      onOpenAutoFocus?.(event);
    },
    onCloseAutoFocus: (event: Event) => {
      onCloseAutoFocus?.(event);
      if (event.defaultPrevented) return;
      const target = opener.current;
      opener.current = null;
      if (target?.isConnected) {
        event.preventDefault();
        target.focus();
      }
    }
  };
}
