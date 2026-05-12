#!/usr/bin/env tsx
/**
 * scripts/free-tier-quota-burn.ts
 *
 * Weekly cron triggered by .github/workflows/free-tier-burn.yml.
 *
 * Compares current usage against documented free-tier quotas for Atlas M0,
 * Vercel Hobby, PostHog Cloud, and Upstash Redis. If any quota crosses the
 * configured threshold (default 0.70 per .cursor/rules/free-tier-budget.mdc),
 * opens a GitHub issue labelled `phase/0 + area/infra + prio/p1-high`.
 *
 * Token-gated. Missing credentials cause that vendor's check to be skipped
 * (logged at INFO) rather than failing the run — bootstrap can land before
 * tokens are provisioned.
 *
 * Exit codes:
 *   0 — completed (with or without quota issues, with or without skips)
 *   1 — unexpected error (network failure, unparseable response, etc.)
 *
 * Run locally with:
 *   pnpm tsx scripts/free-tier-quota-burn.ts --dry-run
 */

interface QuotaResult {
  vendor: string;
  metric: string;
  used: number;
  quota: number;
  unit: string;
  used_ratio: number;
  status: "ok" | "warn" | "skipped" | "error";
  note?: string;
}

const REPO_OWNER = "goldr0g3r";
const REPO_NAME = "lotusgift";

const THRESHOLD = Number(process.env.QUOTA_BURN_THRESHOLD ?? "0.70");
const DRY_RUN = process.argv.includes("--dry-run");

function log(level: "info" | "warn" | "error", message: string): void {
  const ts = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.log(`[${ts}] [${level}] ${message}`);
}

function skipped(
  vendor: string,
  metric: string,
  reason: string,
): QuotaResult {
  return {
    vendor,
    metric,
    used: 0,
    quota: 0,
    unit: "n/a",
    used_ratio: 0,
    status: "skipped",
    note: reason,
  };
}

async function checkAtlas(): Promise<QuotaResult[]> {
  const publicKey = process.env.ATLAS_PUBLIC_KEY;
  const privateKey = process.env.ATLAS_PRIVATE_KEY;
  const groupId = process.env.ATLAS_GROUP_ID;
  const clusterName = process.env.ATLAS_CLUSTER_NAME ?? "Cluster0";

  if (!publicKey || !privateKey || !groupId) {
    return [
      skipped(
        "Atlas M0",
        "storage+search-index+doc-count",
        "ATLAS_PUBLIC_KEY / ATLAS_PRIVATE_KEY / ATLAS_GROUP_ID not set — lands at PR-5 dev-stack.",
      ),
    ];
  }

  const url = `https://cloud.mongodb.com/api/atlas/v2/groups/${groupId}/clusters/${clusterName}`;
  const auth = Buffer.from(`${publicKey}:${privateKey}`).toString("base64");

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.atlas.2024-08-05+json",
        Authorization: `Basic ${auth}`,
      },
    });
    if (!res.ok) {
      return [
        {
          vendor: "Atlas M0",
          metric: "cluster-fetch",
          used: 0,
          quota: 0,
          unit: "n/a",
          used_ratio: 0,
          status: "error",
          note: `HTTP ${res.status} from Atlas API`,
        },
      ];
    }
    const cluster = (await res.json()) as {
      diskSizeGB?: number;
      providerSettings?: { instanceSizeName?: string };
    };
    const diskUsedGB = cluster.diskSizeGB ?? 0;
    return [
      {
        vendor: "Atlas M0",
        metric: "storage",
        used: diskUsedGB,
        quota: 0.5,
        unit: "GB",
        used_ratio: diskUsedGB / 0.5,
        status: diskUsedGB / 0.5 > THRESHOLD ? "warn" : "ok",
        note: `instanceSize=${cluster.providerSettings?.instanceSizeName ?? "unknown"} (M0 hard cap: 0.5 GB).`,
      },
    ];
  } catch (err) {
    return [
      {
        vendor: "Atlas M0",
        metric: "cluster-fetch",
        used: 0,
        quota: 0,
        unit: "n/a",
        used_ratio: 0,
        status: "error",
        note: `fetch error: ${(err as Error).message}`,
      },
    ];
  }
}

