# Project views — manual setup guide

**Audience**: @goldr0g3r (solo developer + project owner)
**Phase**: P0 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

The GitHub Projects v2 GraphQL API does **not** support creating views programmatically (as of 2026-05-18). Custom views must be created via the project's web UI.

This guide covers 8 recommended views. Each takes ~30-60 seconds to set up.

**Project URL**: <https://github.com/users/goldr0g3r/projects/9>

---

## Pre-requisites (already done by scripts)

The following were automated by `scripts/gh-bootstrap.ps1` and `scripts/refresh-project-fields-and-items.ps1`:

- [x] Labels created (60+ across phase, type, workstream, area, priority, status)
- [x] Milestones created (P0–P22 with due dates + descriptions)
- [x] Project fields created (Phase, Type, Workstream, Layer, Team, Start Date, Target Date, Iteration, Quarter)
- [x] Field options populated with descriptions + colours
- [x] Existing issues/PRs added to project with field values set
- [x] `add-to-project.yml` workflow auto-adds new issues/PRs

---

## Manual steps YOU must do

### A. Set a PROJECTS_PAT secret (required for auto-add workflow)

The `add-to-project.yml` workflow needs a PAT with `project` scope to add items:

1. Go to <https://github.com/settings/tokens?type=beta> (Fine-grained PAT)
2. Create token with:
   - **Name**: `LOTUSGIFT_PROJECTS_PAT`
   - **Repository access**: `goldr0g3r/lotusgift` only
   - **Permissions**: `Issues: Read`, `Pull requests: Read`, `Projects: Read and write`
   - **Expiration**: 90 days (set a calendar reminder to rotate)
3. Copy the token
4. Go to <https://github.com/goldr0g3r/lotusgift/settings/secrets/actions>
5. Click **New repository secret**, name = `PROJECTS_PAT`, paste value

### B. Create Sprint iterations

1. Open project: <https://github.com/users/goldr0g3r/projects/9>
2. Click any item's **Iteration** field cell → **Configure**
3. Set:
   - Duration: **2 weeks**
   - Start day: **Monday**
4. Add iterations covering the next 3 months (6 sprints)
5. Repeat for the **Quarter** field — set to **13 weeks**, add Q3 2026 + Q4 2026

### C. Create the 8 project views (below)

### D. Set project description + README

1. Open project settings (gear icon): <https://github.com/users/goldr0g3r/projects/9/settings>
2. Set **Short description**: `LotusGift v2 — 22-phase modular-monolith corporate gifting marketplace (India market)`
3. Set **README** content from `.github/project-readme.md` (already created)

### E. Pin the project to your profile

1. Go to <https://github.com/goldr0g3r>
2. Click "Customize your pins" → add project #9

---

## GitHub Projects v2 — view control reference

Each layout exposes a different control set:

| Layout      | Available controls                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------- |
| **Table**   | Fields (visible columns) · Group by · Sort by · Field sum · Slice by                              |
| **Board**   | Fields (visible on card) · **Column by** · Swimlanes · Sort by · Field sum · Slice by             |
| **Roadmap** | Group by · Markers · Sort by · Dates · Zoom level · Slice by · Truncate titles · Show date fields |

Terminology:

- **Column by** (Board only) — the field that defines the kanban columns. NOT "Group by".
- **Group by** (Table + Roadmap) — the field that defines row groups / timeline lanes.
- **Swimlanes** (Board only) — secondary grouping splitting each column horizontally.
- **Slice by** (all layouts) — left-side filter rail to switch between field values.
- **Field sum** (Table + Board) — numeric aggregate at column/group bottom.
- **Markers** (Roadmap only) — visual markers on timeline for date fields.
- **Dates** (Roadmap only) — which date fields define bar start/end.

---

## The 8 recommended views

### 1. Inbox (rename default view)

Daily triage of newly created issues without classification.

- **Layout**: Table
- **Group by**: (none)
- **Sort by**: Created (newest first)
- **Filter**: `no:phase` (issues without Phase set)
- **Visible fields**: Title, Status, Type, Phase, Workstream, Created, Assignees

After triage this view should be empty.

### 2. Board by Status

Primary kanban for daily work.

- **Layout**: Board
- **Column by**: `Status` (Backlog → Todo → Ready → In progress → In review → Blocked → Done)
- **Swimlanes**: (none)
- **Sort by**: Phase ascending
- **Slice by**: `Phase`
- **Visible fields on card**: Title, Type, Workstream, Phase, Milestone

### 3. Board by Phase

"What's where in the lifecycle" view.

- **Layout**: Board
- **Column by**: `Phase` (P0 → P22)
- **Swimlanes**: (none)
- **Sort by**: Status, then Type
- **Slice by**: `Type`
- **Visible fields on card**: Title, Status, Type, Workstream, Milestone

### 4. Roadmap

Timeline view of the 22-phase plan.

