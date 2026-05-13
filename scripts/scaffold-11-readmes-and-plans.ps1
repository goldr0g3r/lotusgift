# scaffold-11-readmes-and-plans.ps1
# Generates README.md + .cursor/plans/<slug>_architecture_<hash>.plan.md (STUB) for all 11 sibling projects.
# Run after scaffold-11-projects.ps1.

$ErrorActionPreference = 'Stop'

$projects = @(
  @{
    Slug = 'appointment-booking'
    Title = 'Appointment Booking Platform'
    PitchOneLiner = 'Multi-staff and multi-resource appointment booking with deposit collection, automated WhatsApp/SMS reminders, and customer self-rebooking links. India-first, free-tier-first, mobile-and-web.'
    Domain = 'service businesses (salons, dental clinics, physiotherapy clinics, tutoring academies, consultants)'
    Hash = 'a7e8b3c5'
    UsersBlurb = 'Salon chain owners, dental practices, physios, tutoring academies + their customers booking time slots online, their staff seeing the daily calendar, and managers handling no-shows and reschedules.'
    MobileStackNote = 'Expo (React Native, managed workflow) - customer app for booking + reschedule; staff app for daily schedule + check-in.'
    KeyDeltasBlock = "- **Multi-staff/multi-resource scheduling** (Calendly is single-user; this is salon-grade with N stylists or doctors).`n- **Buffer time between appointments** (per service-type).`n- **Deposit collection** via Razorpay for no-show protection (configurable per-business).`n- **WhatsApp + SMS reminders** at T-24h and T-2h with rebook/cancel links.`n- **Recurring sessions** (weekly tutoring slots, monthly physio packages)."
    KeyInvariants = 'no double-booking; deposit refund within 24h cancellation window; WhatsApp 24h-window enforcement; staff schedule conflicts surfaced before booking'
    DomainRuleName = 'appointment-domain'
    DomainSummary = "Multi-staff or multi-resource service businesses need online booking that respects staff calendars + service-duration matrices + buffer time. Calendly does not fit because it is single-user. This project gives salons, clinics, and tutors a SaaS that handles per-staff slot generation, deposit collection, no-show protection, and customer self-rebooking via WhatsApp links. Success: cancellation rate <8% with deposits, <18% without; rebook-conversion rate via WhatsApp link >40%."
    ServiceList = "- **auth-service** - Better-Auth + Phone OTP (customers) + Passkey (owner/manager) + Org plugin (business-org + staff-org + customer-org).`n- **business-service** - business profile (single-location or chain), hours, time-zone, currency, GST registration.`n- **staff-service** - staff invites, roles (owner, manager, stylist/doctor/tutor, receptionist), per-staff working hours and breaks.`n- **service-catalog-service** - bookable services with duration, buffer, price, required-resource (chair / room).`n- **resource-service** - rooms, chairs, equipment - bookable as part of service definition.`n- **appointment-service** - booking workflow, conflict detection, recurring slots, waitlist.`n- **calendar-service** - calendar render + Google/Outlook 2-way sync.`n- **payment-service** - Razorpay deposits + final payment + refund flow.`n- **deposit-service** - deposit collection + refund + no-show capture policy.`n- **notification-service** - WhatsApp + SMS + email reminders at T-24h, T-2h.`n- **intake-form-service** - pre-appointment Zod-validated form (medical history, hair details, project brief).`n- **review-service** - post-appointment review + rebook prompt.`n- **insights-service** - busiest-hour heatmap, top-staff revenue, no-show rate per service."
    KeyDeltas = "- **Multi-staff scheduling matrix**: not single-user like Calendly; staff x service x time-slot calendar.`n- **Deposit-driven no-show reduction** (the killer feature for high-no-show domains like dental).`n- **WhatsApp-first reminders** (India-specific: SMS reliability + WhatsApp open-rate >90%).`n- **Recurring + package bookings** (10-session physio packages, monthly tutoring subscriptions).`n- **Google/Outlook calendar 2-way sync** (staff often have personal calendars they must keep in sync)."
    WebApps = '`apps/web-customer` (Next.js PWA - booking + self-rebook); `apps/web-admin` (Next.js - owner/manager dashboard, calendar, staff invites, payouts, insights).'
    MobileApps = '`apps/mobile-customer` (Expo - faster rebook + push reminders + loyalty wallet); `apps/mobile-staff` (Expo - day-view calendar, check-in customer, complete service, take feedback).'
    OpenQuestions = "- **P5**: OTP rate-limit policy - per-phone, per-device, per-IP?`n- **P7**: Service-catalog template library (pre-built dental/salon/physio templates) or always custom?`n- **P9**: Deposit refund window - business-configurable with platform default 24h, or platform-wide fixed?`n- **P11**: Recurring booking model - explicit user opt-in per session, or auto-book all sessions in package up-front?`n- **P14**: WhatsApp template approval workflow - business-owner can edit or platform-fixed?"
  },
  @{
    Slug = 'event-booking'
    Title = 'Event Booking Platform'
    PitchOneLiner = 'Movie + concert + event ticketing with seat selection, dynamic pricing, partner coupons, and contactless QR-ticket gate validation. India-first, free-tier-first, mobile-and-web.'
    Domain = 'cinema chains, concert promoters, small-venue operators, festival organisers, comedy clubs'
    Hash = 'e5d4a1f2'
    UsersBlurb = 'Customers buying tickets online for movies/concerts/events; venue operators managing showtimes and capacity; gate staff scanning QR tickets at entry.'
    MobileStackNote = 'Expo for customer app (browse + book + ticket wallet); native-considered for gate-scan app (camera + offline mode) at scale.'
    KeyDeltasBlock = "- **Seat-locking via Redis** (atomic reserve/release - critical at on-sale moments).`n- **Dynamic pricing** (per-row, per-section, time-of-show, demand multiplier).`n- **Partner-coupon engine** (BookMyShow-style: card-network offers, telco offers, brand tie-ups).`n- **QR-ticket signing + gate-scan validation** (offline-capable; one-time-use enforced).`n- **Refund within 2h policy** with auto-issue."
    KeyInvariants = 'seat once-and-only-once booked; QR ticket cannot be reused; payment authorise -> seat-confirm atomic; refund window enforced; partner-coupon stack rules enforced'
    DomainRuleName = 'event-booking-domain'
    DomainSummary = "Event ticketing requires very high-concurrency seat-locking at on-sale moments (10k+ concurrent for popular shows), atomic payment->seat-confirm flows, and gate-scan QR validation that works even on flaky mobile signal at the venue. India-specific deltas: GST on entertainment tax, partner-coupon ecosystem (HDFC/SBI/Paytm/Razorpay offers), refund-within-2h regulatory expectation. Success: zero double-booked seats, gate-scan <500ms, partner-coupon redemption rate >15%."
    ServiceList = "- **auth-service** - Better-Auth + Phone OTP (customers) + Passkey (venue operators) + Org plugin (venue-org + customer-org).`n- **venue-service** - venue registry, hall layout (rows + sections + seats with row-column-tier), accessibility-seat tagging.`n- **event-service** - event metadata (title, genre, language, cert, duration, poster, trailer URL).`n- **showtime-service** - showtimes per venue x event x date x time with pricing-tier.`n- **seat-inventory-service** - per-showtime seat availability state machine (AVAILABLE -> LOCKED -> BOOKED -> CHECKED-IN); Redis SETNX seat-lock with TTL.`n- **pricing-service** - dynamic pricing (base + demand multiplier + early-bird discount + special-day surge).`n- **booking-service** - cart of seats per showtime + saga (lock -> authorise -> confirm; release on payment-fail).`n- **payment-service** - Razorpay + UPI deeplink + partner-coupon engine.`n- **partner-coupon-service** - coupon catalog (Razorpay/HDFC/SBI/Paytm offers); validation + stack rules.`n- **ticket-issuance-service** - sign QR (JWT) per ticket; one-time-use enforcement.`n- **gate-validation-service** - QR scan + signature verify + mark CHECKED-IN; offline-capable via local SQLite sync.`n- **refund-service** - refund window policy + auto-issue.`n- **notification-service** - WhatsApp reminder T-2h before show + e-ticket delivery.`n- **insights-service** - sell-out rate, popular timeslots, coupon attribution."
    KeyDeltas = "- **Atomic seat-locking via Redis SETNX + TTL** - prevents double-booking under load.`n- **Dynamic pricing tiers + surge** - matched to demand without manual intervention.`n- **Partner-coupon engine** with stacking rules (one card-offer + one telco-offer combinable).`n- **JWT-signed QR tickets** + offline gate-scan with sync-on-reconnect.`n- **Refund-within-2h auto-issue** to comply with consumer-protection guidelines."
    WebApps = '`apps/web-customer` (Next.js - browse + book + e-ticket wallet); `apps/web-admin` (Next.js - venue operator dashboard, showtime CRUD, hall-layout editor, sell-out monitor, refund queue).'
    MobileApps = '`apps/mobile-customer` (Expo - native push for show-day reminders + offline e-ticket); `apps/mobile-gate` (Expo - QR scan via expo-camera with offline-sync SQLite, gate-staff role).'
    OpenQuestions = "- **P5**: Partner-coupon SSO with banks - direct OAuth or Razorpay-mediated?`n- **P7**: Hall-layout editor - drag-drop seat-by-seat or template-library?`n- **P9**: Seat-lock TTL - 5 minutes (industry standard) or shorter for high-demand?`n- **P11**: Refund-within-2h - applies to all bookings or only confirmed-not-yet-watched?`n- **P14**: WhatsApp e-ticket vs email-only - which is the legal-document-of-record?"
  },
  @{
    Slug = 'quick-commerce'
    Title = 'Quick-Commerce Platform'
    PitchOneLiner = '10-minute hyperlocal grocery and essentials delivery with multi-dark-store routing, rider dispatch, in-stock-only PLP, and live order tracking. India-first, free-tier-first, mobile-and-web.'
    Domain = 'hyperlocal grocery + essentials + medicines + emergency-cut produce'
    Hash = '9b1c7d80'
    UsersBlurb = 'Customers ordering groceries and essentials for 10-min delivery; dark-store operators packing orders; riders picking and delivering; ops managers monitoring SLAs.'
    MobileStackNote = 'Native (React Native bare workflow + native modules) for customer + rider apps (background-location + map performance). Expo managed for admin app.'
    KeyDeltasBlock = "- **Dark-store-per-pincode model** with serviceability check at pincode entry.`n- **In-stock-only PLP** - only show items available at the customer's serving dark store (live inventory join at read-time).`n- **Sub-15-min SLA tracking** with rider live-tracking via WebSocket + Mapbox.`n- **H3 hex-grid geo-index** for dark-store-to-customer routing.`n- **Cold-chain temperature tracking** for select items (Phase 2)."
    KeyInvariants = 'no out-of-stock at checkout (live join); dark-store routing within service polygon; rider once-and-only-once assignment; payment authorise -> rider-dispatch atomic; SLA breach -> auto-credit to customer wallet'
    DomainRuleName = 'quick-commerce-domain'
    DomainSummary = "10-minute hyperlocal delivery requires dark stores within a 2-3 km radius of every customer, in-stock-only product listings (no false promises), and real-time rider dispatch with location streaming. India-specific: heavy COD share at start, UPI dominance, vernacular UX for tier-2 cities, monsoon resilience. Success: SLA hit-rate >85%, average-delivery-time <12 min, zero out-of-stock orders."
    ServiceList = "- **auth-service** - Phone OTP for customers + driver app login + Better-Auth Org (operator-org + rider-org).`n- **dark-store-service** - dark-store registry (address + lat/lng + service-polygon or pincode-list + operating hours + cold-chain capability).`n- **catalog-service** - product master + variants + brand + category + dietary; per-dark-store availability join.`n- **inventory-service** - per-dark-store stock ledger + reserve-on-add-to-cart + release-on-cart-abandon + cycle-count workflow.`n- **order-service** - cart -> serviceability-check -> pricing-snapshot -> payment-authorise -> dark-store-route -> rider-assign saga.`n- **dispatch-service** - rider-assignment algorithm (haversine + ETA + current-load); WebSocket real-time location streaming.`n- **rider-service** - rider onboarding + KYC + vehicle + earnings ledger + payout via Razorpay.`n- **payment-service** - Razorpay + UPI + COD with risk-scoring; auto-credit SLA-breach refunds.`n- **promotions-service** - first-order coupons + free-delivery coupons + brand-funded offers (categories).`n- **notification-service** - WhatsApp + SMS + push (order placed, packed, out for delivery, delivered, delayed).`n- **tax-service** - GST per HSN code + per-pincode tax tier.`n- **address-service** - customer address book with serviceability cache + plus-code support.`n- **insights-service** - SLA breach reasons, top out-of-stock items, dark-store throughput, rider productivity."
    KeyDeltas = "- **Live inventory join on PLP** - no item shown without confirmed stock at the customer's serving dark store.`n- **H3 hexagonal geo-index** - O(1) dark-store-to-customer lookup, used by Uber.`n- **WebSocket rider tracking** - sub-second location updates to customer app.`n- **Atomic order-to-rider assignment** with multi-rider race resolution (Redis SETNX on rider availability).`n- **SLA breach auto-credit** - customer wallet credited automatically without support ticket."
    WebApps = '`apps/web-customer` (Next.js PWA - browse + order; lower priority than mobile); `apps/web-admin` (Next.js - dark-store ops + rider monitor + SLA dashboard + refund console).'
    MobileApps = '`apps/mobile-customer` (React Native bare - speed-critical, background-location for live order, push for delivery status); `apps/mobile-rider` (React Native bare - always-on background-location, navigation, accept/reject orders, COD collection); `apps/mobile-packer` (Expo managed - dark-store packer scans + bags orders).'
    OpenQuestions = "- **P5**: Customer KYC required for high-value COD orders?`n- **P6**: Dark-store-polygon editor UX (draw-on-map vs pincode-list)?`n- **P8**: Inventory pessimistic-lock window for cart - 15min or session-bound?`n- **P10**: Rider-dispatch tiebreaker - shortest-ETA, lowest-current-load, or longest-idle?`n- **P12**: SLA breach refund - full delivery fee, percentage of order, or wallet credit only?"
  },
  @{
    Slug = 'realestate-hyperlocal'
    Title = 'Hyperlocal Real-Estate Platform'
    PitchOneLiner = 'Locality-focused property listings with virtual-tour embeds, WhatsApp-driven lead capture, and a mini-CRM for independent brokers and small brokerages. India-first, free-tier-first, mobile-and-web.'
    Domain = 'independent brokers and small brokerages working a 1-3 city radius'
    Hash = 'c2e8f3a9'
    UsersBlurb = 'Independent brokers escaping MagicBricks subscription fees; buyers/renters searching by locality with virtual tours; brokerage owners tracking lead pipeline.'
    MobileStackNote = 'Expo for buyer app (listing browse + map search + WhatsApp lead form); web is the primary surface for SEO-driven discovery.'
    KeyDeltasBlock = "- **Locality-page SEO** is the real growth lever (locality + amenity + project-name URLs ranked organically).`n- **Matterport / Kuula virtual-tour embed** + drone-shot video gallery as differentiators.`n- **WhatsApp-driven lead capture** instead of phone-call-only.`n- **Mini-CRM for brokers** (lead pipeline: new -> visiting -> negotiating -> closed) - reduces broker churn.`n- **Subscription-priced premium listings** (broker pays X/month for top-of-locality slot)."
    KeyInvariants = 'no listing without broker KYC; locality+amenity+project SEO URL stable; lead notification to broker within 60s; WhatsApp lead-template approved'
    DomainRuleName = 'realestate-domain'
    DomainSummary = "Independent brokers in tier-1/2 cities pay MagicBricks/99acres Rs 5k-25k/month for listings, take phone-call leads only, and lose 30-50% of leads to slow response. This project gives brokers a SaaS that captures leads via WhatsApp + 'Schedule visit' forms, routes them to a mini-CRM, and exposes the listings via locality-SEO URLs (the real growth lever vs portal competition). Mapbox map search + virtual tour embed are table stakes."
    ServiceList = "- **auth-service** - Phone OTP for buyers + Passkey for brokers + Better-Auth Org (brokerage-org).`n- **broker-service** - broker KYC (RERA + PAN + GST), brokerage settings, subscription tier.`n- **listing-service** - property CRUD (BHK, area, price, possession-date, amenities, photo gallery, video gallery, virtual-tour URL).`n- **virtual-tour-service** - Matterport / Kuula / Zillow 3D Home embed manager.`n- **lead-service** - 'Schedule visit' form + WhatsApp inbound + 'Call broker' click - all route to broker's lead inbox.`n- **broker-crm-service** - lead pipeline kanban (new / visiting / negotiating / closed); follow-up reminders; lost-reason capture.`n- **map-search-service** - Mapbox-backed geosearch with locality polygons + price-band + BHK filter.`n- **payment-premium-listing-service** - Razorpay Subscriptions for premium listing tier.`n- **notification-service** - WhatsApp lead-notification + SMS fallback + email digest.`n- **insights-service** - listing views, lead conversion %, top sources, broker performance."
    KeyDeltas = "- **SEO-driven discovery** (locality + amenity landing pages with Schema.org RealEstateListing JSON-LD).`n- **Virtual-tour embeds** (Matterport, Kuula, 3D Home) as first-class media types.`n- **WhatsApp lead capture** with auto-routing to broker phone in <60s.`n- **Mini-CRM** as a retention tool (broker gets value beyond just listings).`n- **Subscription premium listings** as the revenue model (not pay-per-lead, which races to bottom)."
    WebApps = '`apps/web-buyer` (Next.js - SEO-critical, map search + locality pages + listing detail with virtual-tour embed); `apps/web-broker` (Next.js - dashboard, listing CRUD, lead pipeline kanban, subscription manager, insights).'
    MobileApps = '`apps/mobile-buyer` (Expo - on-the-go listing browse + Mapbox map + saved searches + WhatsApp lead form); `apps/mobile-broker` (Expo - lead push notifications + quick lead update from anywhere).'
    OpenQuestions = "- **P6**: Listing photo upload limit per listing - 30 photos cap on R2 free tier?`n- **P7**: Virtual-tour embed - charge brokers per listing or premium-tier-only?`n- **P9**: Lead-routing tiebreaker - round-robin within brokerage, or always to listing-broker?`n- **P10**: SEO URL canonical form - city + locality + project, or city + project + listing-id?`n- **P12**: Premium-listing pricing model - tiered (silver/gold/platinum) or pay-per-day-on-top?"
  },
  @{
    Slug = 'coaching-lms'
    Title = 'Coaching + Course LMS Platform'
    PitchOneLiner = 'Drip-content cohort-based course platform with live-cohort sessions, assignments, signed-URL video DRM, and auto-generated certificates. India-first, free-tier-first, mobile-and-web with offline downloads.'
    Domain = 'solo coaches, ed-tech startups, certification bodies, language tutors, vocational trainers'
    Hash = 'f1a7b5c4'
    UsersBlurb = 'Solo coaches selling Rs 5k-50k cohort-based courses; learners progressing through modules; coaches grading assignments and running live cohort sessions; certification bodies issuing tamper-proof certs.'
    MobileStackNote = 'Expo for learner app (offline downloads via expo-file-system; DRM playback via react-native-video); web primary for owner/admin and live-session attendance.'
    KeyDeltasBlock = "- **Drip content** (weekly module unlock) - improves completion rates 2-3x vs all-at-once.`n- **Signed-URL video DRM** (Mux or Bunny.net) - piracy protection from day 1.`n- **Live-cohort sessions** with Zoom / Google Meet integration.`n- **Assignment + grading** workflow with TipTap rich-text feedback.`n- **Auto-generated certificates** with QR verification URL."
    KeyInvariants = 'video never served without signed-URL token; cert QR resolves to verifiable record; drip schedule respects timezone of learner; payment-success -> enrolment atomic'
    DomainRuleName = 'lms-domain'
    DomainSummary = "Solo coaches struggle to scale because Udemy commodifies and Teachable is built for US audiences. This project gives Indian coaches a SaaS for cohort-based courses with drip content (industry-proven for completion), signed-URL video DRM (kills piracy reseller market), live cohort sessions via Zoom/Meet, and tamper-proof certificates with QR verification. Razorpay Subscriptions for recurring billing; WhatsApp for cohort-discussion fallback."
    ServiceList = "- **auth-service** - Phone OTP for learners + Passkey for coaches + Better-Auth Org (coach-org + learner-org).`n- **course-service** - course catalog + categories + landing page metadata.`n- **module-service** - course -> module -> lesson hierarchy with drip-unlock schedule.`n- **lesson-service** - lesson content (video + markdown + downloadable resources).`n- **video-service** - Mux/Bunny.net signed-URL token issuance + DRM policy per-tier.`n- **enrolment-service** - course purchase -> enrolment record -> cohort assignment (if cohort-based).`n- **cohort-service** - cohort scheduling, Zoom/Meet link injection, attendance tracking.`n- **assignment-service** - assignment upload, instructor grading, rich-text feedback.`n- **certificate-service** - auto-generate cert PDF + QR verification URL.`n- **subscription-payment-service** - Razorpay Subscriptions + one-time payment + dunning.`n- **notification-service** - WhatsApp cohort notifications + drip unlock + assignment reminder.`n- **support-service** - per-course Q&A thread + coach replies.`n- **insights-service** - completion rates by module, drop-off cliffs, NPS per cohort."
    KeyDeltas = "- **Drip-unlock schedule** baked into module model (not just metadata).`n- **Signed-URL video tokens** with per-user expiry + watermarking (Mux capability).`n- **Live-cohort integration** with Zoom/Meet (auto-create meeting per cohort session).`n- **Certificate QR verification** (public endpoint resolves to issuance record).`n- **Offline downloads** for mobile via expo-file-system (paid-tier feature)."
    WebApps = '`apps/web-learner` (Next.js - course catalog, lesson player, assignment submission, certificate display); `apps/web-coach` (Next.js - course CRUD, cohort schedule, grading queue, revenue dashboard).'
    MobileApps = '`apps/mobile-learner` (Expo - downloads for offline, push notifications, biometric login, DRM playback); `apps/mobile-coach` (Expo - grade-on-the-go, cohort engagement).'
    OpenQuestions = "- **P5**: Cohort role - is 'cohort TA' a separate role or just a coach with limited access?`n- **P7**: Video DRM provider - Mux (paid from day 1) vs Bunny.net (free for low usage)?`n- **P9**: Drip-unlock timezone - learner's local or coach's local?`n- **P11**: Assignment plagiarism check - integrate Turnitin (paid) or skip for MVP?`n- **P14**: Certificate signing - Aadhaar e-Sign (legal weight) or self-signed PDF (sufficient for most)?"
  },
  @{
    Slug = 'video-streaming'
    Title = 'Video Streaming Platform'
    PitchOneLiner = 'HLS + DASH on-demand and live video streaming with multi-DRM (Widevine + FairPlay + PlayReady), multi-bitrate ladder, personalised home, watchlist, and resume-watching. India-first, free-tier-first, mobile-and-web.'
    Domain = 'regional OTT operators, niche content curators, corporate training catalogues, faith-based content libraries'
    Hash = '8d4f9b2e'
    UsersBlurb = 'Content owners with libraries too small to negotiate with Hotstar but big enough to need real DRM. Subscribers consuming on web + mobile + (eventually) TV.'
    MobileStackNote = 'Native iOS (FairPlay SDK requirement) + native Android (Widevine SDK) for production-grade DRM. Expo with bare workflow + native modules acceptable for MVP.'
    KeyDeltasBlock = "- **HLS + DASH adaptive bitrate** manifests (multi-bitrate ladder generated per asset).`n- **Multi-DRM** (Widevine for Android, FairPlay for iOS, PlayReady for web/Edge).`n- **CDN signed-URL tokens** with per-user, per-IP, per-time-window restrictions.`n- **Encoder orchestrator** (Mux Live for live, FFmpeg pipeline for VOD with multi-bitrate output to R2).`n- **Resume-watching offset** stored per-user-per-asset; recommendation MVP = recency + genre."
    KeyInvariants = 'no playback without DRM license token; rights-windowing respected (regional + temporal); subscription tier respected (free/premium gating); session count per-account enforced'
    DomainRuleName = 'streaming-domain'
    DomainSummary = "OTT streaming for niche libraries (regional, training, faith-based) requires the same DRM + CDN + adaptive-bitrate as Netflix, scaled down. Free tier cannot host the actual video bytes (R2 free is 10GB; a 90-min HD movie is 5-8GB), so this project teaches the architecture for free-tier MVP + clear upgrade path. Razorpay Subscriptions + dunning is the revenue model. Rights metadata (region + window + DRM tier) is the most under-appreciated complexity."
    ServiceList = "- **auth-service** - Email + Passkey + 2FA + Better-Auth Org (subscriber-org).`n- **content-service** - movie/show/series/season/episode hierarchy; rights metadata (region + window + DRM tier).`n- **video-asset-service** - asset registry; manifest URLs per asset per quality tier; DRM key references.`n- **encoder-orchestrator-service** - VOD: FFmpeg + R2 multi-bitrate output. Live: Mux Live or self-host SRS.`n- **cdn-policy-service** - signed-URL token issuance per request (per-user + per-IP + 30-min TTL).`n- **license-issuer-service** - Widevine + FairPlay + PlayReady license tokens; respects rights + subscription tier.`n- **playback-service** - manifest delivery + license-token issuance + resume-offset lookup.`n- **watchlist-service** - user watchlist + recently-watched + continue-watching.`n- **recommendation-service** - MVP = recency + genre + collaborative-filter stub; full ML at scale.`n- **subscription-service** - tier (free/basic/premium) + plan + status (active/grace/cancelled).`n- **payment-service** - Razorpay Subscriptions + dunning + upgrade/downgrade prorate.`n- **notification-service** - WhatsApp + email for billing + new-content alerts.`n- **analytics-service** - heartbeat events (every 30s during playback); concurrent-session count.`n- **content-rights-service** - rights metadata (region + window + DRM tier + max-concurrent-sessions)."
    KeyDeltas = "- **Manifest-based adaptive bitrate** (HLS + DASH) - critical for India's variable bandwidth.`n- **Multi-DRM** (Widevine/FairPlay/PlayReady) - non-negotiable for any licensed content.`n- **Signed-URL tokens** with per-IP + TTL - kills hotlinking + URL sharing.`n- **Rights-windowing** (region + temporal + tier) baked into content model.`n- **Concurrent-session enforcement** (Premium = 4 streams, Basic = 1) - hard requirement for licensors."
    WebApps = '`apps/web-viewer` (Next.js - browse + playback via Shaka Player + watchlist); `apps/web-admin` (Next.js - content CRUD, rights metadata, encoder job queue, subscription oversight, churn dashboard).'
    MobileApps = '`apps/mobile-viewer` (Native iOS + Native Android with DRM SDKs - playback + downloads-for-offline + Chromecast); `apps/mobile-tv` (deferred - Apple TV / Android TV native, post-launch).'
    OpenQuestions = "- **P5**: Concurrent-session enforcement - hard kick or queue?`n- **P7**: Encoder choice - Mux (managed, paid) vs FFmpeg+R2 (self-host, free)?`n- **P9**: Live streaming - DIY SRS server on Oracle VM or Mux Live (paid)?`n- **P11**: DRM license server - DRMtoday (paid) or Google Widevine Cloud (free for low usage)?`n- **P15**: Offline-download policy - paid tier only + watermarked + 30-day expiry?"
  },
  @{
    Slug = 'healthcare-clinic'
    Title = 'Clinic Management Platform'
    PitchOneLiner = 'Patient appointments + EMR + prescription auto-fill from history + lab orders + WhatsApp follow-up. ABDM-ready, DPDP-Act-2023-compliant. India-first, free-tier-first, mobile-and-web.'
    Domain = 'solo doctors, 2-5-doctor multi-specialty clinics, dental practices, physiotherapy centres'
    Hash = '7a3c9e1b'
    UsersBlurb = 'Doctors digitising paper case sheets; clinic receptionists managing the queue; patients booking appointments and receiving WhatsApp reminders/lab reports.'
    MobileStackNote = 'Expo for patient app (book + lab reports + WhatsApp follow-up); web is primary for doctor (clinic desktop is the standard surface).'
    KeyDeltasBlock = "- **Prescription auto-fill from history** (saves 3 min/patient = 24 extra patients/day).`n- **EMR with versioning** (every change audit-logged for medical-legal).`n- **Lab-report PDF upload + parser** (Tesseract / Azure Form Recognizer extraction to structured fields).`n- **ABDM-ready** (Ayushman Bharat Digital Mission optional integration for portable patient records).`n- **DPDP Act 2023 strict consent** with retention period + erase-on-request."
    KeyInvariants = 'EMR change audit-logged; prescription requires doctor digital signature; lab-report linked to order; patient consent captured before WhatsApp; data retention policy enforced'
    DomainRuleName = 'healthcare-domain'
    DomainSummary = "Solo and small-clinic doctors waste 3-5 min per patient re-writing prescription history. This project gives them: appointment booking + EMR with full history + prescription auto-fill + lab order + WhatsApp follow-up. ABDM integration optional. DPDP Act 2023 compliance built-in. Differentiator vs MedPlus/Practo: doctor-owned data (not vendor lock-in), free-tier hosted (Rs 0/month vs Practo Rs 2k/mo), digital prescription with valid e-sign."
    ServiceList = "- **auth-service** - Passkey + 2FA mandatory for doctor + Phone OTP for patient + Better-Auth Org (clinic-org + patient-org).`n- **doctor-service** - doctor profile (qualification, registration, specialisation, signature image).`n- **patient-service** - patient registration + DPDP consent capture + searchable history.`n- **appointment-service** - slot-based booking + walk-in + queue management.`n- **emr-service** - case sheets (symptoms, diagnosis, vitals, notes); full versioning + audit log.`n- **prescription-service** - prescription with auto-fill from history; digital e-sign (eMudhra/NSDL); PDF with clinic letterhead.`n- **lab-order-service** - order labs (panel + price) + result upload + parser.`n- **billing-service** - GST invoice + insurance claim (post-pay or cashless).`n- **insurance-service** - cashless claim submission to TPA (Health Claim Exchange).`n- **notification-service** - WhatsApp + SMS appointment + lab-ready + prescription delivery.`n- **compliance-service** - DPDP consent log + data-export + erase-on-request.`n- **telemedicine-service** - Jio Meet / Zoom Healthcare embed for video consult.`n- **insights-service** - patient flow, avg time per consult, lab-turnover, revenue by service."
    KeyDeltas = "- **Prescription auto-fill from history** (Practo charges extra for this).`n- **EMR with versioning** (immutable audit log; rotate-back-able for medical-legal review).`n- **Lab-report PDF parser** (OCR-extracts BP/sugar/HbA1c to time-series chart).`n- **ABDM HIE integration** (patient consents to share, doctor pulls portable record).`n- **DPDP Act 2023 compliance** baked-in (consent + retention + erasure)."
    WebApps = '`apps/web-clinic` (Next.js - doctor + receptionist surface; desktop-first); `apps/web-patient` (Next.js PWA - book + view history + download reports).'
    MobileApps = '`apps/mobile-patient` (Expo - book + WhatsApp follow-up + report downloads + biometric login); `apps/mobile-doctor` (Expo - prescription-on-the-go + lab-result push notifications) - deferred post-MVP.'
    OpenQuestions = "- **P5**: DPDP Act consent capture - per-visit or one-time at registration?`n- **P7**: ABDM integration - MVP or post-launch?`n- **P9**: Telemedicine video provider - Jio Meet vs self-hosted Jitsi vs Zoom Healthcare?`n- **P11**: Insurance cashless claim API - which TPAs to integrate first?`n- **P15**: e-Sign provider for prescriptions - eMudhra (paid per signature) or NSDL (paid annual)?"
  },
  @{
    Slug = 'fitness-trainer'
    Title = 'Fitness + Wellness Trainer Platform'
    PitchOneLiner = 'Trainer dashboard for assigning workouts + meal plans + 1:1 chat + progress photos + wearable sync. Lets a trainer scale from 20 to 80 clients with the same hours. India-first, free-tier-first, mobile-and-web.'
    Domain = 'independent personal trainers, boutique gyms, yoga instructors, nutrition coaches'
    Hash = '4e6b8d2a'
    UsersBlurb = 'Solo trainers + yoga teachers + nutrition coaches scaling their client base; clients getting personalised plans + accountability via daily check-ins.'
    MobileStackNote = 'Expo for both client and trainer apps (camera for progress photos, wearable sync via HealthKit/Google Fit, push for workout reminders).'
    KeyDeltasBlock = "- **Trainer-side tool is the real product** (client app is the funnel).`n- **Workout + meal-plan template library** + assignment per client.`n- **Apple HealthKit + Google Fit OAuth** (auto-pull weight, steps, heart-rate).`n- **Progress photos** weekly with before/after slider.`n- **Open Food Facts free API** for macro tracking."
    KeyInvariants = 'client cannot book more than one trainer; workout assignment tied to client; progress photo opt-in (DPDP); wearable sync token refresh handled'
    DomainRuleName = 'fitness-domain'
    DomainSummary = "Solo trainers max out at 20-30 clients managing via WhatsApp + Excel. This project gives them a dashboard to handle 80+ clients with the same hours: template-driven workout/meal-plan assignment, daily check-ins via mobile, photo + measurement tracking, wearable sync, and 1:1 chat. Trainer pays Rs 999-2999/month; clients access via free Expo app. Razorpay Subscriptions for trainer billing."
    ServiceList = "- **auth-service** - Phone OTP + Passkey for trainer + Better-Auth Org (trainer-org + client-org).`n- **trainer-service** - trainer profile, certifications, specialisations.`n- **client-service** - client onboarding (questionnaire) + assignment to trainer.`n- **workout-template-service** - exercise library + workout templates (sets/reps/RPE).`n- **meal-plan-template-service** - meal templates with macros (joins Open Food Facts).`n- **assignment-service** - assign template -> personalise for client -> deliver per-day.`n- **check-in-service** - daily check-in (workout done, meal compliance, mood, sleep).`n- **progress-photo-service** - weekly photo upload to R2 + before/after viewer.`n- **chat-service** - 1:1 trainer-client via Stream Chat or Sendbird free tier.`n- **wearable-sync-service** - Apple HealthKit + Google Fit OAuth + polling.`n- **subscription-payment-service** - Razorpay Subscriptions for trainer billing.`n- **notification-service** - workout reminder, check-in nag, weekly photo prompt.`n- **insights-service** - client adherence %, trainer's top performers, churn risk."
    KeyDeltas = "- **Trainer-side dashboard** is the value capture (Cult.fit's mistake was building only the client app).`n- **Wearable OAuth + sync** (Apple HealthKit on iOS, Google Fit on Android).`n- **Macro tracking via free Open Food Facts** (no Nutritionix subscription fees).`n- **Photo upload + viewer** on R2 free tier (10GB covers ~3000 photos at 3MB each).`n- **Razorpay Subscriptions** for trainer-tier billing (silver/gold/platinum)."
    WebApps = '`apps/web-trainer` (Next.js - dashboard, template library, client assignment, insights); `apps/web-client` (Next.js - lightweight, mostly for desktop sign-up + payment).'
    MobileApps = '`apps/mobile-client` (Expo - daily check-in + photo upload + wearable sync + push reminders); `apps/mobile-trainer` (Expo - quick template assignment + chat from anywhere).'
    OpenQuestions = "- **P5**: Client-to-trainer assignment - 1:1 only or 1:N (group programs)?`n- **P7**: Workout template format - exercise list with reps OR full programs with periodisation?`n- **P9**: Chat provider - Stream Chat free tier (10k MAU) vs Sendbird free vs self-host?`n- **P11**: Wearable sync polling vs webhook (HealthKit doesn't support webhooks server-side)?`n- **P12**: Trainer payment tiers - per-client-headcount or flat?"
  },
  @{
    Slug = 'services-marketplace'
    Title = 'Local Services Marketplace'
    PitchOneLiner = 'Hyperlocal services marketplace (plumbers, electricians, beauty, tutors) with vetted-provider supply, fixed-price catalog, and in-job tracking. India-first, free-tier-first, mobile-and-web.'
    Domain = 'city-by-city local services; supply-side KYC and vetting are 90% of the operational work'
    Hash = 'b9c5a7e3'
    UsersBlurb = 'Customers booking home services; vetted providers (plumbers, electricians, beauty, tutors) taking jobs and getting paid same-day; city operators managing supply quality.'
    MobileStackNote = 'Expo for both customer and provider apps; provider app needs background-location for in-job tracking + camera for before/after photos.'
    KeyDeltasBlock = "- **Fixed-price catalog** (NOT bidding - kills race-to-bottom and trust).`n- **Supply-side KYC + vetting** is the moat (90% of UrbanCompany's value).`n- **In-job live-tracking** via WebSocket + Mapbox.`n- **Same-day payout to provider** via Razorpay Payouts.`n- **In-app chat + SOS** (customer + provider safety)."
    KeyInvariants = 'provider KYC-verified before listing; in-job location streamed to customer; payment escrow until job complete; SOS triggers within 5s'
    DomainRuleName = 'services-marketplace-domain'
    DomainSummary = "UrbanCompany dominates but takes 25-35% commission and pushes providers to subscription. Independent operators in tier-2 cities need a SaaS to launch their own equivalent. This project gives them: fixed-price catalog (no bidding), KYC + vetting workflow for providers, in-job tracking, escrow payment, same-day Razorpay Payouts, and SOS. Operating model is city-by-city; supply-side ops are 90% of the work and the project recommends starting with 50 vetted providers before marketing to customers."
    ServiceList = "- **auth-service** - Phone OTP for customer + Aadhaar/PAN verification for provider + Better-Auth Org (operator-org).`n- **customer-service** - customer profile + address book + saved-payment.`n- **provider-service** - provider onboarding + KYC + vehicle/tools + skill self-assessment.`n- **kyc-service** - integration with Razorpay X KYC / Cashfree Verification / Karza for ID + bank.`n- **service-catalog-service** - fixed-price service catalog (per-city; localised pricing).`n- **booking-service** - booking flow (date + time + address + service); slot generation per provider.`n- **dispatch-service** - provider matching (proximity + rating + availability).`n- **payment-route-service** - Razorpay + Razorpay Route for split (platform vs provider).`n- **rating-service** - post-job rating + review with photo + retake-job button.`n- **support-ticket-service** - in-app + WhatsApp support; escalation to operator.`n- **payout-service** - daily Razorpay Payouts to provider bank.`n- **notification-service** - WhatsApp + SMS + push for booking lifecycle.`n- **insights-service** - city KPIs (provider density, top categories, NPS by category)."
    KeyDeltas = "- **Fixed-price catalog** (no bidding) - simpler UX, trust win, removes seller-vs-seller race.`n- **Razorpay Route commission split** - platform's cut deducted at settlement.`n- **Same-day Razorpay Payouts** - kills provider grievance vs UrbanCompany's 7-14 day cycle.`n- **In-job WebSocket tracking** + before/after photos (proof of service).`n- **SOS button** wired to local emergency + operator (mandatory for women's safety in beauty/home-tutor categories)."
    WebApps = '`apps/web-customer` (Next.js - browse + book + reviews); `apps/web-admin` (Next.js - operator dashboard, KYC queue, dispute resolution, city KPIs).'
    MobileApps = '`apps/mobile-customer` (Expo - book + track + chat + SOS); `apps/mobile-provider` (Expo - accept jobs + navigate + check-in/out + earn).'
    OpenQuestions = "- **P5**: Provider KYC vendor - Razorpay X (good for bank verify) vs Cashfree Verification vs Karza?`n- **P7**: Pricing model - flat fixed per service or city-specific tiering?`n- **P9**: Matching algorithm tiebreaker - proximity, rating, or longest-idle-provider?`n- **P11**: Escrow release - on customer mark-complete or auto-release T+24h?`n- **P12**: SOS escalation - call operator first or 112 directly?"
  },
  @{
    Slug = 'cab-hailing'
    Title = 'Ride-Hailing Platform'
    PitchOneLiner = 'Real-time intra-city ride-hailing with driver dispatch, ETA, fare estimation, surge pricing, in-ride SOS, and live tracking. India-first, free-tier-first, mobile-and-web.'
    Domain = 'intra-city ride-share; city-by-city expansion; highest realtime intensity of the 12 projects'
    Hash = 'd1f3a8c7'
    UsersBlurb = 'Riders booking rides via mobile-only flow; drivers logging in via mobile-only flow; operators monitoring fleet + dispatch + complaints; (no real customer for web — web is admin-only).'
    MobileStackNote = 'Native iOS + Native Android (production) or bare React Native with config-plugins (MVP) — background-location with always-on permissions, Mapbox/Google Maps SDK with native rendering for performance.'
    KeyDeltasBlock = "- **Highest realtime intensity** of the 12 projects (WebSocket + background-location + dispatch matching).`n- **H3 hexagonal geo-index** for driver-rider matching (Uber-grade lookup).`n- **Surge pricing model** (demand multiplier per hex-cell).`n- **SOS button** via Twilio Verify + emergency contact + 112 link.`n- **Razorpay Payouts** for daily driver settlement."
    KeyInvariants = 'driver once-and-only-once assigned to ride; surge calculated atomically with booking; SOS triggers within 5s; payment escrow until ride end; driver-rider rating mutually anonymous'
    DomainRuleName = 'ride-hailing-domain'
    DomainSummary = "Ola and Uber dominate metros but tier-2/3 cities and B2B fleet operators (corporate cabs, school transport) need their own ride-hailing layer. This project gives operators a SaaS with: real-time matching via WebSocket + H3, ETA via Mapbox Directions, surge pricing per hex-cell, in-ride SOS, in-app pay via Razorpay + tokenisation, daily driver payout. Operating model is city-by-city. The dispatch algorithm (haversine + ETA + surge multiplier + current-driver-load) is the technical core; supply-side ops are the operational core."
    ServiceList = "- **auth-service** - Phone OTP for rider + KYC for driver + Better-Auth Org (operator-org).`n- **rider-service** - rider profile + payment methods (Razorpay tokenised).`n- **driver-service** - driver onboarding + KYC + vehicle + earnings.`n- **vehicle-service** - vehicle registry + RC verification + insurance + permit.`n- **kyc-service** - driver ID + DL + RC + PCC verification (Karza / Signzy).`n- **ride-request-service** - rider's pickup-dropoff request; queue while matching.`n- **dispatch-service** - WebSocket-driven matching (closest available driver by H3 + ETA + load).`n- **matching-service** - algorithm (haversine + ETA + surge + acceptance-rate weights).`n- **location-tracker-service** - WebSocket location stream from driver app (every 5s while online; every 2s during ride).`n- **fare-service** - fare calculation (base + distance + time + surge + waiting).`n- **payment-service** - Razorpay + UPI + saved-card tokenised; ride-end auto-charge.`n- **surge-pricing-service** - per hex-cell demand:supply ratio -> surge multiplier (rule-based MVP, ML at scale).`n- **rating-service** - mutual rider-driver rating post-ride.`n- **support-service** - in-app + phone support; complaint escalation.`n- **payout-service** - daily Razorpay Payouts to driver.`n- **notification-service** - WhatsApp + SMS + push for ride lifecycle.`n- **insights-service** - operator dashboard (active drivers, fulfilment rate, ratings, top areas)."
    KeyDeltas = "- **H3 hexagonal indexing** for sub-millisecond driver-rider proximity lookup.`n- **WebSocket location streaming** at 2-5s intervals during rides.`n- **Surge pricing per hex-cell** (not per-zone) for granular demand response.`n- **Razorpay Tokenisation** for saved-card in-app pay (mandatory per RBI 2022 tokenisation rules).`n- **SOS button** wired to Twilio Verify + emergency contacts + 112 (Indian emergency line)."
    WebApps = '`apps/web-admin` (Next.js - operator dashboard, fleet monitor, dispatch console, complaint resolution, KPI charts); no rider/driver web app (mobile-only flows).'
    MobileApps = '`apps/mobile-rider` (Native iOS + Native Android or RN bare - book + live track + pay + SOS + rate); `apps/mobile-driver` (Native iOS + Native Android or RN bare - online toggle + accept/reject + navigate + daily earnings).'
    OpenQuestions = "- **P5**: Driver KYC vendor - Karza (most coverage) vs Signzy vs in-house?`n- **P9**: Dispatch matching window - 10s wait for driver accept then fan-out, or instant fan-out to N drivers?`n- **P10**: Background-location sample rate (always-on vs trip-bound) - battery vs accuracy?`n- **P12**: Razorpay tokenisation for foreign cards (Mastercard/Visa from India) - per RBI 2022 - compliance gap?`n- **P15**: Surge cap (consumer-protection) - 1.5x cap or unlimited with disclosure?"
  },
  @{
    Slug = 'crm-vertical'
    Title = 'Vertical CRM Platform'
    PitchOneLiner = 'Industry-specific CRM with vertical-tailored fields, WhatsApp 2-way inbox as the primary channel, and PDF quote generation. One vertical per deployment (interior designers / immigration / car dealerships / IVF clinics). India-first, free-tier-first, mobile-and-web.'
    Domain = 'vertical SaaS for niche B2B sales teams; one industry per deployment'
    Hash = '3b7e1d9a'
    UsersBlurb = 'Sales reps in vertical niches (interior design, immigration consultancy, car dealerships, IVF clinics, jewelry showrooms); their managers tracking pipeline + activities; clients receiving PDF quotes + signing via DocuSign-equivalent.'
    MobileStackNote = 'Expo for sales-rep + manager apps (lead capture from anywhere; quick activity log; WhatsApp inbox).'
    KeyDeltasBlock = "- **Vertical-tailored schema** (interior designer: floor-area, BHK, budget, style; immigration: country, visa-type, IELTS score).`n- **WhatsApp 2-way inbox** as the primary channel (NOT email, which Indian customers ignore).`n- **PDF quote generator** with vertical-tailored template.`n- **e-Sign integration** (Aadhaar e-Sign / DocuSign equivalent).`n- **Per-vertical pipeline stages** (interior: brief -> mood-board -> proposal -> signed -> in-prod -> handover)."
    KeyInvariants = 'lead capture preserves source attribution; WhatsApp template approval respected; quote PDF watermarked; pipeline stage transitions audit-logged; manager-only fields enforced'
    DomainRuleName = 'crm-domain'
    DomainSummary = "Generic CRMs (Salesforce, HubSpot, Pipedrive, Zoho) force vertical sales teams to map their domain to a generic schema. This project flips it: each deployment is configured for ONE vertical with that vertical's schema, stages, quote template, and KPIs baked in. WhatsApp 2-way inbox is the differentiator vs email-centric tools (Indian SMB customers ignore email but read WhatsApp). PDF quote generator + e-Sign closes the deal in-app. Razorpay Subscriptions for SaaS billing."
    ServiceList = "- **auth-service** - Phone OTP for reps + Passkey for managers + Better-Auth Org (business-org + customer-org).`n- **organisation-service** - business profile + vertical-config selection (interior/immigration/auto/IVF/etc).`n- **contact-service** - contact registry with vertical-specific custom fields.`n- **lead-service** - lead capture (web form + WhatsApp inbound + manual entry) + source attribution.`n- **deal-service** - deal pipeline with vertical-specific stages.`n- **pipeline-service** - kanban + stage-transition workflow.`n- **activity-service** - activity log (call, email, WhatsApp, meeting, note) + followup-due reminders.`n- **quote-service** - PDF quote generator with vertical-tailored template.`n- **document-service** - file upload to R2 (contracts, mood-boards, brochures).`n- **whatsapp-inbox-service** - WhatsApp Cloud webhook -> threaded conversation per contact.`n- **automation-service** - rules engine (when X happens, do Y) + cadences (3-touch email + WhatsApp sequence).`n- **subscription-payment-service** - Razorpay Subscriptions for per-seat SaaS billing.`n- **integration-service** - Zapier-style triggers / actions for external systems.`n- **reporting-service** - vertical-specific KPIs (interior: project-margin; immigration: visa-conversion).`n- **insights-service** - rep leaderboard, source ROI, pipeline velocity, lost-reason."
    KeyDeltas = "- **Per-vertical schema** baked into deployment (mass customisation at deploy time, not runtime).`n- **WhatsApp 2-way inbox** as the primary channel (kills email dependency for Indian SMB).`n- **PDF quote generator** with vertical-tailored layout + e-Sign integration.`n- **Per-vertical pipeline stages** (not generic 'lead -> opportunity -> closed').`n- **Razorpay Subscriptions** for SaaS billing (per-seat or per-deal-count tiers)."
    WebApps = '`apps/web-app` (Next.js - main rep + manager surface; deal pipeline kanban, contact list, activity log, quote builder, WhatsApp inbox); `apps/web-admin` (Next.js - vertical config, subscription manager, user invites).'
    MobileApps = '`apps/mobile-app` (Expo - rep + manager on the go; quick activity log + WhatsApp inbox + lead push); offline-first via TanStack Query persister.'
    OpenQuestions = "- **P5**: Per-vertical config - deploy-time switch or runtime tenant config?`n- **P7**: Vertical schema versioning - allow customer to add fields or only platform-managed?`n- **P9**: WhatsApp template approval per business or platform-managed?`n- **P11**: e-Sign vendor - Aadhaar e-Sign (legal weight + per-signature cost) vs DocuSign vs Zoho Sign?`n- **P15**: Pricing tiers - per-seat, per-deal-count, or feature-tier (Silver/Gold/Platinum)?"
  }
)

