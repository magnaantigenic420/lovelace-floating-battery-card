# AGENTS.md

## Purpose

This repository contains a Home Assistant Lovelace custom card distributed through HACS as `floating-battery-card.js`.

## Invariants

- `custom:floating-battery-card` must remain standalone: no runtime custom-card dependencies.
- Viewport mode must render outside Lovelace layout ancestors so scrolling/transforms cannot capture fixed positioning.
- A viewport card host must not consume visible dashboard space.
- One card instance owns at most one body-level overlay and must remove it on disconnect.
- Editor preview must remain inline.
- `shape: circle` must always produce equal rendered width and height.
- User configuration is declarative; never add `eval`, `Function`, or arbitrary JS templates.
- Keep `hacs.json` filename aligned with `dist/floating-battery-card.js`.

## Commands

- `npm install`
- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run check`

## Architecture

- `src/floating-battery-card.ts`: Lovelace host, registration, portal lifecycle.
- `src/floating-battery-overlay.ts`: rendered control and interaction.
- `src/editor.ts`: graphical editor.
- `src/battery.ts`: pure battery parsing/state/icon/threshold logic.
- `src/normalize.ts`: defaults and config normalization.
- `src/position.ts`: pure viewport/inline position calculation.
- `src/utils.ts`: CSS/color/editor helpers.
- `tests/`: unit tests.
- `dist/`: generated release artifact; do not hand-edit.

## Release

Update version in `package.json`, `src/defaults.ts`, and CHANGELOG.md, run `npm run check`, commit, tag `vX.Y.Z`, and push the tag. The release workflow builds and attaches `dist/floating-battery-card.js`.