- **Layout**: Roadmap
- **Group by**: `Phase`
- **Markers**: Milestone due dates
- **Sort by**: Start Date ascending
- **Dates**: `Start Date` → `Target Date`
- **Zoom level**: `Quarter` (default) — switch to `Month` for near-term detail
- **Slice by**: `Workstream`
- **Show date fields**: ON
- **Truncate titles**: ON

**First-time setup**: requires Start Date + Target Date populated on items. Set them via:
```powershell
gh project item-edit --project-id "PVT_kwHOB9XnOc4BXcKj" --id $ITEM_ID --field-id "PVTF_lAHOB9XnOc4BXcKjzhSo_7Q" --date "2026-05-12"
gh project item-edit --project-id "PVT_kwHOB9XnOc4BXcKj" --id $ITEM_ID --field-id "PVTF_lAHOB9XnOc4BXcKjzhSo_7U" --date "2026-05-25"
```

### 5. By Workstream

Cross-cutting view to see work grouped by domain.

- **Layout**: Table
- **Group by**: `Workstream` (platform / auth / vendor / product / inventory / rfq / customization / recipient-list / order / payment / shipping / tax / promotions / notification / support / review / insights / frontend-* / observability / docs / infra / design)
- **Sort by**: Phase ascending, then Status
- **Slice by**: `Phase`
- **Visible fields**: Title, Phase, Type, Status, Layer, Milestone

### 6. By Layer

Architecture layer view for dependency management.

- **Layout**: Table
- **Group by**: `Layer` (L0 → L6)
- **Sort by**: Phase ascending
- **Slice by**: `Phase`
- **Visible fields**: Title, Phase, Type, Status, Workstream, Milestone

### 7. Research Notes

Tracks all phase research notes.

- **Layout**: Table
- **Group by**: `Phase`
- **Sort by**: Phase ascending
- **Slice by**: `Status`
- **Filter**: `Type:"research"`
- **Visible fields**: Title, Status, Phase, Workstream, Milestone

### 8. Review Queue

Your current review backlog (the review issues created for P0–P8).

- **Layout**: Table
- **Group by**: `Phase`
- **Sort by**: Phase ascending
- **Slice by**: `Status`
- **Filter**: `label:"type/research-note"` OR title contains "Review"
- **Visible fields**: Title, Status, Phase, Workstream, Sub-issues progress

---

## How to add a view (step-by-step)

1. Open the project: <https://github.com/users/goldr0g3r/projects/9>
2. Click **+ New view** at the bottom of the tab strip
3. Pick the **layout** (Table / Board / Roadmap) from the layout switcher (top-right)
4. Configure via the **View** settings menu (⚙ icon, top-right):
   - **Table**: set Group by, Sort by, Slice by, Field sum, toggle visible Fields
   - **Board**: set Column by, Swimlanes, Sort by, Slice by, Field sum, toggle visible Fields
   - **Roadmap**: set Group by, Markers, Sort by, Dates, Zoom level, Slice by, Truncate titles
5. Set the **filter** in the search bar at the top
6. **Double-click** the view tab name to rename it
7. Click **Save view** (unsaved changes show a dot on the tab)

---

## Field reference (stable IDs)

| Field       | Field ID                           | Type          |
| ----------- | ---------------------------------- | ------------- |
| Status      | `PVTSSF_lAHOB9XnOc4BXcKjzhSo_w0` | SINGLE_SELECT |
| Team        | `PVTSSF_lAHOB9XnOc4BXcKjzhSo_7E` | SINGLE_SELECT |
| Start Date  | `PVTF_lAHOB9XnOc4BXcKjzhSo_7Q`   | DATE          |
| Target Date | `PVTF_lAHOB9XnOc4BXcKjzhSo_7U`   | DATE          |
| Phase       | `PVTSSF_lAHOB9XnOc4BXcKjzhSpAJ8` | SINGLE_SELECT |
| Workstream  | `PVTSSF_lAHOB9XnOc4BXcKjzhSpAjs` | SINGLE_SELECT |
| Layer       | `PVTSSF_lAHOB9XnOc4BXcKjzhSpAsU` | SINGLE_SELECT |
| Type        | `PVTSSF_lAHOB9XnOc4BXcKjzhSpA-g` | SINGLE_SELECT |
| Iteration   | `PVTIF_lAHOB9XnOc4BXcKjzhSo_7I`  | ITERATION     |
| Quarter     | `PVTIF_lAHOB9XnOc4BXcKjzhSo_7M`  | ITERATION     |

**Project Node ID**: `PVT_kwHOB9XnOc4BXcKj`

## ⚠ Option IDs may regenerate

Always re-fetch fresh before scripting field updates:

```powershell
gh project field-list 9 --owner goldr0g3r --format json --limit 30 `
  | ConvertFrom-Json `
  | Select-Object -ExpandProperty fields `
  | Where-Object { $_.type -eq 'ProjectV2SingleSelectField' } `
  | Select-Object name, id, options
```

---

## Why this is manual

GitHub's Projects v2 GraphQL API exposes view _queries_ (read), but not view _mutations_ (create / update). Tracking: <https://github.com/orgs/community/discussions/categories/projects-v2>. When that ships, this doc becomes a script.
