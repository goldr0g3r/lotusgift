# Open a research note

**Audience**: anyone starting work on a new package/service/phase
**Phase**: P0 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

## Rule

> Before writing code in a new package, service, or app, open `docs/research/phase-<N>-<topic>.md`. The note is a **prerequisite**, not a deliverable to backfill.

— from [`.cursor/rules/research-note-per-module.mdc`](../../.cursor/rules/research-note-per-module.mdc)

## Required sections

1. **Goal** — one paragraph, what's being built and why now.
2. **Retrieval-dated citations** — every dependency the module touches, each with: page title + URL + retrieval date ≤14 days old.
3. **Decisions log** — chose / rejected with reasoning.
4. **Open questions** — parked decisions (resolve before PR-merge).
5. **Implementation checklist** — file-by-file deliverables.
6. **Versions** — output of `pnpm ls --depth=0 --filter <package>` after CLI install.

## Steps

### 1. Create the file

```powershell
New-Item -Path "docs/research/phase-9-order-service.md" -ItemType File
```

Naming: `phase-<N>-<topic>.md`

### 2. WebFetch live docs for every dependency

For each new dependency, fetch the official docs page and record:

```markdown
| Topic | Title | URL | Retrieved |
|-------|-------|-----|-----------|
| nestjs-zod | nestjs-zod v5.3.0 | https://www.npmjs.com/package/nestjs-zod | 2026-05-18 |
```

Citations older than 14 days fail validation.

### 3. Install via CLI, then lock versions

```powershell
pnpm add <dep> --filter <package>
pnpm ls --depth=0 --filter <package>
```

Paste the `pnpm ls` output into the research note. **Never hand-write a version number.**

### 4. Fill all required sections

Especially:
- Open questions (every module has them)
- Implementation checklist (file-by-file)

### 5. Open in same PR as first code commit

The research note must land in the same PR as the first code for that module.

## See also

- [`.cursor/rules/research-note-per-module.mdc`](../../.cursor/rules/research-note-per-module.mdc)
- [`.cursor/rules/always-latest-docs.mdc`](../../.cursor/rules/always-latest-docs.mdc)
- [`../research/`](../research/) — existing research notes
