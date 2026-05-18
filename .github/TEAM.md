# Team — LotusGift v2

This is the canonical source of truth for **who owns what** in this repository. Auto-assign workflows, CODEOWNERS, scripts, and AGENTS.md all reference this file.

## Roster

| Handle                                     | Role                     | Responsibility                                                                                                                                                                    |
| ------------------------------------------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [@goldr0g3r](https://github.com/goldr0g3r) | Founder / Solo Developer | **ALWAYS REVIEWER + ASSIGNEE.** Primary developer, reviewer, and maintainer on all PRs, issues, ADRs, research notes, design discoveries, architecture, and deployment decisions. |

## Routing rules — assignee selection

Since this is a solo-developer project, all issues and PRs are assigned to `@goldr0g3r`.

### Future expansion

When the scaling thresholds in `docs/runbooks/scaling-up.md` are crossed (post-revenue), expand this file with:

- Additional team members with per-area routing.
- CODEOWNERS entries per team.
- Auto-assign workflow routing logic.

## Review policy

- Every PR requires `pnpm typecheck && pnpm lint && pnpm test` green before merge.
- Squash-merge only on `main`.
- `copilot-pull-request-reviewer` requested on every PR.
- Phase-acceptance issues gate phase transitions.

## Contact

- Security: `security@lotusgift.com` (private disclosure).
- General: GitHub Discussions on the repo.
