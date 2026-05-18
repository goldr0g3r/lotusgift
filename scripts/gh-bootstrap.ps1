# scripts/gh-bootstrap.ps1
# Idempotently create the GitHub label set + milestones + repo settings for lotusgift.
#
# Usage:
#   .\scripts\gh-bootstrap.ps1                      # apply against the repo
#   .\scripts\gh-bootstrap.ps1 -DryRun              # print what would be created
#   .\scripts\gh-bootstrap.ps1 -Repo "owner/name"   # apply against an explicit repo
#
# Prerequisites:
#   - gh CLI installed + authenticated (`gh auth login`).
#   - Run from inside the repo OR pass -Repo.

param(
    [string]$Repo = "",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

if (-not $Repo) {
    $Repo = gh repo view --json nameWithOwner -q .nameWithOwner 2>$null
    if (-not $Repo) {
        Write-Error "Could not auto-detect repo from cwd; pass -Repo owner/name."
        exit 1
    }
}

Write-Host "==> Target repo: $Repo"
if ($DryRun) { Write-Host "==> DRY RUN -- no changes will be made." }

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

function Ensure-Label {
    param([string]$Name, [string]$Color, [string]$Description)
    if ($DryRun) {
        Write-Host "  [dry-run] label: $Name (#$Color) -- $Description"
        return
    }
    $existing = gh label list --repo $Repo --search $Name --limit 100 --json name -q ".[].name" 2>$null
    if ($existing -contains $Name) {
        gh label edit $Name --repo $Repo --color $Color --description $Description 2>&1 | Out-Null
        Write-Host "  ~ updated: $Name"
    } else {
        gh label create $Name --repo $Repo --color $Color --description $Description 2>&1 | Out-Null
        Write-Host "  + created: $Name"
    }
}

function Ensure-Milestone {
    param([string]$Title, [string]$Description, [string]$DueOn)
    if ($DryRun) {
        Write-Host "  [dry-run] milestone: $Title -- $Description"
        return
    }
    $jqExpr = ".[] | select(.title==""$Title"") | .number"
    $allMilestones = gh api "repos/$Repo/milestones?state=all&per_page=100" 2>$null | ConvertFrom-Json
    $existing = ($allMilestones | Where-Object { $_.title -eq $Title }).number
    if ($existing) {
        $body = @{ description = $Description; state = "open" }
        if ($DueOn) { $body.due_on = "${DueOn}T23:59:59Z" }
        $jsonBody = $body | ConvertTo-Json -Compress
        $tmp = [System.IO.Path]::GetTempFileName()
        [System.IO.File]::WriteAllText($tmp, $jsonBody, [System.Text.UTF8Encoding]::new($false))
        gh api -X PATCH "repos/$Repo/milestones/$existing" --input $tmp 2>&1 | Out-Null
        Remove-Item $tmp
        Write-Host "  ~ updated milestone: $Title"
    } else {
        $body = @{ title = $Title; description = $Description; state = "open" }
        if ($DueOn) { $body.due_on = "${DueOn}T23:59:59Z" }
        $jsonBody = $body | ConvertTo-Json -Compress
        $tmp = [System.IO.Path]::GetTempFileName()
        [System.IO.File]::WriteAllText($tmp, $jsonBody, [System.Text.UTF8Encoding]::new($false))
        gh api -X POST "repos/$Repo/milestones" --input $tmp 2>&1 | Out-Null
        Remove-Item $tmp
        Write-Host "  + created milestone: $Title"
    }
}

# ---------------------------------------------------------------------------
# Remove stale/duplicate labels from initial setup
# ---------------------------------------------------------------------------
Write-Host "==> Cleaning stale labels"
$staleLabels = @("phase/1", "phase/2", "phase/3", "phase/4", "phase/P21", "phase/P22",
                 "bug", "documentation", "duplicate", "enhancement", "good first issue",
                 "help wanted", "invalid", "question", "wontfix",
                 "type/feat", "type/fix", "type/refactor", "type/chore", "type/docs",
                 "type/perf", "type/test", "type/build", "type/ci", "type/revert",
                 "area/backend", "area/frontend", "area/infra", "area/docs", "area/design",
                 "prio/P0", "prio/P1", "prio/P2", "prio/P3",
                 "research-note", "design-discovery", "epic", "feature",
                 "phase-acceptance", "needs-research", "blocked", "breaking-change", "good-first-issue")

foreach ($l in $staleLabels) {
    if (-not $DryRun) {
        gh label delete $l --repo $Repo --yes 2>&1 | Out-Null
    } else {
        Write-Host "  [dry-run] delete: $l"
    }
}

# ---------------------------------------------------------------------------
# Phase labels (P0..P22)
# ---------------------------------------------------------------------------
Write-Host "==> Phase labels"
for ($n = 0; $n -le 22; $n++) {
    Ensure-Label "phase/P${n}" "d4c5f9" "Phase P${n}"
}

# ---------------------------------------------------------------------------
# Type labels
# ---------------------------------------------------------------------------
Write-Host "==> Type labels"
Ensure-Label "type/research-note"      "0e8a16" "Phase research note"
Ensure-Label "type/design-discovery"   "fbca04" "Frontend Design Discovery"
Ensure-Label "type/bug"                "d73a4a" "Defect in shipped code"
Ensure-Label "type/feature"            "a2eeef" "New capability"
Ensure-Label "type/refactor"           "fbca04" "Internal refactor (no behaviour change)"
Ensure-Label "type/docs"               "0075ca" "Documentation only"
Ensure-Label "type/test"               "0075ca" "Tests only"
Ensure-Label "type/chore"              "ededed" "Tooling / config / dependency"
Ensure-Label "type/security"           "b60205" "Security-related"
Ensure-Label "type/epic"               "5319e7" "Umbrella tracking issue spanning multiple PRs"

# ---------------------------------------------------------------------------
# Workstream / scope labels (from commit-conventions.instructions.md)
# ---------------------------------------------------------------------------
Write-Host "==> Workstream labels"
$workstreams = @(
    @{ name = "ws/scaffold";          color = "c5def5"; desc = "Monorepo scaffold + tooling" }
    @{ name = "ws/rules";             color = "c5def5"; desc = "Cursor/Copilot rules" }
    @{ name = "ws/architecture";      color = "c5def5"; desc = "ADRs + architecture decisions" }
    @{ name = "ws/ci";                color = "c5def5"; desc = "CI/CD pipelines" }
    @{ name = "ws/infra";             color = "c5def5"; desc = "Infrastructure (Oracle/Vercel/Docker)" }
    @{ name = "ws/design";            color = "c5def5"; desc = "Design tokens + UI components" }
    @{ name = "ws/runbook";           color = "c5def5"; desc = "Runbooks + operational docs" }
    @{ name = "ws/auth";              color = "c5def5"; desc = "Authentication + authorization" }
    @{ name = "ws/vendor";            color = "c5def5"; desc = "Vendor service" }
    @{ name = "ws/product";           color = "c5def5"; desc = "Product service" }
    @{ name = "ws/inventory";         color = "c5def5"; desc = "Inventory service" }
    @{ name = "ws/customization";     color = "c5def5"; desc = "Customization service" }
    @{ name = "ws/order";             color = "c5def5"; desc = "Order service" }
    @{ name = "ws/rfq";               color = "c5def5"; desc = "RFQ service" }
    @{ name = "ws/recipient-list";    color = "c5def5"; desc = "Recipient-list service" }
    @{ name = "ws/payment";           color = "c5def5"; desc = "Payment service" }
    @{ name = "ws/shipping";          color = "c5def5"; desc = "Shipping service" }
    @{ name = "ws/notification";      color = "c5def5"; desc = "Notification service" }
    @{ name = "ws/tax";               color = "c5def5"; desc = "Tax service" }
    @{ name = "ws/promotions";        color = "c5def5"; desc = "Promotions service" }
    @{ name = "ws/insights";          color = "c5def5"; desc = "Insights service" }
    @{ name = "ws/review";            color = "c5def5"; desc = "Review service" }
    @{ name = "ws/support";           color = "c5def5"; desc = "Support service" }
    @{ name = "ws/gateway";           color = "c5def5"; desc = "API Gateway" }
    @{ name = "ws/web-customer";      color = "c5def5"; desc = "Web Customer App" }
    @{ name = "ws/web-vendor";        color = "c5def5"; desc = "Web Vendor App" }
    @{ name = "ws/web-admin";         color = "c5def5"; desc = "Web Admin App" }
    @{ name = "ws/web-customer-service"; color = "c5def5"; desc = "Web Customer Service App" }
    @{ name = "ws/observability";     color = "c5def5"; desc = "Observability + monitoring" }
    @{ name = "ws/release";           color = "c5def5"; desc = "Release + deploy" }
)
foreach ($ws in $workstreams) {
    Ensure-Label $ws.name $ws.color $ws.desc
}

# ---------------------------------------------------------------------------
# Area labels (cross-cutting concerns)
# ---------------------------------------------------------------------------
Write-Host "==> Area labels"
Ensure-Label "area/corporate-gifting"  "fbca04" "Auto-router + RFQ + recipient-list + customization domain"
Ensure-Label "area/payments"           "0075ca" "Razorpay + PO + credit-terms"
Ensure-Label "area/analytics"          "0075ca" "PostHog + reporting"
Ensure-Label "area/security"           "b60205" "Auth + secrets + gitleaks"
Ensure-Label "area/observability"      "0075ca" "Sentry + Grafana + OTEL + tracing"
Ensure-Label "area/design-system"      "0075ca" "@repo/ui + @repo/design-tokens"
Ensure-Label "area/api"                "0075ca" "OpenAPI + Kubb + type-safety"
Ensure-Label "area/database"           "0075ca" "MongoDB Atlas + Mongoose"
Ensure-Label "area/free-tier"          "fbca04" "Free-tier quota tracking"

# ---------------------------------------------------------------------------
# Priority labels
# ---------------------------------------------------------------------------
Write-Host "==> Priority labels"
Ensure-Label "prio/P0-critical"   "b60205" "Critical -- landing this sprint"
Ensure-Label "prio/P1-high"       "d93f0b" "High -- landing this phase"
Ensure-Label "prio/P2-medium"     "fbca04" "Medium -- landing next phase"
Ensure-Label "prio/P3-low"        "0e8a16" "Low -- when convenient"

# ---------------------------------------------------------------------------
# Status / workflow labels
# ---------------------------------------------------------------------------
Write-Host "==> Status / workflow labels"
Ensure-Label "research-note-review"     "0e8a16" "Research note awaiting approval"
Ensure-Label "design-discovery-review"  "fbca04" "Design Discovery awaiting direction-pick"
Ensure-Label "needs-research"           "ededed" "Open question needs research before implementation"
Ensure-Label "blocked"                  "d73a4a" "Blocked on external dependency"
Ensure-Label "good-first-issue"         "7057ff" "Good for newcomers"
Ensure-Label "help-wanted"              "008672" "Help wanted"
Ensure-Label "wontfix"                  "ffffff" "Will not be worked on"
Ensure-Label "duplicate"                "cfd3d7" "Duplicate of another issue"
Ensure-Label "phase-acceptance"         "0e8a16" "Phase-acceptance checklist"
Ensure-Label "breaking-change"          "b60205" "Breaking change requiring coordinated rollout"

# ---------------------------------------------------------------------------
# Milestones — one per phase (P0..P22)
# ---------------------------------------------------------------------------
Write-Host "==> Milestones"
Ensure-Milestone "Phase 0 - Foundation Reset" "Ship the framework spine: 15 cursor rules + 5 cursor skills + GitHub templates/workflows/labels/milestones + research-note stubs + workspace bootstrap. Acceptance: pnpm install/typecheck/lint all green." "2026-05-14"
Ensure-Milestone "Phase 1 - L0 Packages" "L0 packages: @repo/typescript-config, @repo/eslint-config, @repo/prettier-config, @repo/jest-config, @repo/design-tokens stub. Acceptance: turbo boundaries green." "2026-05-16"
Ensure-Milestone "Phase 2 - L1 Contracts" "L1 contracts: @repo/types (branded primitives), @repo/validators (Zod schemas), @repo/events (event contracts), @repo/openapi-spec. Acceptance: 100% test coverage." "2026-05-17"
Ensure-Milestone "Phase 3 - L2 Infra + Analytics" "L2 infra: @repo/database (Mongoose + collection-namespacing), @repo/config (Zod env schema), @repo/utils (OutboxPort + traceId), @repo/observability (OTEL + Pino). L3: @repo/analytics-sdk, @repo/feature-flags. Acceptance: outbox round-trip test green." "2026-05-18"
Ensure-Milestone "Phase 4 - API Gateway" "apps/api-gateway NestJS shell: module mounting, health checks, OpenAPI generation, Swagger UI, raw-body for webhooks. Acceptance: first OpenAPI snapshot committed." "2026-05-19"
Ensure-Milestone "Phase 5 - Auth Service" "services/auth-service: Better-Auth runtime + passkey + 2FA + phone OTP + Google social + email-verify + @repo/auth-client. Acceptance: sign-in e2e green." "2026-05-20"
Ensure-Milestone "Phase 6 - Vendor Service" "services/vendor-service: onboarding + KYC + multi-warehouse + vendor tiers + payout config. Acceptance: vendor CRUD + tier-gating tests green." "2026-05-22"
Ensure-Milestone "Phase 7 - Product Service" "services/product-service: taxonomy + R2 uploads + Atlas Search + variants + SKU management. Acceptance: search + variant tests green." "2026-05-24"
Ensure-Milestone "Phase 8 - Inventory + Customization" "services/inventory-service (stock ledger + Redis reservations) + services/customization-service (art upload + mockup + approval thread). Acceptance: stock reservation + customization flow tests green." "2026-05-26"
Ensure-Milestone "Phase 9 - Order + RFQ + Recipient-List" "services/order-service + services/rfq-service + services/recipient-list-service. Auto-router between cart and RFQ. Recipient-list CSV upload. Acceptance: auto-router + recipient-list tests green." "2026-05-30"
Ensure-Milestone "Phase 10 - Payment Service" "services/payment-service: Razorpay integration (UPI, cards, netbanking, wallets) + webhook handling + idempotency + PO/credit-terms. Acceptance: payment flow + webhook tests green." "2026-06-02"
Ensure-Milestone "Phase 11 - Shipping Service" "services/shipping-service: multi-carrier integration + tracking + recipient-list fulfillment (N shipments). Acceptance: shipping quote + tracking tests green." "2026-06-05"
Ensure-Milestone "Phase 12 - Notification Service" "services/notification-service: email (Resend) + SMS (MSG91) + WhatsApp templates. Acceptance: notification dispatch + template tests green." "2026-06-08"
Ensure-Milestone "Phase 13 - Tax Service" "services/tax-service: GST calculation + HSN/SAC mapping + compliance reporting. Acceptance: tax computation tests green." "2026-06-10"
Ensure-Milestone "Phase 14 - Promotions Service" "services/promotions-service: coupons + bulk discounts + corporate pricing tiers. Acceptance: coupon stacking + eligibility tests green." "2026-06-13"
Ensure-Milestone "Phase 15 - Insights Service" "services/insights-service: reporting + analytics pipelines + dashboard data. Acceptance: aggregation + time-series tests green." "2026-06-16"
Ensure-Milestone "Phase 16 - Web Customer App" "apps/web-customer: Next.js App Router + SSR catalog + cart + checkout + order tracking. Acceptance: e2e + axe-core a11y green." "2026-06-30"
Ensure-Milestone "Phase 17 - Web Vendor App" "apps/web-vendor: vendor dashboard + product management + order fulfillment + payout tracking. Acceptance: e2e + axe-core green." "2026-07-14"
Ensure-Milestone "Phase 18 - Web Admin App" "apps/web-admin: platform admin + analytics + moderation + vendor approval. Acceptance: e2e + axe-core green." "2026-07-28"
Ensure-Milestone "Phase 19 - Web Customer Service App" "apps/web-customer-service: support tickets + live chat + escalation workflows. Acceptance: e2e + axe-core green." "2026-08-11"
Ensure-Milestone "Phase 20 - Review + Support Services" "services/review-service + services/support-service: product reviews + ratings + support ticket management. Acceptance: review + support flow tests green." "2026-08-18"
Ensure-Milestone "Phase 21 - Observability Hardening" "Full observability: Sentry error boundaries, Grafana dashboards, OTEL traces, structured logging, alerting rules, SLO definitions. Acceptance: all alerts firing correctly in staging." "2026-08-25"
Ensure-Milestone "Phase 22 - Launch" "Production deploy on Oracle Always Free Mumbai + Vercel. Monitoring + alerting active. Soft-launch with initial vendors. Acceptance: production health checks green, first order placed." "2026-09-01"

# ---------------------------------------------------------------------------
# Repository settings
# ---------------------------------------------------------------------------
Write-Host "==> Repository settings"
if (-not $DryRun) {
    # Enable issues + projects; disable wiki (docs live in repo)
    gh repo edit $Repo --enable-issues --enable-projects --enable-wiki=false 2>&1 | Out-Null
    # Set default branch to main
    gh repo edit $Repo --default-branch main 2>&1 | Out-Null
    # Set description + topics
    gh repo edit $Repo --description "Multi-vendor corporate gifting marketplace for India. NestJS modular monolith + Next.js + MongoDB Atlas + Razorpay." 2>&1 | Out-Null
    gh repo edit $Repo --add-topic "corporate-gifting" --add-topic "nestjs" --add-topic "nextjs" --add-topic "mongodb" --add-topic "typescript" --add-topic "monorepo" --add-topic "turborepo" --add-topic "marketplace" --add-topic "india" 2>&1 | Out-Null
    Write-Host "  ~ repo settings updated"
}

# ---------------------------------------------------------------------------
# Environments
# ---------------------------------------------------------------------------
Write-Host "==> Environments"
if (-not $DryRun) {
    # Create environments (gh api call since gh env is limited)
    @("production", "staging", "development") | ForEach-Object {
        gh api -X PUT "repos/$Repo/environments/$_" 2>&1 | Out-Null
        Write-Host "  + environment: $_"
    }
}

Write-Host ""
Write-Host "==> Done."
if ($DryRun) { Write-Host "==> DRY RUN -- re-run without -DryRun to apply." }
