# publish-12-repos.ps1
# For each of the 12 projects: git init -> initial commit -> gh repo create (public) -> add OkBeiRohan as admin -> push.
# Idempotent: skips git init if .git already exists; skips gh repo create if repo already exists; skips collab add if already present.

$ErrorActionPreference = 'Continue'

$projects = @(
  @{ Slug='restaurant-ordering'; Description='QR-code menu + dine-in / takeaway ordering + table reservation + kitchen-display platform for single and small-chain restaurants. India-first, free-tier-first, mobile-and-web. Full institution-grade reference implementation.' },
  @{ Slug='appointment-booking'; Description='Multi-staff and multi-resource appointment booking with deposit collection, automated WhatsApp/SMS reminders, and customer self-rebooking links. India-first, free-tier-first, mobile-and-web.' },
  @{ Slug='event-booking'; Description='Movie + concert + event ticketing with seat selection, dynamic pricing, partner coupons, and contactless QR-ticket gate validation. India-first, free-tier-first, mobile-and-web.' },
  @{ Slug='quick-commerce'; Description='10-minute hyperlocal grocery and essentials delivery with multi-dark-store routing, rider dispatch, in-stock-only PLP, and live order tracking. India-first, free-tier-first, mobile-and-web.' },
  @{ Slug='realestate-hyperlocal'; Description='Locality-focused property listings with virtual-tour embeds, WhatsApp-driven lead capture, and a mini-CRM for independent brokers. India-first, free-tier-first, mobile-and-web.' },
  @{ Slug='coaching-lms'; Description='Drip-content cohort-based course platform with live sessions, assignments, signed-URL video DRM, and auto-generated certificates. India-first, free-tier-first, mobile-and-web.' },
  @{ Slug='video-streaming'; Description='HLS + DASH on-demand and live video streaming with multi-DRM (Widevine + FairPlay + PlayReady), personalised home, watchlist, and resume-watching. India-first, free-tier-first, mobile-and-web.' },
  @{ Slug='healthcare-clinic'; Description='Clinic management - patient appointments + EMR + prescription auto-fill + lab orders + WhatsApp follow-up. ABDM-ready, DPDP-Act-compliant. India-first, free-tier-first, mobile-and-web.' },
  @{ Slug='fitness-trainer'; Description='Trainer dashboard for assigning workouts + meal plans + 1:1 chat + progress photos + wearable sync. Lets a trainer scale from 20 to 80 clients. India-first, free-tier-first, mobile-and-web.' },
  @{ Slug='services-marketplace'; Description='Hyperlocal services marketplace (plumbers, electricians, beauty, tutors) with vetted-provider supply, fixed-price catalog, and in-job tracking. India-first, free-tier-first, mobile-and-web.' },
  @{ Slug='cab-hailing'; Description='Real-time intra-city ride-hailing with driver dispatch, ETA, fare estimation, surge pricing, in-ride SOS, and live tracking. India-first, free-tier-first, mobile-and-web.' },
  @{ Slug='crm-vertical'; Description='Vertical SaaS CRM with industry-tailored fields, WhatsApp 2-way inbox as primary channel, and PDF quote generation. One vertical per deployment. India-first, free-tier-first, mobile-and-web.' }
)

$owner = 'goldr0g3r'
$collaborator = 'OkBeiRohan'
$permission = 'admin'
$initialCommitMessage = 'chore(scaffold): initial scaffold + rules + agents + AGENTS.md + parent plan'

$gitInit = @()
$repoCreate = @()
$collabAdd = @()
$errors = @()

foreach ($p in $projects) {
  $slug = $p.Slug
  $repoPath = "C:\Code\$slug"
  $fullRepo = "$owner/$slug"
  Write-Host "`n========================" -ForegroundColor Cyan
  Write-Host "Processing: $slug" -ForegroundColor Cyan
  Write-Host "========================" -ForegroundColor Cyan

  if (-not (Test-Path $repoPath)) {
    Write-Warning "Skipping $slug - directory not found at $repoPath"
    $errors += "$slug : directory not found"
    continue
  }

  Push-Location $repoPath

  try {
    # ---- Step 1: git init ----
    if (Test-Path .git) {
      Write-Host "  [git] .git exists - skipping init" -ForegroundColor DarkGray
    } else {
      git init --initial-branch=main 2>&1 | Out-Null
      if ($LASTEXITCODE -ne 0) {
        # PowerShell quoting on older git versions
        git init 2>&1 | Out-Null
        git branch -M main 2>&1 | Out-Null
      }
      $gitInit += $slug
      Write-Host "  [git] init OK" -ForegroundColor Green
    }

    # ---- Step 2: initial commit (if no commits yet) ----
    $hasCommits = $false
    git rev-parse --verify HEAD 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { $hasCommits = $true }

    if ($hasCommits) {
      Write-Host "  [git] already has commits - skipping initial commit" -ForegroundColor DarkGray
    } else {
      git add . 2>&1 | Out-Null
      git commit -m $initialCommitMessage 2>&1 | Out-Null
      if ($LASTEXITCODE -ne 0) {
        Write-Warning "  [git] commit failed for $slug"
        $errors += "$slug : commit failed"
        Pop-Location
        continue
      }
      Write-Host "  [git] initial commit OK" -ForegroundColor Green
    }

    # ---- Step 3: gh repo create (public, with description, push) ----
    $existing = gh repo view $fullRepo --json name 2>$null
    if ($existing) {
      Write-Host "  [gh ] repo exists - ensuring remote + push" -ForegroundColor DarkGray
      # Ensure remote is set
      $remoteUrl = git remote get-url origin 2>$null
      if (-not $remoteUrl) {
        git remote add origin "https://github.com/$fullRepo.git" 2>&1 | Out-Null
      }
      git push -u origin main 2>&1 | Out-String | Write-Host
    } else {
      $desc = $p.Description
      gh repo create $fullRepo --public --description $desc --source . --remote origin --push 2>&1 | Out-String | Write-Host
      if ($LASTEXITCODE -ne 0) {
        Write-Warning "  [gh ] repo create failed for $slug"
        $errors += "$slug : gh repo create failed"
      } else {
        $repoCreate += $slug
        Write-Host "  [gh ] repo create + push OK" -ForegroundColor Green
      }
    }

    # ---- Step 4: add OkBeiRohan as admin collaborator ----
    $collabResult = gh api "repos/$fullRepo/collaborators/$collaborator" -X PUT -f "permission=$permission" 2>&1
    if ($LASTEXITCODE -eq 0) {
      $collabAdd += $slug
      Write-Host "  [gh ] collaborator $collaborator added as $permission" -ForegroundColor Green
    } else {
      # PUT on existing collab returns 204 with no body and exit 0; sometimes 201 with body. If error, log it.
      Write-Warning "  [gh ] collaborator add returned: $collabResult"
    }
  }
  catch {
    Write-Warning "  Exception: $_"
    $errors += "$slug : $_"
  }
  finally {
    Pop-Location
  }
}

Write-Host "`n========================" -ForegroundColor Magenta
Write-Host "Summary" -ForegroundColor Magenta
Write-Host "========================" -ForegroundColor Magenta
Write-Host "git init  performed on: $($gitInit -join ', ')" -ForegroundColor White
Write-Host "gh repo create on     : $($repoCreate -join ', ')" -ForegroundColor White
Write-Host "collaborator added on : $($collabAdd -join ', ')" -ForegroundColor White
if ($errors.Count -gt 0) {
  Write-Host "`nErrors:" -ForegroundColor Red
  $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}
Write-Host "`nDone." -ForegroundColor Cyan
