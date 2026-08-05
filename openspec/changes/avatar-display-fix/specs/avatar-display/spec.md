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
