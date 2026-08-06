## ADDED Requirements

### Requirement: Password change keeps the current session valid
When a user changes their password via `PUT /auth/password`, the session
established before the change SHALL remain valid. The server SHALL update only
`users.password_hash` and SHALL NOT invalidate any `sessions` rows. A subsequent
authenticated request with the same session cookie SHALL succeed.

#### Scenario: session survives a password change
- **WHEN** an authenticated user calls `PUT /auth/password` with a correct
  current password and a valid new password
- **THEN** the response is 200 with `{ success: true }`
- **AND** a subsequent `GET /auth/me` using the SAME session cookie returns the
  user (200, not 401)

## MODIFIED Requirements

### Requirement: PUT /auth/password validates and updates the password
The existing endpoint behaviour is unchanged: wrong current password -> 401,
new password <8 chars -> 400, and after success the old password no longer
authenticates. The added scenario above clarifies that sessions are unaffected
by the password rotation.