# ---------- Template: README.md ----------
$readmeTemplate = @'
# {{SLUG}}

{{PITCH_ONELINER}}

> **Status**: Phase 0 - scaffolding + parent plan stub authored. Phases 1+ pending implementation. See [`.cursor/plans/`](.cursor/plans/) for the roadmap.

## What this is

A reference-implementation freelance project: {{TITLE}}. Architectural template = [LotusGift v2](https://github.com/goldr0g3r/lotusgift) (corporate gifting reference build) and [restaurant-ordering](https://github.com/goldr0g3r/restaurant-ordering) (greenfield reference build): modular-monolith NestJS + Next.js + Expo, Zod-first APIs, Better-Auth, transport-agnostic Outbox event bus, tier-gated test coverage, WCAG 2.2 AA, free-tier-first hosting.

## Who it's for

{{USERS_BLURB}}

## Domain

{{DOMAIN}}

## Tech stack baseline (verified 2026-05-13 in restaurant-ordering/docs/research/phase-0-rules.md)

- **Backend**: NestJS 11 (modular monolith) + nestjs-zod 5.3 + Mongoose 9.6 + Better-Auth >=1.5 + Kubb 3.
- **Web**: Next.js 16.2 + React + CSS Modules + Sass + Radix Primitives + TanStack Query v5.
- **Mobile**: {{MOBILE_STACK_NOTE}}
- **Data**: MongoDB Atlas M0 (Mumbai, 3 Atlas Search indexes) + Upstash Redis Free (256MB / 500K cmds/mo) + Cloudflare R2 (10 GB-mo + free egress).
- **Payments**: Razorpay (UPI / cards / Route) - for monetary flows.
- **Notifications**: Resend + MSG91 + WhatsApp Cloud (Meta).
- **Observability**: Sentry + Grafana Cloud + PostHog Cloud EU.
- **Hosting**: Oracle Always Free A1.Flex (Mumbai) + Vercel Hobby + Expo EAS.

### Project-specific deltas

{{KEY_DELTAS_BLOCK}}

Full per-phase detail in the parent plan.

## Quick start (after Phase 0 scaffolding lands)

```bash
pnpm install
docker compose -f infrastructure/docker/docker-compose.yml up -d
pnpm dev
pnpm test
pnpm e2e
```

## Plan + research

- Parent plan: [`.cursor/plans/{{SLUG_UNDERSCORE}}_architecture_{{HASH}}.plan.md`](.cursor/plans/)
- Research notes: [`docs/research/`](docs/research/) (Phase 0 stub - inherits from restaurant-ordering's deep research)
- Sibling templates: [LotusGift v2](https://github.com/goldr0g3r/lotusgift) + [restaurant-ordering](https://github.com/goldr0g3r/restaurant-ordering) (full deep research)

## Contributing

Workflow follows the LotusGift v2 sub-plan + status-sync convention:
1. Draft sub-plan in `.cursor/plans/<todo-id>_*.plan.md`.
2. Deep research -> `docs/research/phase-<N>-*.md` with retrieval-dated citations.
3. Implementation PR following the parent plan's phase order.
4. Phase-acceptance PR closes the phase.

## License

MIT (pending - to be added in Phase 0 PR-3).
'@

# ---------- Template: .cursor/plans/<slug>_architecture_<hash>.plan.md ----------
$planStubTemplate = @'
---
name: {{TITLE}} - Architecture & Phase Plan (STUB)
overview: {{PITCH_ONELINER}} Stub plan authored 2026-05-13 alongside scaffolding. Architectural template = LotusGift v2 + restaurant-ordering (modular monolith NestJS + Next.js + Expo + Atlas M0 + Oracle Free + Vercel Hobby + Razorpay + WhatsApp). Project-specific deep research DEFERRED to next session.
todos:
  - id: p0-scaffold
    content: "PR-1 chore(scaffold): pnpm dlx create-turbo@latest with-nestjs + Next.js apps + Expo apps + Nest libraries via CLI. CLI captures latest stable versions. NO hand-rolled package.json / tsconfig - CLI only. Acceptance: pnpm build + pnpm lint pass; api-gateway + web smoke 200."
    status: pending
  - id: p0-rules
    content: "PR-2 chore(rules): 14 base rules + project-specific {{DOMAIN_RULE_NAME}}.mdc + Copilot mirrors + 3 base subagents + project-specific domain-auditor subagent. COMPLETED at scaffold time - this PR is the codified commit."
    status: completed
  - id: p0-docs
    content: "PR-3 docs(architecture): README rewrite + docs/architecture/dep-graph.svg + ADR-001..ADR-N (India launch + Razorpay + key vertical-specific decisions)."
    status: pending
  - id: p0-ci
    content: "PR-4 ci: .github/workflows (ci.yml + pr-title.yml + secret-scan.yml + dependency-review.yml + dep-cruiser.yml + openapi-drift.yml skeleton + atlas-search-mapping-drift.yml skeleton + {{DOMAIN_RULE_NAME}}.yml + free-tier-burn.yml weekly cron + release.yml) + issue templates + PR template + CODEOWNERS + branch-protection JSON."
    status: pending
  - id: p0-dev-stack
    content: "PR-5 feat(infra): infrastructure/docker/docker-compose.yml for local dev (Mongo + Redis + Mailpit + OTEL collector + domain-specific dev tools)."
    status: pending
  - id: p0-design
    content: "PR-6 docs(design)+feat(design-tokens)+feat(ui)+feat(ui-native): docs/design/DESIGN.md + @repo/design-tokens (Style Dictionary v5) + @repo/ui (Radix + CSS Modules) + @repo/ui-native (React Native primitives) + axe-core a11y CI job."
    status: pending
  - id: p0-oracle-runbook
    content: "PR-7 docs(runbook)+infra(oracle): docs/runbooks/oracle-deploy.md + infrastructure/oracle/ + heartbeat-ping cron every 6h + GHCR pull credentials + deploy-oracle.yml workflow."
    status: pending
  - id: p0-future-docs
    content: "PR-8 docs(runbook): going-to-production.md + scaling-up.md + free-tier-burn.md + incident-response.md + backup-restore.md + oracle-quarterly-review.md + domain-specific runbooks."
    status: pending
  - id: p1
    content: "Phase 1: @repo/typescript-config + @repo/eslint-config + @repo/jest-config + @repo/prettier-config + @repo/vitest-config + @repo/expo-config."
    status: pending
  - id: p2
    content: "Phase 2: @repo/types + @repo/validators (Zod) + @repo/events (transport-agnostic + __schemaVersion) + @repo/openapi-spec (RFC 9457 error envelope)."
    status: pending
  - id: p3
    content: "Phase 3: @repo/database (Mongoose 9 + collection-namespace helper) + @repo/config (env Zod schema) + @repo/utils (OutboxPort + redactor + ulid trace-id + pino logger + retry) + @repo/observability (OTEL bootstrap + RUM SDK)."
    status: pending
  - id: p3b
    content: "Phase 3b: @repo/analytics-sdk (PostHog browser+server+native) + @repo/feature-flags + event taxonomy doc."
    status: pending
  - id: p4
    content: "Phase 4: apps/api-gateway modular-monolith shell - trace-id middleware + Upstash rate-limit + helmet + CSP + Better-Auth mount + RFC 9457 + Swagger + Kubb codegen wired in CI."
    status: pending
  - id: p5-p15-services
    content: "Phases 5-15: One service module per phase (auth-service, then domain-specific services - see §3 below). Every phase: research-note -> epic -> PRs -> tests -> phase-acceptance."
    status: pending
  - id: p16-p19-apps
    content: "Phases 16-19: Web + mobile apps (Design Discovery FIRST per page family). See §5 below."
    status: pending
  - id: p20
    content: "Phase 20: Supporting services (review-service, support-service, integration-service, insights-service)."
    status: pending
  - id: p21
    content: "Phase 21: Observability hardening - Grafana dashboards + alert rules + Loki queries + Tempo trace correlation + RUM via PostHog + runbooks."
    status: pending
  - id: p22
    content: "Phase 22: Launch - execute docs/runbooks/going-to-production.md checklist + Vercel Hobby -> Pro + Razorpay live + smoke load test + OWASP ASVS L2 self-audit + SBOM + DR drill + first pilot customer onboarding."
    status: pending
isProject: false
---

# {{TITLE}} - Architecture & Phase Plan (STUB)

> **STATUS**: Stub plan. Project-specific deep research DEFERRED to next session. Foundational stack + governance ARE locked (see [restaurant-ordering's phase-0-rules.md](https://github.com/goldr0g3r/restaurant-ordering/blob/main/docs/research/phase-0-rules.md) - verified 2026-05-13, within 14-day freshness window).

## 1. Recommendation (TL;DR)

A greenfield production-grade {{TITLE_LOWER}} on the **same modular-monolith template as LotusGift v2** and **restaurant-ordering**, adapted for the {{DOMAIN_SHORT}} domain. Domain-specific invariants: {{KEY_INVARIANTS}}.

**Why this template wins for this domain**: same L0-L6 layer model + transport-agnostic outbox + Zod-first APIs + tier-gated tests + free-tier-first hosting (Oracle Always Free + Vercel Hobby + Atlas M0 + Upstash Redis Free + Cloudflare R2 + Razorpay + WhatsApp Cloud). Domain-specific deltas listed in §4.

**Stack verified 2026-05-13** (inherited from restaurant-ordering's phase-0-rules.md): Next.js 16.2.6 + NestJS 11 + nestjs-zod 5.3 + Mongoose 9.6.1 + Better-Auth >=1.5 + Kubb 3 + Atlas M0 (Mumbai, 3 search indexes) + Oracle Always Free A1.Flex (Mumbai) + Vercel Hobby (1M invocations + 4 active-CPU-hrs included) + Cloudflare R2 (10 GB-mo + free egress) + Upstash Redis Free (256MB + 500K cmds/mo) + Razorpay + WhatsApp Cloud + Expo (latest SDK).

## 2. Domain summary

{{DOMAIN_SUMMARY}}

## 3. Services (proposed)

{{SERVICE_LIST}}

(Final service list + per-service spec written in each service's per-phase research note + sub-plan.)

## 4. Architecture key deltas from the baseline template

{{KEY_DELTAS}}

## 5. App stack

- **Backend**: `apps/api-gateway` (single NestJS modular-monolith process on Oracle Always Free A1.Flex Mumbai).
- **Web**: {{WEB_APPS}}
- **Mobile**: {{MOBILE_APPS}}

## 6. Phased plan (22 phases - same template as LotusGift v2)

Phase 0 lays foundation (scaffold + rules + CI + design + Oracle deploy runbook + future docs). Phases 1-3b are leaf packages (`@repo/typescript-config`, `@repo/types`, `@repo/database`, `@repo/utils`, etc.). Phase 4 is `apps/api-gateway` shell. Phases 5-15 are services (one per phase). Phases 16-19 are the web + mobile apps (Design Discovery FIRST per page family). Phases 20-22 close out. Every phase: research-note -> epic -> PRs -> tests -> phase-acceptance.

Full per-phase todo list in the frontmatter above.

## 7. Open questions (top 5 - deeper research session will expand)

{{OPEN_QUESTIONS}}

## 8. Hosting + free-tier strategy

Identical to restaurant-ordering's plan §9 (Oracle Always Free + Vercel Hobby + Atlas M0 + Upstash Redis Free + Cloudflare R2 + Razorpay + WhatsApp Cloud + Sentry + Grafana Cloud + PostHog Cloud EU). Atlas Search 3-index budget allocated per project's domain in PR-3.

## 9. Status + next steps

**Status**: STUB authored 2026-05-13.

**Next steps before any code lands**:
1. Deep-research session: `WebFetch` retrieval-dated citations for every project-specific dependency listed in `docs/research/phase-0-rules.md` §3 (DEFERRED block).
2. Refine §3-§5 with research-informed service list + architecture diagram (mermaid).
3. Open Phase-0 GitHub issues (23 milestones + label set + Research-Note + Epic + Phase-Acceptance) once architecture lock is approved.
4. Execute PR-1 (`pnpm dlx create-turbo@latest`).

---

**Last validated**: 2026-05-13. Next dependency re-verification deadline: 2026-05-27 (per `always-latest-docs.mdc` 14-day rule on inherited foundational citations).
'@

# Helper: write file UTF-8 BOM-less
function Write-File($Path, $Content) {
  $dir = Split-Path -Parent $Path
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }
  [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

$wrote = 0
foreach ($p in $projects) {
  $slug = $p.Slug
  $slugUnderscore = $slug -replace '-', '_'
  $titleLower = $p.Title.ToLower() -replace ' platform', '' -replace ' lms', ' learning platform'
  $domainShort = $p.Domain -replace '\(.*\)', '' -replace '^\s+|\s+$', ''
  $dst = "C:\Code\$slug"
  if (-not (Test-Path $dst)) {
    Write-Warning "Skipping $slug - directory not found"
    continue
  }

  # Substitute placeholders in README
  $readme = $readmeTemplate `
    -replace '{{SLUG}}', $slug `
    -replace '{{TITLE}}', $p.Title `
    -replace '{{PITCH_ONELINER}}', $p.PitchOneLiner `
    -replace '{{USERS_BLURB}}', $p.UsersBlurb `
    -replace '{{DOMAIN}}', $p.Domain `
    -replace '{{MOBILE_STACK_NOTE}}', $p.MobileStackNote `
    -replace '{{KEY_DELTAS_BLOCK}}', $p.KeyDeltasBlock `
    -replace '{{SLUG_UNDERSCORE}}', $slugUnderscore `
    -replace '{{HASH}}', $p.Hash

  # Substitute placeholders in plan stub
  $plan = $planStubTemplate `
    -replace '{{SLUG}}', $slug `
    -replace '{{TITLE}}', $p.Title `
    -replace '{{TITLE_LOWER}}', $titleLower `
    -replace '{{PITCH_ONELINER}}', $p.PitchOneLiner `
    -replace '{{DOMAIN}}', $p.Domain `
    -replace '{{DOMAIN_SHORT}}', $domainShort `
    -replace '{{DOMAIN_SUMMARY}}', $p.DomainSummary `
    -replace '{{KEY_INVARIANTS}}', $p.KeyInvariants `
    -replace '{{DOMAIN_RULE_NAME}}', $p.DomainRuleName `
    -replace '{{SERVICE_LIST}}', $p.ServiceList `
    -replace '{{KEY_DELTAS}}', $p.KeyDeltas `
    -replace '{{WEB_APPS}}', $p.WebApps `
    -replace '{{MOBILE_APPS}}', $p.MobileApps `
    -replace '{{OPEN_QUESTIONS}}', $p.OpenQuestions `
    -replace '{{SLUG_UNDERSCORE}}', $slugUnderscore `
    -replace '{{HASH}}', $p.Hash

  Write-File "$dst\README.md" $readme
  Write-File "$dst\.cursor\plans\${slugUnderscore}_architecture_$($p.Hash).plan.md" $plan
  $wrote += 2
  Write-Host "Wrote README + plan stub for: $slug" -ForegroundColor Green
}

Write-Host "`nDone. Wrote $wrote files across $($projects.Count) projects." -ForegroundColor Cyan
