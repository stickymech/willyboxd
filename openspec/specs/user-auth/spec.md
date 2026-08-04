# user-auth Specification

## Purpose
TBD - created by archiving change user-auth. Update Purpose after archive.
## Requirements
### Requirement: Login accepts email or username
The system SHALL accept a single login `identifier` that matches a user by either their email or their username, together with a `password`. The identifier SHALL be a non-empty string without an email-format constraint, and the login request body SHALL use the field name `identifier`.

#### Scenario: Sign-in with email
- **WHEN** a user submits their email and correct password as the identifier
- **THEN** the system authenticates them and returns the user with a session cookie

#### Scenario: Sign-in with username
- **WHEN** a user submits their username and correct password as the identifier
- **THEN** the system authenticates them and returns the user with a session cookie

#### Scenario: Unknown identifier
- **WHEN** a user submits an identifier that matches no email and no username
- **THEN** the system rejects the request with 401 Invalid credentials

#### Scenario: Wrong password
- **WHEN** a user submits a valid identifier with an incorrect password
- **THEN** the system rejects the request with 401 Invalid credentials

#### Scenario: Empty identifier
- **WHEN** a user submits an empty identifier
- **THEN** the system rejects the request as invalid input

### Requirement: Login form accepts email or username
The client login form SHALL present a single text field labeled "Email or username" and SHALL submit it as the `identifier` with the password.

#### Scenario: Label and input type
- **WHEN** the login page renders
- **THEN** the identifier field is a text input labeled "Email or username" (not `type=email`)

#### Scenario: Submission payload
- **WHEN** the login form is submitted
- **THEN** the client posts `{ identifier, password }` to the login endpoint

