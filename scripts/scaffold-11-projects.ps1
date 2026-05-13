# scaffold-11-projects.ps1
# Generates AGENTS.md / CLAUDE.md / .github/copilot-instructions.md for all 11 sibling projects from one templated source.
# Run once after the 11 project folders + shared rules/agents/.gitignore have been copied from restaurant-ordering.

$ErrorActionPreference = 'Stop'

$projects = @(
  @{
    Slug = 'appointment-booking'
    Title = 'Appointment Booking Platform'
    PitchOneLiner = 'Multi-staff and multi-resource appointment booking with deposit collection, automated WhatsApp/SMS reminders, and customer self-rebooking links. India-first, free-tier-first, mobile-and-web.'
    Domain = 'service businesses (salons, dental clinics, physiotherapy clinics, tutoring academies, consultants)'
    Hash = 'a7e8b3c5'
  },
  @{
    Slug = 'event-booking'
    Title = 'Event Booking Platform'
    PitchOneLiner = 'Movie + concert + event ticketing with seat selection, dynamic pricing, partner coupons, and contactless QR-ticket gate validation. India-first, free-tier-first, mobile-and-web.'
    Domain = 'cinema chains, concert promoters, small-venue operators, festival organisers, comedy clubs'
    Hash = 'e5d4a1f2'
  },
  @{
    Slug = 'quick-commerce'
    Title = 'Quick-Commerce Platform'
    PitchOneLiner = '10-minute hyperlocal grocery and essentials delivery with multi-dark-store routing, rider dispatch, in-stock-only PLP, and live order tracking. India-first, free-tier-first, mobile-and-web.'
    Domain = 'hyperlocal grocery + essentials + medicines + emergency-cut produce'
    Hash = '9b1c7d80'
  },
  @{
    Slug = 'realestate-hyperlocal'
    Title = 'Hyperlocal Real-Estate Platform'
    PitchOneLiner = 'Locality-focused property listings with virtual-tour embeds, WhatsApp-driven lead capture, and a mini-CRM for independent brokers and small brokerages. India-first, free-tier-first, mobile-and-web.'
    Domain = 'independent brokers and small brokerages working a 1-3 city radius'
    Hash = 'c2e8f3a9'
  },
  @{
    Slug = 'coaching-lms'
    Title = 'Coaching + Course LMS Platform'
    PitchOneLiner = 'Drip-content cohort-based course platform with live-cohort sessions, assignments, signed-URL video DRM, and auto-generated certificates. India-first, free-tier-first, mobile-and-web with offline downloads.'
    Domain = 'solo coaches, ed-tech startups, certification bodies, language tutors, vocational trainers'
    Hash = 'f1a7b5c4'
  },
  @{
    Slug = 'video-streaming'
    Title = 'Video Streaming Platform'
    PitchOneLiner = 'HLS + DASH on-demand and live video streaming with multi-DRM (Widevine + FairPlay + PlayReady), multi-bitrate ladder, personalised home, watchlist, and resume-watching. India-first, free-tier-first, mobile-and-web.'
    Domain = 'regional OTT operators, niche content curators, corporate training catalogues, faith-based content libraries'
    Hash = '8d4f9b2e'
  },
  @{
    Slug = 'healthcare-clinic'
    Title = 'Clinic Management Platform'
    PitchOneLiner = 'Patient appointments + EMR + prescription auto-fill from history + lab orders + WhatsApp follow-up. ABDM-ready, DPDP-Act-2023-compliant. India-first, free-tier-first, mobile-and-web.'
    Domain = 'solo doctors, 2-5-doctor multi-specialty clinics, dental practices, physiotherapy centres'
    Hash = '7a3c9e1b'
  },
  @{
    Slug = 'fitness-trainer'
    Title = 'Fitness + Wellness Trainer Platform'
    PitchOneLiner = 'Trainer dashboard for assigning workouts + meal plans + 1:1 chat + progress photos + wearable sync. Lets a trainer scale from 20 to 80 clients with the same hours. India-first, free-tier-first, mobile-and-web.'
    Domain = 'independent personal trainers, boutique gyms, yoga instructors, nutrition coaches'
    Hash = '4e6b8d2a'
  },
  @{
    Slug = 'services-marketplace'
    Title = 'Local Services Marketplace'
    PitchOneLiner = 'Hyperlocal services marketplace (plumbers, electricians, beauty, tutors) with vetted-provider supply, fixed-price catalog, and in-job tracking. India-first, free-tier-first, mobile-and-web.'
    Domain = 'city-by-city local services; supply-side KYC and vetting are 90% of the operational work'
    Hash = 'b9c5a7e3'
  },
  @{
    Slug = 'cab-hailing'
    Title = 'Ride-Hailing Platform'
    PitchOneLiner = 'Real-time intra-city ride-hailing with driver dispatch, ETA, fare estimation, surge pricing, in-ride SOS, and live tracking. India-first, free-tier-first, mobile-and-web.'
    Domain = 'intra-city ride-share; city-by-city expansion; highest realtime intensity of the 12 projects'
    Hash = 'd1f3a8c7'
  },
  @{
    Slug = 'crm-vertical'
    Title = 'Vertical CRM Platform'
    PitchOneLiner = 'Industry-specific CRM with vertical-tailored fields, WhatsApp 2-way inbox as the primary channel, and PDF quote generation. One vertical per deployment (interior designers / immigration / car dealerships / IVF clinics). India-first, free-tier-first, mobile-and-web.'
    Domain = 'vertical SaaS for niche B2B sales teams; one industry per deployment'
    Hash = '3b7e1d9a'
  }
)

