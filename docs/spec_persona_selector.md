# Unified Persona Selector Specification

## Purpose

The Unified Persona Selector is a local modal used to choose a persona for 1-on-1 setup, Council roster changes, a synthesizer slot, or a future session. It never queries a marketplace.

## Data and Filters

The selector reads available local and shipped-default personas from IndexedDB. It supports literal search by name, description, and tags, plus Favorites, Recently Used, Custom, Default, and Archived filters where applicable.

Recently Used metadata is written to IndexedDB only when a non-Incognito session successfully starts. Incognito selection must not update it.

## Selection Behavior

- 1-on-1 mode allows exactly one selected persona.
- Council mode allows multiple active personas and separately selects at most one synthesizer.
- A click marks a candidate; the footer confirms the choice. Enter confirms only when a candidate is already marked.
- The caller receives the selected persona identifiers and creates a persona snapshot when the session starts.
- Creating a new persona opens the creator flow and returns the user to the selector with focus restored after a successful save.

## Empty and Error States

When no selectable personas exist, the selector offers a Create Persona action. If a stored persona cannot be read or validated, it is skipped from the normal list and the user receives a recovery path rather than a broken modal.

## Accessibility and Scale

The modal traps focus, restores it on close, supports arrow-key navigation, uses accessible selected-state announcements, and virtualizes large result sets. Escape closes without changing the caller's existing selection.
