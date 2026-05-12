<!--
Title format (validated by .github/workflows/pr-title.yml):
  <type>(<workstream-scope>): <imperative summary>
Allowed types: feat, fix, chore, docs, refactor, test, perf, ci, build, style, revert.
Allowed scopes: see .cursor/rules/commit-conventions.mdc.
-->

## Summary

<!-- 1-3 sentences. What changed and why. -->

## Linked issue

Closes #<issue-number>

## Sub-plan + research note

- Sub-plan: `.cursor/plans/<file>.plan.md`
- Research note: `docs/research/phase-<N>-<topic>.md`
- Parent plan: [.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md](../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md)

## Test plan

<!-- Checklist of what the reviewer / CI verified. Include local smoke and CI evidence. -->

- [ ] `pnpm install --frozen-lockfile` clean.
- [ ] `pnpm turbo run check-types` green.
- [ ] `pnpm lint` green.
- [ ] `pnpm test` green.
- [ ] `pnpm build` green.
- [ ] `markdownlint-cli2` green over `docs/` + `README.md`.
- [ ] All new code paths covered per `.cursor/rules/test-coverage.mdc` (tier-gated).
- [ ] No `TODO` / `HACK` / `FIXME` left in production paths.

## Screenshots / demos

<!-- For UI changes only. Drag-and-drop images or paste a Loom link. -->

## Risks + rollout

<!-- Migration steps, feature-flag plan, rollback path, observability impact. -->

## Status-sync checklist

- [ ] Parent-plan todo flipped (`status: pending → in_progress → completed`).
- [ ] Projects v2 board item moved (`Todo → In progress → In review → Done`).
- [ ] Research note **Implementation reference** block appended with PR # + squash SHA.
- [ ] Linked issues commented + closed with `state_reason: completed`.
- [ ] `copilot-pull-request-reviewer` requested.
- [ ] Phase-0 epic / phase-acceptance issue commented (if Phase-0 work).