# ---------- Template: AGENTS.md ----------
$agentsTemplate = @'
# AGENTS.md — {{TITLE}}

Entry point for non-Copilot AI coding agents (Cursor agents, Claude Code, OpenAI Codex, Aider, Cline, Continue, etc.). Follows the [agentsmd.net](https://agentsmd.net) nearest-wins lookup convention.

## Project

{{PITCH_ONELINER}}

Domain: {{DOMAIN}}.

Architecture: modular monolith of Nest libraries mounted by a single `apps/api-gateway` process. Same template as [LotusGift v2](https://github.com/goldr0g3r/lotusgift) (corporate gifting reference build) and [restaurant-ordering](https://github.com/goldr0g3r/restaurant-ordering) (greenfield reference build). Per-project deltas (services list, app stack overrides, performance profile) live in the parent plan.

## Read in order

1. **Project overview + commands** -> [`.github/copilot-instructions.md`](.github/copilot-instructions.md)
2. **Path-specific rules** -> [`.cursor/rules/`](.cursor/rules/) (14 rules; auto-apply per glob frontmatter)
3. **Parent plan** -> [`.cursor/plans/{{SLUG_UNDERSCORE}}_architecture_*.plan.md`](.cursor/plans/)
4. **Research notes** -> [`docs/research/`](docs/research/) (every dependency choice has a retrieval-dated citation per `always-latest-docs.mdc`)

## Rule index

| Rule | Scope | Always-apply? |
|------|-------|---------------|
| [always-latest-docs](.cursor/rules/always-latest-docs.mdc) | repo-wide | yes |
| [analytics-instrumentation](.cursor/rules/analytics-instrumentation.mdc) | apps + services | path-scoped |
| [api-type-safety](.cursor/rules/api-type-safety.mdc) | API layer | path-scoped |
| [architecture-layers](.cursor/rules/architecture-layers.mdc) | repo-wide | yes |
| [commit-conventions](.cursor/rules/commit-conventions.mdc) | repo-wide | yes |
| [deployment-mode](.cursor/rules/deployment-mode.mdc) | repo-wide | yes |
| [design-discovery](.cursor/rules/design-discovery.mdc) | frontend + UI | path-scoped |
| [event-driven-discipline](.cursor/rules/event-driven-discipline.mdc) | services + events | path-scoped |
| [free-tier-budget](.cursor/rules/free-tier-budget.mdc) | repo-wide | yes |
| [microservice-boundaries](.cursor/rules/microservice-boundaries.mdc) | services | path-scoped |
| [no-composer-2](.cursor/rules/no-composer-2.mdc) | subagent spawning | yes |
| [research-note-per-module](.cursor/rules/research-note-per-module.mdc) | repo-wide | yes |
| [secrets-and-secrets-handling](.cursor/rules/secrets-and-secrets-handling.mdc) | repo-wide | yes |
| [test-coverage](.cursor/rules/test-coverage.mdc) | repo-wide | yes |

## Subagents available (Cursor)

- [`code-reviewer`](.cursor/agents/code-reviewer.md) - proactive code review after edits.
- [`research-note-validator`](.cursor/agents/research-note-validator.md) - validates research notes against `always-latest-docs` + `research-note-per-module`.
- [`phase-acceptance-validator`](.cursor/agents/phase-acceptance-validator.md) - closes-out a phase via the phase-acceptance issue checklist.

## Hard preferences

- **Never** spawn `Task` subagents with `model: "composer-2-fast"` - see [`no-composer-2`](.cursor/rules/no-composer-2.mdc).
- **Never** import another `services/*` module directly - use outbox events or the gateway client.
- **Never** commit a `.env*` file - see [`secrets-and-secrets-handling`](.cursor/rules/secrets-and-secrets-handling.mdc).
- **Always** open a research note before code in a new package - see [`research-note-per-module`](.cursor/rules/research-note-per-module.mdc).
- **Always** verify dependency docs via WebFetch with retrieval date <=14 days - see [`always-latest-docs`](.cursor/rules/always-latest-docs.mdc).

If you can read this file, you have everything you need to work productively on this repo.
'@

# ---------- Template: CLAUDE.md ----------
$claudeTemplate = @'
# CLAUDE.md — {{TITLE}}

Entry point for Claude Code (and other Anthropic-based coding agents) working on this repo. Mirrors [`AGENTS.md`](AGENTS.md) per the [agentsmd.net](https://agentsmd.net) nearest-wins lookup.

## Read in order

1. **Project overview + commands** -> [`.github/copilot-instructions.md`](.github/copilot-instructions.md)
2. **Path-specific rules** -> [`.cursor/rules/`](.cursor/rules/)
3. **Parent plan** -> [`.cursor/plans/{{SLUG_UNDERSCORE}}_architecture_*.plan.md`](.cursor/plans/)
4. **Research notes** -> [`docs/research/`](docs/research/)

For the full rule index + subagent list, see [`AGENTS.md`](AGENTS.md). The two files are intentionally synchronized - single content, two filenames.

## Hard preferences

- **Never** spawn subagents with `model: "composer-2-fast"` - see [`.cursor/rules/no-composer-2.mdc`](.cursor/rules/no-composer-2.mdc).
- **Never** import another `services/*` module directly - use outbox events or the gateway client.
- **Never** commit a `.env*` file.
- **Always** open a research note before code in a new package.
- **Always** verify dependency docs via WebFetch with retrieval date <=14 days.

If you can read this file, you have everything you need to work productively on this repo.
'@

# ---------- Template: .github/copilot-instructions.md ----------
$copilotTemplate = @'
# GitHub Copilot Instructions — {{TITLE}}

Loaded automatically by GitHub Copilot. Mirrors [`../AGENTS.md`](../AGENTS.md) + [`../CLAUDE.md`](../CLAUDE.md) so all AI coding agents (Copilot, Cursor, Claude Code, Codex, etc.) work from the same source of truth.

## Project

{{PITCH_ONELINER}}

## Architecture

Modular monolith: a single `apps/api-gateway` Node process hosts every business module as a Nest library under `services/*`. Single MongoDB Atlas cluster with collection-namespacing per service. Outbox is transport-agnostic via the `OutboxPort` interface - in-process `EventEmitter` for MVP, swap to Upstash Workflow + QStash post-revenue.

## Build / validation commands (after Phase 0 scaffolding lands)

```bash
pnpm install
pnpm dev                                    # all apps via Turborepo
pnpm build
pnpm test                                   # Jest + Vitest + RN-testing-library
pnpm e2e                                    # Playwright + axe-core (web); Detox/Maestro (mobile)
pnpm lint
pnpm openapi:generate && pnpm api:generate  # Zod -> OpenAPI -> Kubb hooks
```

## Read for full context

- [`../AGENTS.md`](../AGENTS.md) - rule index, subagent list, hard preferences.
- [`../.cursor/rules/`](../.cursor/rules/) - 14 always-applied + path-scoped rules.
- [`../.cursor/plans/`](../.cursor/plans/) - parent plan + sub-plans.
- [`../docs/research/`](../docs/research/) - retrieval-dated dependency citations.

## Hard preferences

- **Never** commit a `.env*` file.
- **Always** validate API request/response with Zod (`createZodDto`) - no `class-validator`.
- **Always** publish events via `OutboxPort.publish(event, { session })` inside the same Mongo transaction.
- **Always** open a research note before writing code in a new package.
- **Always** verify dependency docs via WebFetch with retrieval date <=14 days.
'@

# ---------- Template: docs/research/phase-0-rules.md (stub) ----------
$researchStubTemplate = @'
# Phase-0 Research Note - Rules, Skills, Subagents, Foundational Stack (STUB)

**Phase:** 0 (foundation)
**Topic:** Cursor rules, Copilot instructions, agent skills, subagents, and verified-current foundational dependencies for {{TITLE}}.
**Owner:** @goldr0g3r
**Status:** STUB - inherits foundational citations from [restaurant-ordering's phase-0-rules.md](https://github.com/goldr0g3r/restaurant-ordering/blob/main/docs/research/phase-0-rules.md). Project-specific dependency citations and decisions DEFERRED to the next deep-research session.
**Parent plan:** [.cursor/plans/{{SLUG_UNDERSCORE}}_architecture_{{HASH}}.plan.md](../../.cursor/plans/{{SLUG_UNDERSCORE}}_architecture_{{HASH}}.plan.md)

## 1. Goal

Ship the persistent guidance layer for the {{TITLE}} monorepo before any product code lands. Until the project-specific deep-research session runs, this note INHERITS the foundational citations + decisions from [restaurant-ordering](https://github.com/goldr0g3r/restaurant-ordering)'s `docs/research/phase-0-rules.md` (verified 2026-05-13, within the 14-day freshness window).

## 2. Inherited citations

See [restaurant-ordering/docs/research/phase-0-rules.md §2a](https://github.com/goldr0g3r/restaurant-ordering/blob/main/docs/research/phase-0-rules.md#2a-foundational-verified-2026-05-13-directly-or-2026-05-12-in-the-lotusgift-parent-project-within-the-14-day-freshness-window) for 18 retrieval-dated foundational citations covering: Next.js 16.2.6, Expo SDK (latest via `create-expo-app@latest`), Mongoose 9.6.1, Razorpay Payments Suite, WhatsApp Cloud API, Vercel Hobby tier, Cloudflare R2 free tier, Upstash Redis free tier, Copilot custom instructions, nestjs-zod 5.3, Kubb v3, @thallesp/nestjs-better-auth 2.6, Better-Auth Organization plugin, PostHog Node SDK, Oracle Always Free, MongoDB Atlas M0, Atlas Search on M0, Cursor rule/agent/skill formats.

All inherited citations have re-verification deadline 2026-05-26 or 2026-05-27.

## 3. Project-specific citations DEFERRED

The next deep-research session for this project must `WebFetch` and add retrieval-dated citations for the following domain-specific dependencies:

{{DEFERRED_CITATIONS_BLOCK}}

## 4. Inherited decisions log

See [restaurant-ordering's phase-0-rules.md §3](https://github.com/goldr0g3r/restaurant-ordering/blob/main/docs/research/phase-0-rules.md#3-decisions-log) for D1-D16 covering: rule format, rule size cap, `excludeAgent` policy, `AGENTS.md` + `CLAUDE.md` co-location, skill + subagent locations, `no-composer-2` naming, Mongoose 9 over Mongoose 8, Next.js 16, Expo managed workflow, TanStack Query v5, image storage on Cloudflare R2, cache on Upstash Redis Free, KOT print library shortlist.

## 5. Project-specific open questions

See parent plan's "Open questions" section. Deep research will close these in subsequent sessions.

## 6. Implementation checklist

- [x] Research note stub committed (this file)
- [x] All 14 `.cursor/rules/*.mdc` rules (copied from restaurant-ordering template)
- [x] `AGENTS.md` + `CLAUDE.md` + `README.md` + `.gitignore` + `.github/copilot-instructions.md`
- [x] 3 subagents in `.cursor/agents/`
- [x] Parent plan stub committed
- [ ] `restaurant-domain.mdc`-equivalent rule for this project's domain - DEFERRED to deep-research session
- [ ] All 14 `.github/instructions/*.instructions.md` Copilot mirrors - DEFERRED
- [ ] `pnpm install` + scaffolding via `pnpm dlx create-turbo@latest` + Next.js + Expo - DEFERRED to PR-1
- [ ] First green CI run - DEFERRED to PR-4

## 7. Versions

DEFERRED - locked at PR-1 scaffold time. Until then, treat the published latest as authoritative.

## 8. Status

Stub authored 2026-05-13 alongside parent plan stub during the pilot-first scaffolding session. Deep research + project-specific citation pass scheduled for a future session.
'@

# Domain-specific deferred-citation lists per project
$deferredCitations = @{
  'appointment-booking' = @'
- Calendly API competitor research (if any).
- Razorpay Subscriptions API (recurring deposits / membership plans).
- MSG91 SMS + WhatsApp BSP API.
- `react-big-calendar` or `fullcalendar` (web calendar UX).
- iCal / .ics generation library (calendar export).
- Google Calendar / Outlook 2-way sync APIs.
'@
  'event-booking' = @'
- Redis distributed lock for seat-locking (Redlock pattern via Upstash).
- Atlas seat-map indexing strategy.
- QR-ticket signing (JWT vs custom HMAC).
- Razorpay Magic Checkout (faster on-sale conversion).
- BookMyShow partner-coupon API surface.
- WebSocket transport choice (Socket.IO vs raw WS vs SSE) for live seat-map updates.
- ZXing / qr-scanner library for gate validation.
'@
  'quick-commerce' = @'
- Mapbox GL JS + Mapbox Directions (rider routing).
- H3 hexagonal geo-index library (Uber-style for dark-store ↔ delivery radius).
- WebSocket transport (Socket.IO vs raw WS) for rider location streaming.
- React Native background-location libraries (Expo + native modules).
- Cold-chain temperature monitoring integration (parked).
- Inventory live-sync model (Mongo change streams vs polling).
- Porter / Dunzo / Shadowfax APIs for outsourced last-mile (Phase 2 if needed).
'@
  'realestate-hyperlocal' = @'
- Mapbox GL JS (locality polygons + filterable markers).
- Matterport / Kuula / Zillow 3D Home tour embed APIs.
- Drone-shot video hosting (Mux vs Bunny.net).
- Google Maps Places autocomplete (for locality search).
- SEO-friendly URL routing strategy in Next.js 16 App Router.
- Schema.org RealEstateListing JSON-LD for organic search.
- WhatsApp Business webhook for inbound lead capture.
'@
  'coaching-lms' = @'
- Mux Video API (signed playback URLs + DRM).
- Bunny.net Stream (alternative to Mux, cheaper for India bandwidth).
- @vidstack/react or video.js for player UX.
- expo-file-system for offline downloads on mobile.
- React PDF or Puppeteer (cert generation).
- Stream Chat or Sendbird (cohort discussion).
- Zoom / Google Meet API for live cohort sessions.
- Razorpay Subscriptions API (monthly cohort billing).
- DRM (Widevine for Android, FairPlay for iOS) - feasibility on M0 budget.
'@
  'video-streaming' = @'
- Mux Video API or AWS MediaConvert + S3 + CloudFront alternative.
- Shaka Player (web HLS+DASH+DRM).
- react-native-video with Widevine + FairPlay (mobile).
- Widevine license server (Google Widevine Cloud or DRMtoday).
- FairPlay license server (Apple FPS SDK).
- Content packager (Shaka Packager / Bento4).
- Encoder orchestrator (FFmpeg pipelines + S3 or Mux Live).
- Multi-bitrate ABR ladder strategy.
- CDN signed-URL token (Cloudflare R2 + Cloudflare Stream or Bunny.net).
- Recommendation MVP (PostgreSQL pgvector or simple recency+genre on Mongo).
- Content rights metadata model (region + window + DRM tier).
'@
  'healthcare-clinic' = @'
- ABDM (Ayushman Bharat Digital Mission) sandbox API.
- DPDP Act 2023 consent capture + retention rules.
- Digital signature (eMudhra / NSDL e-Sign) for prescriptions.
- HL7 FHIR for inter-clinic EHR exchange (Phase 2).
- WhatsApp template approval workflow for medical reminders.
- Telemedicine - Jio Meet, Zoom Healthcare, or self-hosted Jitsi.
- Lab report PDF parser (Tesseract / Azure Form Recognizer / OCR.space).
- ePrescription standard (Indian regulatory).
'@
  'fitness-trainer' = @'
- Apple HealthKit (iOS) + Google Fit (Android) OAuth scopes.
- Open Food Facts free API (nutrition macros database).
- Stream Chat or Sendbird free tier (1:1 trainer-client chat).
- React Native Video for trainer-recorded workout demos.
- Expo Camera for progress-photo capture.
- Cloudflare R2 storage budget for progress-photo archive.
- expo-notifications for workout reminders.
- Wearable sync polling vs webhook (HealthKit + Google Fit specifics).
'@
  'services-marketplace' = @'
- KYC providers (Razorpay X KYC, Cashfree Verification Suite, Karza, Signzy) - compare for service-provider onboarding.
- Mapbox GL JS or Google Maps SDK (service-area + provider location).
- Razorpay Route for commission split (platform vs provider).
- Twilio Verify or MSG91 OTP for in-job pickup-verification.
- React Native background-location for in-job tracking.
- Stream Chat or Sendbird (customer <-> provider).
- Sentry for crash reports.
- Razorpay Payouts API for provider weekly settlement.
'@
  'cab-hailing' = @'
- Mapbox GL JS + Mapbox Navigation SDK or Google Maps Platform.
- H3 hexagonal geo-index (Uber H3).
- WebSocket transport (Socket.IO + Redis adapter).
- React Native background-location with always-on permissions UX.
- Twilio Verify (in-app SOS button verification).
- Razorpay (in-app pay) + Razorpay Tokenisation (saved cards).
- Razorpay Payouts (driver weekly settlement).
- Surge pricing model (rule-based vs ML).
- Driver-rider matching algorithm (haversine + ETA + surge multiplier).
- Crash reporting (Sentry React Native).
- Background-location native module (Expo config-plugin or bare workflow decision).
'@
  'crm-vertical' = @'
- WhatsApp Cloud API templates + webhook signature verification.
- PDF generation (React PDF / Puppeteer + Chromium on Oracle VM).
- DocuSign / Zoho Sign / Aadhaar e-Sign API for quote signature.
- TipTap or Lexical for rich-text email composer.
- Outbound email - Resend with custom domain + DKIM/SPF/DMARC.
- Calendar 2-way sync (Google + Outlook + Apple iCloud Calendar).
- Vertical-specific KYC integrations (immigration: passport scan; auto: RTO API; healthcare: PAN+Aadhaar verification).
- Razorpay Subscriptions API (SaaS subscription billing).
- Integration framework (Zapier-style triggers/actions) - native vs use Pipedream/n8n.
'@
}

# Helper: write file with UTF8 BOM-less encoding for cross-tool compatibility
function Write-File($Path, $Content) {
  $dir = Split-Path -Parent $Path
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }
  # PowerShell 5 Set-Content with Encoding UTF8 writes BOM; use [IO.File] for BOM-less
  [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

$wrote = 0
foreach ($p in $projects) {
  $slug = $p.Slug
  $slugUnderscore = $slug -replace '-', '_'
  $dst = "C:\Code\$slug"
  if (-not (Test-Path $dst)) {
    Write-Warning "Skipping $slug - directory not found"
    continue
  }

  # Substitute placeholders
  $agents = $agentsTemplate `
    -replace '{{TITLE}}', $p.Title `
    -replace '{{PITCH_ONELINER}}', $p.PitchOneLiner `
    -replace '{{DOMAIN}}', $p.Domain `
    -replace '{{SLUG_UNDERSCORE}}', $slugUnderscore

  $claude = $claudeTemplate `
    -replace '{{TITLE}}', $p.Title `
    -replace '{{SLUG_UNDERSCORE}}', $slugUnderscore

  $copilot = $copilotTemplate `
    -replace '{{TITLE}}', $p.Title `
    -replace '{{PITCH_ONELINER}}', $p.PitchOneLiner

  $research = $researchStubTemplate `
    -replace '{{TITLE}}', $p.Title `
    -replace '{{SLUG_UNDERSCORE}}', $slugUnderscore `
    -replace '{{HASH}}', $p.Hash `
    -replace '{{DEFERRED_CITATIONS_BLOCK}}', $deferredCitations[$slug]

  # Write files
  Write-File "$dst\AGENTS.md" $agents
  Write-File "$dst\CLAUDE.md" $claude
  Write-File "$dst\.github\copilot-instructions.md" $copilot
  Write-File "$dst\docs\research\phase-0-rules.md" $research
  $wrote += 4
  Write-Host "Wrote 4 files for: $slug" -ForegroundColor Green
}

Write-Host "`nDone. Wrote $wrote files across $($projects.Count) projects." -ForegroundColor Cyan
