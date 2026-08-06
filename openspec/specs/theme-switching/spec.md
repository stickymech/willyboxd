# theme-switching Specification

## Purpose
Runtime theme switching has been removed. The app ships a single fixed palette (Linear); there is no `ThemeProvider`, `useTheme` hook, or theme switcher.

## Requirements
### Requirement: No runtime theme switching
The client SHALL NOT provide a `ThemeProvider` context, a `useTheme` hook, or a theme switcher control. The client SHALL NOT set a `data-theme` attribute on the root element and SHALL NOT persist or restore a theme selection in `localStorage`.

#### Scenario: No theme context or switcher exists
- **WHEN** the application renders
- **THEN** no theme toggle appears in the header and no component can read or set an active theme via context

#### Scenario: Root element carries no theme attribute
- **WHEN** the document root (`<html>`) renders
- **THEN** no `data-theme` attribute is present and the palette is always Linear