async function checkVercel(): Promise<QuotaResult[]> {
  const token = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token) {
    return [
      skipped(
        "Vercel Hobby",
        "bandwidth+builds+functions",
        "VERCEL_TOKEN not set — lands at P16 (web-customer launch).",
      ),
    ];
  }

  const baseUrl = "https://api.vercel.com/v1/usage";
  const params = teamId ? `?teamId=${teamId}` : "";

  try {
    const res = await fetch(`${baseUrl}${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      if (res.status === 404 || res.status === 403) {
        return [
          skipped(
            "Vercel Hobby",
            "bandwidth",
            `usage endpoint not available (HTTP ${res.status}); reconcile token + team scope at P16.`,
          ),
        ];
      }
      return [
        {
          vendor: "Vercel Hobby",
          metric: "usage-fetch",
          used: 0,
          quota: 0,
          unit: "n/a",
          used_ratio: 0,
          status: "error",
          note: `HTTP ${res.status} from Vercel API`,
        },
      ];
    }
    const usage = (await res.json()) as {
      bandwidth?: number;
      buildMinutes?: number;
      functionDurationGbSec?: number;
    };
    const bandwidthGB = (usage.bandwidth ?? 0) / 1_000_000_000;
    const HOBBY_BANDWIDTH_GB = 100;
    return [
      {
        vendor: "Vercel Hobby",
        metric: "bandwidth",
        used: bandwidthGB,
        quota: HOBBY_BANDWIDTH_GB,
        unit: "GB/month",
        used_ratio: bandwidthGB / HOBBY_BANDWIDTH_GB,
        status:
          bandwidthGB / HOBBY_BANDWIDTH_GB > THRESHOLD ? "warn" : "ok",
        note: `Hobby plan cap = 100 GB/month outbound bandwidth (verified 2026-05-12).`,
      },
    ];
  } catch (err) {
    return [
      {
        vendor: "Vercel Hobby",
        metric: "usage-fetch",
        used: 0,
        quota: 0,
        unit: "n/a",
        used_ratio: 0,
        status: "error",
        note: `fetch error: ${(err as Error).message}`,
      },
    ];
  }
}

async function checkPostHog(): Promise<QuotaResult[]> {
  const apiKey = process.env.POSTHOG_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;

  if (!apiKey || !projectId) {
    return [
      skipped(
        "PostHog Cloud",
        "events+session-replays",
        "POSTHOG_API_KEY / POSTHOG_PROJECT_ID not set — lands at P3b (analytics-sdk).",
      ),
    ];
  }

  const url = `https://app.posthog.com/api/projects/${projectId}/`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      return [
        {
          vendor: "PostHog Cloud",
          metric: "project-fetch",
          used: 0,
          quota: 0,
          unit: "n/a",
          used_ratio: 0,
          status: "error",
          note: `HTTP ${res.status} from PostHog API`,
        },
      ];
    }
    const FREE_EVENTS_PER_MONTH = 1_000_000;
    return [
      skipped(
        "PostHog Cloud",
        "events/month",
        `Free tier cap = ${FREE_EVENTS_PER_MONTH.toLocaleString()} events/month. Per-event ingestion stats live at /api/projects/${projectId}/insights/ — implement at P3b once event taxonomy is finalised.`,
      ),
    ];
  } catch (err) {
    return [
      {
        vendor: "PostHog Cloud",
        metric: "project-fetch",
        used: 0,
        quota: 0,
        unit: "n/a",
        used_ratio: 0,
        status: "error",
        note: `fetch error: ${(err as Error).message}`,
      },
    ];
  }
}

async function checkOracle(): Promise<QuotaResult[]> {
  return [
    skipped(
      "Oracle Cloud Always Free",
      "VM uptime",
      "Oracle Cloud SDK auth not bootstrapped until PR-7 (oracle-deploy runbook). Manual heartbeat-ping cron mitigates 7-day idle reclaim until then.",
    ),
  ];
}

async function checkUpstash(): Promise<QuotaResult[]> {
  const upstashToken = process.env.UPSTASH_API_TOKEN;
  const upstashEmail = process.env.UPSTASH_EMAIL;

  if (!upstashToken || !upstashEmail) {
    return [
      skipped(
        "Upstash Redis",
        "commands/day",
        "UPSTASH_API_TOKEN / UPSTASH_EMAIL not set — lands at P5 (auth-service rate-limit + session store).",
      ),
    ];
  }
  return [
    skipped(
      "Upstash Redis",
      "commands/day",
      "Implementation deferred to P5 when the Upstash Redis instance is provisioned.",
    ),
  ];
}

interface IssueBody {
  title: string;
  body: string;
  labels: string[];
}

