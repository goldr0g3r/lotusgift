# Open an ADR

**Audience**: anyone proposing an architectural decision
**Phase**: P0 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

## When to open an ADR

- Choosing a technology, library, or cloud service
- Deciding on a fundamental architectural pattern
- Making a trade-off that future contributors need to understand
- Anything that would be hard/expensive to reverse

## Steps

### 1. Pick the next number

```powershell
Get-ChildItem docs/adr/*.md | Where-Object { $_.Name -match "^\d{4}" } | Sort-Object | Select-Object -Last 1
```

Increment: if last is `0007`, next is `0008`.

### 2. Copy the template

```powershell
Copy-Item docs/adr/template.md "docs/adr/0008-your-decision-title.md"
```

Naming: `<NNNN>-<kebab-case-title>.md`

### 3. Fill in the template sections

- **Title**: `ADR-NNNN: <Decision title>`
- **Status**: `Proposed` (changes to `Accepted` / `Superseded` / `Rejected`)
- **Context**: What problem or force drove this decision?
- **Decision**: What did you decide? Be specific.
- **Consequences**: What are the trade-offs? What do you gain/lose?
- **Alternatives considered**: What else was evaluated and why rejected?

### 4. Open a PR

```powershell
git checkout -b docs/adr-0008-your-decision
git add docs/adr/0008-your-decision-title.md
git commit -m "docs(architecture): ADR-0008 your decision title"
gh pr create --title "docs(architecture): ADR-0008 your decision title" --label "type/docs" --label "ws/scaffold"
```

### 5. Review + merge

Once approved, change status from `Proposed` → `Accepted`.

## Existing ADRs

| # | Title | Status |
| - | ----- | ------ |
| 0001 | India launch — Razorpay + carrier aggregator | Accepted |
| 0002 | REST over tRPC with NestJS-Zod + Kubb | Accepted |
| 0003 | Vendor-tiered monetization, no customer Prime | Accepted |
| 0004 | Modular monolith first | Accepted |
| 0005 | Hosting — Oracle Mumbai + Vercel | Accepted |
| 0006 | Atlas Search M0 budget — 3 indexes | Accepted |
| 0007 | Corporate gifting deltas (RFQ, customization, recipient-list) | Accepted |

## See also

- [`../adr/template.md`](../adr/template.md) — the template
- [`../adr/README.md`](../adr/README.md) — ADR index
