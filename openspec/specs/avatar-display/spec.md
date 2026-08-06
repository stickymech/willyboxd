# avatar-display Specification

## Purpose
The header renders the logged-in user's avatar (uploaded `users.avatar` URL, falling back to a committed local placeholder). The settings page manages the avatar (upload/remove) and password via validated server endpoints. No third-party avatar service is used.

## Requirements
### Requirement: Header avatar resolves to uploaded avatar or local placeholder
The header SHALL render the logged-in user's avatar as the uploaded `User.avatar` URL when set, otherwise the committed `/placeholder-avatar.svg`. The client SHALL NOT contact any third-party avatar service, and the raw email SHALL NOT appear in any avatar `src`.

#### Scenario: no avatar resolves to local placeholder
- **WHEN** `user.avatar` is `null`
- **THEN** the avatar `src` is `/placeholder-avatar.svg`

#### Scenario: uploaded avatar is used when present
- **WHEN** `user.avatar` is `"https://cdn.willyboxd.example/u/123.png"`
- **THEN** the avatar `src` is that URL, not the placeholder

### Requirement: Local placeholder fallback on load error
When the resolved avatar URL fails to load (network error), the header SHALL swap in `/placeholder-avatar.svg` so no broken image icon appears.

#### Scenario: onError swaps in local placeholder
- **WHEN** the avatar `<img>` fires `onError`
- **THEN** its `src` becomes `/placeholder-avatar.svg`, which is a committed SVG

### Requirement: User type carries an avatar URL
The shared `User` type's `avatar` field SHALL remain `string | null`, sourced from the `users.avatar` column, and the client SHALL prefer it ahead of the placeholder.

#### Scenario: avatar reflects users.avatar
- **WHEN** the server returns a user object
- **THEN** the `avatar` field is `string | null` and matches the `users.avatar` column value

### Requirement: Header avatar click navigates to /settings
The header SHALL link the avatar image to `/settings` — NOT `/users/:username` (which has no client route and a 501 server stub, producing a blank page).

#### Scenario: settings page renders with header
- **WHEN** the user clicks the header avatar
- **THEN** the browser navigates to `/settings` and the full `Header` (nav, avatar, logout) is visible above the settings card

### Requirement: Settings page displays account info and avatar controls
The `/settings` page SHALL show:
- the current avatar image (`resolveAvatarUrl(user.avatar) ?? /placeholder-avatar.svg`)
- the user's email and username as read-only text in a single Profile card
- an "Upload image" / "Change avatar" button (primary accent) that opens the OS file picker via a hidden file input (PNG/JPEG, max 2MB) and uploads automatically on selection
- a "Remove avatar" button (secondary), shown only when an avatar is set

#### Scenario: profile card and avatar controls render
- **WHEN** the user opens `/settings`
- **THEN** the profile card shows the email and username, and the upload/change and remove (when an avatar is set) controls are visible

### Requirement: Settings page updates avatar via file upload
The settings page SHALL let the user upload a PNG or JPEG image as their avatar. The server SHALL validate the upload by magic bytes (not just the content-type header), enforce a 2MB size cap, store the file under `data/avatars/`, and persist its serve URL (`/api/avatars/<id>`) in `users.avatar`. A successful upload SHALL make the header avatar reflect the new image without a full page reload.

#### Scenario: avatar image is uploaded
- **WHEN** the user clicks the "Upload image" button and selects a valid PNG/JPEG file
- **THEN** the OS file picker opens, `POST /auth/avatar` is called with the file as multipart data (upload starts automatically on selection; no separate submit click)
- **AND** the server stores the served file, persists `/api/avatars/<id>` in `users.avatar`, and the header shows the new image

#### Scenario: unsupported image format is rejected
- **WHEN** the user uploads a non-image file (or a non-PNG/JPEG image)
- **THEN** the server returns 400 and the page shows an error

#### Scenario: oversized upload is rejected
- **WHEN** the user uploads an image larger than 2MB
- **THEN** the server returns 413

### Requirement: Settings page removes an uploaded avatar
The settings page SHALL show a "Remove avatar" control only when an avatar is set, which calls `PUT /auth/me` with `{ avatar: null }`; the header then falls back to `/placeholder-avatar.svg`.

#### Scenario: avatar is removed
- **WHEN** the user clicks "Remove avatar"
- **THEN** `PUT /auth/me` is called with `{ avatar: null }`
- **AND** the header falls back to `/placeholder-avatar.svg`

### Requirement: Settings page changes password via PUT /auth/password
The settings page SHALL provide a form (current password, new password, confirm) that calls `PUT /auth/password`. The server SHALL verify the current password via `bcrypt.compare` before updating.

#### Scenario: wrong current password is rejected
- **WHEN** the user submits the form with an incorrect current password
- **THEN** the server returns 401 and the page shows "Current password is incorrect"

#### Scenario: password is changed successfully
- **WHEN** the user submits the form with a correct current password and a valid new password (≥8 chars)
- **THEN** the server rehashes and updates `users.password_hash`
- **AND** the page shows "Password changed"

### Requirement: Server validates avatar and password payloads
`PUT /auth/me` SHALL validate the body with `AvatarSchema` (URL or null). `POST /auth/avatar` SHALL validate the uploaded file by PNG/JPEG magic bytes and a 2MB size cap, rejecting anything else with 400/413. `PUT /auth/password` SHALL validate with `ChangePasswordSchema` (currentPassword required, newPassword ≥8 chars) and SHALL return 401 on wrong current password.

#### Scenario: invalid payloads are rejected
- **WHEN** a request body or uploaded file does not match its schema (bad avatar URL, non-image file, oversized file, missing current password, or short new password)
- **THEN** the server rejects it with 400/401/413 as appropriate

### Requirement: Favicon renders disc-trio at all browser-tab sizes
The browser-tab favicon SHALL show the orange/green/blue disc-trio on an ink tile at 16×16, 32×32, and SVG. Rocket silhouette details (present in the app header mark) SHALL NOT be expected at 16×16. PNG + ICO fallbacks SHALL be served alongside the SVG for browsers that don't support SVG favicons.

#### Scenario: favicon matches the app brand
- **WHEN** the app loads in a browser tab
- **THEN** the favicon is three orange/green/blue discs on a dark tile
- **AND** it is NOT the old amber slate-box design
