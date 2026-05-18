# Open an issue

**Audience**: every contributor
**Phase**: P0 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

## Issue types

| Type | When | Template |
| ---- | ---- | -------- |
| Feature | New capability | (default) |
| Bug | Something broken | (default) |
| Design Discovery | New frontend page family | `design-discovery.yml` |
| Research Note | Tracking a phase research note | (default) |
| Epic | Phase-level tracking issue | (default) |

## Creating via CLI

```powershell
gh issue create `
  --repo goldr0g3r/lotusgift `
  --title "feat(order): implement cart-to-checkout flow" `
  --body "## Summary`n`nImplement the cart→checkout→payment flow for instant orders.`n`n## Acceptance criteria`n`n- [ ] Cart items validated against stock`n- [ ] Razorpay order created`n- [ ] Payment confirmation triggers order.placed.v1 event" `
  --label "type/feat" `
  --label "ws/order" `
  --label "phase/P9" `
  --milestone "Phase 9 - Order + Payment" `
  --assignee goldr0g3r
```

## Creating via web

<https://github.com/goldr0g3r/lotusgift/issues/new/choose>

## Required fields

Every issue should have:
- **Title**: `<type>(<scope>): <summary>` (matches commit convention)
- **Labels**: at minimum `type/*` + `ws/*` + `phase/*`
- **Milestone**: the corresponding phase milestone
- **Assignee**: `goldr0g3r` (auto-assigned by workflow anyway)

## Auto-add to project

The `add-to-project.yml` workflow automatically adds new issues to project #9. After creation, set the project fields:

→ [`set-project-fields.md`](./set-project-fields.md)

## See also

- [`.github/ISSUE_TEMPLATE/design-discovery.yml`](../../.github/ISSUE_TEMPLATE/design-discovery.yml)
- [`set-project-fields.md`](./set-project-fields.md)
