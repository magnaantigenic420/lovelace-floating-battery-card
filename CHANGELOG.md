# Changelog

All notable changes are documented here.

## [0.1.1] - 2026-08-10

### Fixed

- Execute tap, hold, and double-tap actions through the in-tree Lovelace host so viewport `more-info` actions open correctly.
- Support current Home Assistant action shapes, scoped more-info overrides, and safe URL handling.
- Keep inline and viewport configuration lifecycles consistent, including auto-hide timer resets.
- Detect current Home Assistant editor contexts and keep previews inline, inert, and selectable.
- Integrate viewport and inline modes with Sections grid sizing without leaving empty dashboard gaps.
- Honor mapped unavailable states and keep display precision independent from visibility behavior.
- Validate state mappings and all nested runtime configuration values with field-specific errors.

## [0.1.0] - 2026-08-08

### Added

- Initial Floating Battery Card implementation.
- Viewport portal and inline rendering modes.
- Battery and charging-state parsing.
- Configurable thresholds, colors, icons, positioning, appearance, progress ring, animation, visibility, and actions.
- Graphical Lovelace editor.
- HACS metadata, CI, HACS validation, tests, and release workflow.
