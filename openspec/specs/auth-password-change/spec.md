# auth-password-change Specification

## Purpose
Password rotation via `PUT /auth/password` updates only the stored password hash and SHALL keep the current session valid — no forced re-login. Future session-revocation/2FA work can revisit this.

## Requirements
### Requirement: PUT /auth/password validates and updates the password
The endpoint SHALL reject a wrong current password (401), reject a new password shorter than 8 characters (400), and on success SHALL store the new password hash so the old password no longer authenticates.

#### Scenario: old password no longer authenticates
- **WHEN** a user changes their password successfully
- **THEN** the new password is stored and the old password is rejected with 401 on the next login attempt

### Requirement: Password change keeps the current session valid
When a user changes their password via `PUT /auth/password`, the session established before the change SHALL remain valid. The server SHALL update only `users.password_hash` and SHALL NOT invalidate any `sessions` rows. A subsequent authenticated request with the same session cookie SHALL succeed.

#### Scenario: session survives a password change
- **WHEN** an authenticated user calls `PUT /auth/password` with a correct current password and a valid new password
- **THEN** the response is 200 with `{ success: true }`
- **AND** a subsequent `GET /auth/me` using the SAME session cookie returns the user (200, not 401)
