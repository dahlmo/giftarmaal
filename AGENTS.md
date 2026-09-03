# AGENTS.md

## Project overview

Giftarmaal is a self-hostable wedding website monorepo.

- `apps/web`: Svelte 4 frontend using Vite. This is not SvelteKit.
- `apps/api`: NestJS 10 API using Prisma and PostgreSQL.
- `packages/dto`: Shared request/response types used across applications.
- `templates`: Reusable wedding templates.
- `automation`: Automation-related code.
- `terraform`: Infrastructure configuration.
- Local services are orchestrated through Docker Compose.
- Package manager: pnpm 9.12.2.

The primary domains are persons, structured content blocks, messages, program entries, and RSVP.

## Working principles

- Read the relevant code and `git status` before changing anything.
- Preserve existing uncommitted changes.
- Make the smallest coherent change that solves the task.
- Follow existing patterns before introducing new abstractions or dependencies.
- Do not perform unrelated refactoring or formatting.
- Do not push, deploy, rewrite Git history, or modify infrastructure unless explicitly requested.
- Never expose credentials, invitation codes, personal guest information, or production data.
- Do not modify `terraform.tfstate`.

## Setup and development

Use the pinned pnpm version through Corepack:

```bash
corepack pnpm install --frozen-lockfile
```

Common commands:

```bash
make up          # Start the local Docker Compose stack
make dev         # Run workspace development servers
make api         # Run only the API
make web         # Run only the frontend
make db          # Start PostgreSQL
make lint
make typecheck
make test
```

Default local ports:

- Web: `5173`
- API: `3001`
- PostgreSQL: `5432`

Do not use npm or Yarn. Update `pnpm-lock.yaml` only when dependencies actually change.

## Architecture conventions

### Frontend

- Keep the frontend compatible with Svelte 4 and Vite.
- Do not introduce SvelteKit-specific APIs or file conventions.
- Reuse components from `apps/web/src/components`.
- Keep routing consistent with the existing custom routing under `apps/web/src/routes`.
- Preserve the structured-content approach: database content is rendered through predefined components rather than arbitrary page markup.
- Maintain responsive and accessible behaviour when changing UI.
- Avoid adding large UI frameworks for isolated features.

### API

- Keep API code within the existing NestJS controller/service structure.
- Validate untrusted input at the API boundary.
- Keep authorization checks in place for admin and spouse-protected operations.
- Do not expose internal Prisma records directly when a shared DTO exists.
- Preserve existing SSE event names and payload contracts unless the task explicitly changes them.
- Validate uploaded file type, size, and filename. Prevent path traversal and avoid logging sensitive data.

### Shared contracts

When an API contract changes:

1. Update `packages/dto`.
2. Update both API producers and frontend consumers.
3. Check for existing local duplicate DTOs before adding another.
4. Run type checking for the entire workspace.

## Database changes

The Prisma schema is located at:

```text
apps/api/prisma/schema.prisma
```

For schema changes:

- Create a new migration with a descriptive name.
- Never edit an already-applied migration.
- Do not use `prisma db push` as a substitute for a committed migration.
- Do not reset or seed a database unless explicitly requested.
- Review migrations for destructive operations and unintended data loss.

Example:

```bash
corepack pnpm --filter api exec prisma migrate dev --name descriptive_change
corepack pnpm --filter api exec prisma generate
```

## Verification

Run the narrowest relevant checks while developing, then the full applicable checks before finishing:

```bash
corepack pnpm --filter web lint
corepack pnpm --filter web typecheck
corepack pnpm --filter web test
corepack pnpm --filter web build

corepack pnpm --filter api lint
corepack pnpm --filter api typecheck
corepack pnpm --filter api test
corepack pnpm --filter api build
```

For cross-package or contract changes, run:

```bash
make lint
make typecheck
make test
```

Add a regression test for bug fixes when practical. If a check cannot run because a service or dependency is unavailable, report that clearly; do not claim it passed.

## Completion

Before finishing:

- Review `git diff` for accidental changes.
- Confirm no secrets, generated files, state files, or unrelated lockfile changes were added.
- Summarize what changed.
- State exactly which checks were run and whether they passed.
- Mention remaining risks or unverified behaviour briefly.