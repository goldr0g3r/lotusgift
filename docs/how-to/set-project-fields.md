# Set project field values

**Audience**: every contributor opening an issue or PR
**Phase**: P0 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

When an issue or PR is auto-added to project #9 by [`add-to-project.yml`](../../.github/workflows/add-to-project.yml), its custom field values start as NULL. Use this recipe to set them.

## Project reference

- **URL**: <https://github.com/users/goldr0g3r/projects/9>
- **Project number**: 9
- **Owner**: `goldr0g3r`
- **Project node ID**: `PVT_kwHOB9XnOc4BXcKj`

## Field ID reference (stable)

| Field       | Field ID                           | Type          |
| ----------- | ---------------------------------- | ------------- |
| Status      | `PVTSSF_lAHOB9XnOc4BXcKjzhSo_w0` | SINGLE_SELECT |
| Phase       | `PVTSSF_lAHOB9XnOc4BXcKjzhSpAJ8` | SINGLE_SELECT |
| Workstream  | `PVTSSF_lAHOB9XnOc4BXcKjzhSpAjs` | SINGLE_SELECT |
| Layer       | `PVTSSF_lAHOB9XnOc4BXcKjzhSpAsU` | SINGLE_SELECT |
| Type        | `PVTSSF_lAHOB9XnOc4BXcKjzhSpA-g` | SINGLE_SELECT |
| Team        | `PVTSSF_lAHOB9XnOc4BXcKjzhSo_7E` | SINGLE_SELECT |
| Start Date  | `PVTF_lAHOB9XnOc4BXcKjzhSo_7Q`   | DATE          |
| Target Date | `PVTF_lAHOB9XnOc4BXcKjzhSo_7U`   | DATE          |
| Iteration   | `PVTIF_lAHOB9XnOc4BXcKjzhSo_7I`  | ITERATION     |
| Quarter     | `PVTIF_lAHOB9XnOc4BXcKjzhSo_7M`  | ITERATION     |

## Step-by-step

### 1. Get fresh option IDs

Option IDs can regenerate. Always fetch fresh:

```powershell
$fields = gh project field-list 9 --owner goldr0g3r --format json --limit 30 `
  | ConvertFrom-Json `
  | Select-Object -ExpandProperty fields

# Show Phase options
$fields | Where-Object { $_.name -eq 'Phase' } | Select-Object -ExpandProperty options | Format-Table id, name

# Show all single-select fields
$fields | Where-Object { $_.type -eq 'ProjectV2SingleSelectField' } | Select-Object name, id, options
```

### 2. Find the project item ID

```powershell
$ISSUE_NUM = 70
$ITEM_ID = gh project item-list 9 --owner goldr0g3r --format json --limit 200 `
  | ConvertFrom-Json `
  | Select-Object -ExpandProperty items `
  | Where-Object { $_.content.number -eq $ISSUE_NUM } `
  | Select-Object -ExpandProperty id

Write-Host "Item ID: $ITEM_ID"
```

### 3. Set a single-select field

```powershell
$PROJECT_ID = "PVT_kwHOB9XnOc4BXcKj"

# Example: set Phase = P9
gh project item-edit `
  --project-id $PROJECT_ID `
  --id $ITEM_ID `
  --field-id "PVTSSF_lAHOB9XnOc4BXcKjzhSpAJ8" `
  --single-select-option-id "<option-id-from-step-1>"
```

### 4. Set a date field

```powershell
# Set Start Date
gh project item-edit `
  --project-id $PROJECT_ID `
  --id $ITEM_ID `
  --field-id "PVTF_lAHOB9XnOc4BXcKjzhSo_7Q" `
  --date "2026-06-01"
```

### 5. Bulk-set via script

For multiple items, use the pattern from `scripts/refresh-project-fields-and-items.ps1`:

```powershell
$issues = @(70, 71, 72)
foreach ($num in $issues) {
    $url = "https://github.com/goldr0g3r/lotusgift/issues/$num"
    $itemId = gh project item-add 9 --owner goldr0g3r --url $url --format json `
      | ConvertFrom-Json | Select-Object -ExpandProperty id
    gh project item-edit --project-id $PROJECT_ID --id $itemId `
      --field-id "PVTSSF_lAHOB9XnOc4BXcKjzhSo_w0" --single-select-option-id "<todo-option-id>"
}
```

## See also

- [`../runbooks/project-views-setup.md`](../runbooks/project-views-setup.md) — manual view configuration
- [`../../scripts/refresh-project-fields-and-items.ps1`](../../scripts/refresh-project-fields-and-items.ps1) — bulk field update script
