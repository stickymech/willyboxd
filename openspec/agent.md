# Agent / Development Process

This file captures the conventions and workflow for contributing to willyboxd.
If it is missing or stale, treat it as a bug to fix.

## Repo & stack

- **Turborepo monorepo** (npm workspaces) + TypeScript **strict**.
  - `apps/client` — Vite + React + Tailwind CSS.
  - `apps/server` — Hono + SQLite (`better-sqlite3`).
  - `packages/shared` — types, Zod schemas, constants.
- Hobby project — YAGNI, standard TDD/git/publish model, no over-engineered CI.

## Quality gate (must be green before any review)

All four of these must pass locally before a branch is considered ready for
review. Run them together via turbo to avoid surprises:

```
npx turbo run lint typecheck test build --force
```

or, equivalently:

```
npm run lint && npm run typecheck && npm run test && npm run build
```

- `lint` / `typecheck` — fail fast locally.
- `test` — server (vitest), shared, client. Keep coverage commensurate with the change.
- `build` — both client and server must compile for production.

## Spec-driven workflow (OpenSpec)

Every change is tracked under `openspec/changes/<change-name>/` with:
`proposal.md`, `design.md`, `specs/...` (one `spec.md` per requirement set),
and `tasks.md` (checklist; mark items complete as work lands).

- Prefer `openspec-propose` to generate a full proposal (design + spec + tasks)
  for new work, then implement with `openspec-apply-change`.
- When behavior changes, update the relevant **`spec.md`** scenarios and
  **`tasks.md`** checklist so docs stay truthful to the code.
- When a change is finished and manually verified, archive it with
  `openspec-archive-change` (deltas sync to main specs automatically).

## Branch / commit / review

- **Branch-per-change.** Name branches after the feature/issue.
- **Commit before review.** Do not open (or leave) a PR with uncommitted work.
- Conventional commits (`feat:`, `fix:`, `refactor:`, etc.), imperative mood.
- Each branch has one associated PR; PR base is `main`. Keep the PR description
  linked to the OpenSpec change it implements.
- Don't force-push destructively onto a branch mid-review without syncing
  with reviewers; prefer adding commits.

## Manual QA

Automated tests can't cover the browser. After green checks:

1. `npm run dev` (client `localhost:5173`, server `/api`).
2. Run any `scripts/qa-*.sh` for the change — e.g.
   `scripts/qa-brand-avatar.sh` (static checks are automated; the `[A]`–`[F]`
   blocks are eyeball-only and must be verified by hand).
3. Tick the remaining manual items in `tasks.md` (e.g. `3.3`, `6.2`) and then
   archive the OpenSpec change.

## Conventions worth knowing

- Avatars: `user.avatar` (uploaded) wins over `/placeholder-avatar.svg`. There
  is no Gravatar/hashed-email fallback — never leak a raw email into a URL.
- Auth: session cookie (`willyboxd_session`); server validates via `requireAuth`;
  `PUT /auth/me` clears the avatar with `{ avatar: null }`.
- Client API helpers: `apiFetch`, `apiFetchFormData`, `resolveAvatarUrl` in
  `apps/client/src/lib/api.ts`.
