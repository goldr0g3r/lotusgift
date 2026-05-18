# Close a phase

**Audience**: phase lead (@goldr0g3r)
**Phase**: P0 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

## When to close a phase

A phase is complete when:
1. All deliverables in the research note's Implementation Checklist are merged
2. The Phase Acceptance issue checklist is 100% checked
3. CI passes on `main` with all phase code
4. Test coverage meets the tier requirement

## Steps

### 1. Verify Phase Acceptance checklist

Open the Phase Acceptance issue (e.g., #43 for P8). Every checkbox must be checked.

### 2. Close the Epic + Phase Acceptance issues

```powershell
gh issue close <epic-number> --repo goldr0g3r/lotusgift --reason completed
gh issue close <acceptance-number> --repo goldr0g3r/lotusgift --reason completed
```

### 3. Close the milestone

```powershell
gh api repos/goldr0g3r/lotusgift/milestones/<milestone-number> -X PATCH -f state=closed
```

### 4. Update project board

Set all phase items to Status = Done:

```powershell
# Get items for the phase
$items = gh project item-list 9 --owner goldr0g3r --format json --limit 200 `
  | ConvertFrom-Json | Select-Object -ExpandProperty items `
  | Where-Object { $_.phase -eq "P8" }

# Set each to Done
$DoneOpt = "0110bcf7"
foreach ($item in $items) {
    gh project item-edit --project-id "PVT_kwHOB9XnOc4BXcKj" --id $item.id `
      --field-id "PVTSSF_lAHOB9XnOc4BXcKjzhSo_w0" --single-select-option-id $DoneOpt
}
```

### 5. Update the parent plan

In `.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`, mark the phase as complete.

### 6. Open the next phase

If the next phase's research note is approved, open its Epic issue:

```powershell
gh issue create --repo goldr0g3r/lotusgift `
  --title "Phase 9 — Order + Payment Epic" `
  --label "type/epic" --label "phase/P9" --label "ws/order" `
  --milestone "Phase 9 - Order + Payment" `
  --assignee goldr0g3r
```

## See also

- [`set-project-fields.md`](./set-project-fields.md)
- [`../.github/project-readme.md`](../../.github/project-readme.md)
