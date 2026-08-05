## ADDED Requirements

### Requirement: Header avatar uses hashed-email Gravatar
The header SHALL render the logged-in user's avatar by requesting
`https://www.gravatar.com/avatar/<md5 of trimmed-lowercased email>?s=32&d=404`,
using the shared `getProfileImageUrl` helper. The request SHALL NOT embed the
raw email address in the URL.

#### Scenario: Gravatar URL is hashed
- **WHEN** the header renders for a user with email `Test@Example.com`
- **THEN** the avatar `src` contains `gravatar.com/avatar/<md5("test@example.com")>`
  and does NOT contain the raw email string

#### Scenario: No raw email leakage
- **WHEN** the avatar src is constructed
- **THEN** substring `Test@Example` does not appear anywhere in the URL

### Requirement: Uploaded avatar takes precedence
If the authenticated `User.avatar` is a non-null URL, the header SHALL render that
URL and SHALL NOT fall back to Gravatar for that user.

#### Scenario: user.avatar is used when present
- **WHEN** `user.avatar` is `"https://cdn.willyboxd.example/u/123.png"`
- **THEN** the avatar `src` is that URL, not a Gravatar URL

### Requirement: Local fallback when no avatar resolves
When the resolved Gravatar URL fails to load (HTTP 404 or network error), the
header SHALL swap in `/placeholder-avatar.svg` so no broken image icon appears.

#### Scenario: Gravatar 404 falls back to local placeholder
- **WHEN** the avatar `<img>` fires `onError` (e.g. the user has no Gravatar)
- **THEN** its `src` becomes `/placeholder-avatar.svg`, which is a committed SVG

### Requirement: getProfileImageUrl is parameterized
The shared `getProfileImageUrl(email, size?, defaultImg?)` helper SHALL accept an
optional display size (default 200) and optional Gravatar default-image token
(default `404`), returning `null` when no email is supplied.

#### Scenario: Header passes 32px
- **WHEN** the header calls `getProfileImageUrl(user.email, 32)`
- **THEN** the resulting URL contains `s=32`

## MODIFIED Requirements

### Requirement: User type carries an avatar URL
The shared `User` type's `avatar` field SHALL remain `string | null`, sourced
from the `users.avatar` column, and the client SHALL prefer it ahead of
Gravatar.

### Requirement: Header avatar click navigates to /settings
The header SHALL link the avatar image to `/settings` — NOT `/users/:username`
(which has no client route and a 501 server stub, producing a blank page).

#### Scenario: settings page renders with header
- **WHEN** the user clicks the header avatar
- **THEN** the browser navigates to `/settings` and the full `Header` (nav, theme
  switcher, avatar, logout) is visible above the settings card

### Requirement: Settings page displays account info and avatar resolver
The `/settings` page SHALL show:
- the current avatar image (`resolveAvatarUrl(user.avatar) ?? getProfileImageUrl(email, 32) ?? placeholder`)
- the user's email and username as read-only text
- an avatar file input (PNG/JPEG, max 2MB) and, when an avatar is set, a
  "Remove (use Gravatar)" button

### Requirement: Settings page updates avatar via file upload
The settings page SHALL let the user upload a PNG or JPEG image as their avatar.
The server SHALL validate the upload by magic bytes (not just the content-type
header), enforce a 2MB size cap, store the file under `data/avatars/`, and persist
its serve URL (`/api/avatars/<id>`) in `users.avatar`. A successful upload SHALL
make the header avatar reflect the new image without a full page reload.

#### Scenario: avatar image is uploaded
- **WHEN** the user selects a valid PNG/JPEG file and clicks "Upload Avatar"
- **THEN** `POST /auth/avatar` is called with the file as multipart data
- **AND** the server stores the served file, persists `/api/avatars/<id>` in
  `users.avatar`, and the header shows the new image

#### Scenario: unsupported image format is rejected
- **WHEN** the user uploads a non-image file (or a non-PNG/JPEG image)
- **THEN** the server returns 400 and the page shows an error

#### Scenario: oversized upload is rejected
- **WHEN** the user uploads an image larger than 2MB
- **THEN** the server returns 413

#### Scenario: avatar is removed
- **WHEN** the user clicks "Remove (use Gravatar)"
- **THEN** `PUT /auth/me` is called with `{ avatar: null }`
- **AND** the header falls back to Gravatar (or placeholder)

### Requirement: Settings page changes password via PUT /auth/password
The settings page SHALL provide a form (current password, new password,
confirm) that calls `PUT /auth/password`. The server SHALL verify the current
password via `bcrypt.compare` before updating.

#### Scenario: wrong current password is rejected
- **WHEN** the user submits the form with an incorrect current password
- **THEN** the server returns 401 and the page shows "Current password is
  incorrect"

#### Scenario: password is changed successfully
- **WHEN** the user submits the form with a correct current password and a
  valid new password (≥8 chars)
- **THEN** the server rehashes and updates `users.password_hash`
- **AND** the page shows "Password changed"

### Requirement: Server validates avatar and password payloads
`PUT /auth/me` SHALL validate the body with `AvatarSchema` (URL or null).
`POST /auth/avatar` SHALL validate the uploaded file by PNG/JPEG magic bytes and
a 2MB size cap, rejecting anything else with 400/413.
`PUT /auth/password` SHALL validate with `ChangePasswordSchema` (currentPassword
required, newPassword ≥8 chars) and SHALL return 401 on wrong current password.

### Requirement: Favicon renders disc-trio at all browser-tab sizes
The browser-tab favicon SHALL show the orange/green/blue disc-trio on an ink
tile at 16×16, 32×32, and SVG. Rocket silhouette details (present in the
app header mark) SHALL NOT be expected at 16×16. PNG + ICO fallbacks SHALL be
served alongside the SVG for browsers that don't support SVG favicons.

#### Scenario: favicon matches the app brand
- **WHEN** the app loads in a browser tab
- **THEN** the favicon is three orange/green/blue discs on a dark tile
- **AND** it is NOT the old amber slate-box design