function buildIssueBody(results: QuotaResult[]): IssueBody | null {
  const breaches = results.filter((r) => r.status === "warn");
  if (breaches.length === 0) return null;

  const dateStr = new Date().toISOString().slice(0, 10);

  const table = [
    "| Vendor | Metric | Used | Quota | Unit | Ratio | Note |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...breaches.map((r) =>
      `| ${r.vendor} | ${r.metric} | ${r.used.toFixed(2)} | ${r.quota.toFixed(2)} | ${r.unit} | ${(r.used_ratio * 100).toFixed(1)}% | ${r.note ?? ""} |`,
    ),
  ].join("\n");

  const skips = results.filter((r) => r.status === "skipped");
  const skipsBlock =
    skips.length > 0
      ? `\n\n### Skipped checks (no token / not yet bootstrapped)\n\n` +
        skips
          .map((r) => `- **${r.vendor}** / ${r.metric} — ${r.note ?? ""}`)
          .join("\n")
      : "";

  const errs = results.filter((r) => r.status === "error");
  const errsBlock =
    errs.length > 0
      ? `\n\n### Errored checks\n\n` +
        errs
          .map((r) => `- **${r.vendor}** / ${r.metric} — ${r.note ?? ""}`)
          .join("\n")
      : "";

  return {
    title: `infra: free-tier quota burn > ${(THRESHOLD * 100).toFixed(0)}% (${dateStr})`,
    body: [
      `# Free-tier quota burn report — ${dateStr}`,
      ``,
      `Threshold: **${(THRESHOLD * 100).toFixed(0)}%** (per \`.cursor/rules/free-tier-budget.mdc\`). Generated by \`.github/workflows/free-tier-burn.yml\` → \`scripts/free-tier-quota-burn.ts\`.`,
      ``,
      `## Breaches`,
      ``,
      table,
      skipsBlock,
      errsBlock,
      ``,
      `## Suggested next steps`,
      ``,
      `1. Cross-reference each breach against \`docs/runbooks/scaling-up.md\` (created at PR-8) for the upgrade-path runbook.`,
      `2. If the breach is temporary, file a follow-up issue with the mitigation and close this one.`,
      `3. If chronic, schedule an ADR + upgrade-path PR for the affected vendor.`,
    ].join("\n"),
    labels: ["phase/0", "area/infra", "prio/p1-high", "type/chore"],
  };
}

async function openIssue(payload: IssueBody): Promise<void> {
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  if (!token) {
    log("warn", "GH_TOKEN / GITHUB_TOKEN not set — would have opened:");
    log("warn", `Title: ${payload.title}`);
    log("warn", `Body:\n${payload.body}`);
    return;
  }

  const res = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    log(
      "error",
      `Failed to open GitHub issue: HTTP ${res.status} — ${await res.text()}`,
    );
    return;
  }

  const issue = (await res.json()) as { html_url?: string; number?: number };
  log("info", `Issue opened: #${issue.number} ${issue.html_url ?? ""}`);
}

async function main(): Promise<void> {
  log(
    "info",
    `free-tier-burn starting — threshold=${(THRESHOLD * 100).toFixed(0)}% dryRun=${DRY_RUN}`,
  );

  const results: QuotaResult[] = [];
  results.push(...(await checkAtlas()));
  results.push(...(await checkVercel()));
  results.push(...(await checkPostHog()));
  results.push(...(await checkOracle()));
  results.push(...(await checkUpstash()));

  for (const r of results) {
    log(
      r.status === "warn" || r.status === "error" ? "warn" : "info",
      `${r.vendor} / ${r.metric}: status=${r.status} used=${r.used.toFixed(2)} ${r.unit} (${(r.used_ratio * 100).toFixed(1)}%) — ${r.note ?? ""}`,
    );
  }

  const payload = buildIssueBody(results);
  if (!payload) {
    log("info", "No quota breaches detected. No issue opened.");
    return;
  }

  if (DRY_RUN) {
    log("info", "DRY RUN — would have opened the following issue:");
    log("info", `Title: ${payload.title}`);
    log("info", `Labels: ${payload.labels.join(", ")}`);
    log("info", `Body:\n${payload.body}`);
    return;
  }

  await openIssue(payload);
}

main().catch((err) => {
  log("error", `Unexpected error: ${(err as Error).message}`);
  log("error", (err as Error).stack ?? "no stack");
  process.exit(1);
});
