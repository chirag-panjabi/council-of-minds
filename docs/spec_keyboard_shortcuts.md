# Keyboard Shortcuts and Accessibility Specification

## Overview

The app must be fully usable without a pointer and conform to WCAG 2.2 AA. Shortcuts are progressive enhancements: every shortcut action has a visible, semantic control and a documented keyboard path.

## 1. Global Shortcuts

| Shortcut | Action | Notes |
| --- | --- | --- |
| `Cmd/Ctrl + K` | Open Global Search / Command Palette | Focus moves to the search field. Closing restores focus to its opener. |
| `Cmd/Ctrl + /` | Focus the active chat composer | No-op with a concise status if the current route has no composer. |
| `Cmd/Ctrl + Shift + S` | Toggle the sidebar | On mobile, follows the drawer focus rules. |
| `Cmd/Ctrl + ,` | Open Settings | Routes to `/settings` and focuses the page heading. |

- Do not register a global shortcut when it would override normal text editing, browser/assistive-technology commands, or an open control's own keyboard behavior. `Cmd/Ctrl + K` remains available from editable controls because it deliberately opens search.
- Display the shortcuts in relevant menus and tooltips; do not require users to memorize them.

## 2. Chat Shortcuts

- `Enter` sends only when focus is in the chat composer, the message is valid, no IME composition is active, and no mention/autocomplete option currently owns the key.
- `Shift + Enter` inserts a newline.
- `Escape` closes the topmost dismissible layer (such as a mention popover or selector). It must not silently dismiss a destructive confirmation or discard unsaved content; those dialogs provide an explicit Cancel action.
- In Council mode, typing `@` opens the persona mention popover only in a valid mention position. The popover supports Arrow keys, Enter to select, Escape to close, and returns the caret to the composer.

## 3. Focus, Dialog, and Live-Region Rules

- A modal uses a labelled dialog pattern, moves focus to the first meaningful control, traps focus while open, makes background content inert, closes with `Escape` when it is safe to do so, and restores focus to the invoker.
- All interactive elements, including icon-only controls, have an accessible name. Use native controls where possible rather than recreating keyboard behavior with generic elements.
- Keep a visible focus indicator with WCAG 2.2 AA-compliant contrast and ensure focused controls are not covered by sticky headers, drawers, or composer controls.
- Use polite live regions for meaningful completed events, such as a finished assistant response or successful export. Do not announce token-by-token streaming updates, decorative typing dots, or repeated status changes.

## 4. Motion and Error Recovery

- Respect `prefers-reduced-motion` for focus transitions, drawers, popovers, and loading indicators.
- Keyboard users must be able to reach, understand, and retry every error state. Errors are conveyed in text, programmatically associated with the relevant control, and never by color alone.
