## ADDED Requirements

### Requirement: ThemeProvider and useTheme hook
The client SHALL provide a `ThemeProvider` context and a `useTheme` hook. `useTheme` SHALL expose the active theme id and a `setTheme` function. The application SHALL be wrapped in `ThemeProvider` at the root.

#### Scenario: Reading the active theme
- **WHEN** a component calls `useTheme()`
- **THEN** it receives the currently active theme id

#### Scenario: Setting the active theme
- **WHEN** a component calls `setTheme("linear")`
- **THEN** the active theme becomes `linear` and the root element's `data-theme` attribute is set to `linear`

### Requirement: Theme applied to the root element
The theme SHALL be applied by setting the `data-theme` attribute on the document root element (`<html>`), and every component SHALL restyle accordingly without a page reload.

#### Scenario: Root attribute reflects the theme
- **WHEN** the active theme changes
- **THEN** `document.documentElement.dataset.theme` equals the new theme id

### Requirement: Theme persists across reloads
The active theme SHALL be persisted in `localStorage` and restored when the application loads.

#### Scenario: Persisted theme restored
- **WHEN** a user selects a theme and later reloads the page
- **THEN** the selected theme is restored without further interaction

#### Scenario: First visit uses the default
- **WHEN** no persisted theme exists
- **THEN** the default theme (Classic Amber) is active

#### Scenario: Invalid persisted value falls back
- **WHEN** the persisted value is not a known theme id
- **THEN** the default theme (Classic Amber) is active

### Requirement: ThemeSwitcher in the Header
The client SHALL provide a theme switcher control in the Header that lists all four themes and applies the selected theme. The switcher SHALL indicate the current selection.

#### Scenario: Selecting a theme from the switcher
- **WHEN** a user opens the switcher and selects a theme
- **THEN** the theme is applied immediately and indicated as selected

#### Scenario: Preview of themes
- **WHEN** the switcher is open
- **THEN** each theme option displays a visual preview (e.g., a dot using that theme's accent and surface colors) alongside its label
