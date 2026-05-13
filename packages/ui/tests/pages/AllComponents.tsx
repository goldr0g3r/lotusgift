"use client";

import { Button } from "../../src/Button";
import { Card } from "../../src/Card";
import { IconButton } from "../../src/IconButton";
import { Pill } from "../../src/Pill";
import { SectionShell } from "../../src/SectionShell";
import { Toaster } from "../../src/Toaster";

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
    <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CartIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
    <path
      d="M3 4h2l2.5 12h12l2-9H6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="10" cy="20" r="1.5" fill="currentColor" />
    <circle cx="18" cy="20" r="1.5" fill="currentColor" />
  </svg>
);

/**
 * Renders one of each LotusGift @repo/ui component for the Playwright + axe
 * smoke spec. Each variant/tone is represented so axe runs across all branded
 * surfaces.
 */
export function AllComponents() {
  return (
    <SectionShell as="main" width="default">
      <h1 id="page-title">LotusGift component library smoke page</h1>

      <SectionShell as="section" width="default" aria-labelledby="buttons-heading">
        <h2 id="buttons-heading">Buttons</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", padding: "1rem 0" }}>
          <Button variant="primary" size="sm">
            Primary sm
          </Button>
          <Button variant="primary" size="md">
            Primary md
          </Button>
          <Button variant="primary" size="lg">
            Primary lg
          </Button>
          <Button variant="pink" size="md">
            Pink md
          </Button>
          <Button variant="outline" size="md">
            Outline md
          </Button>
        </div>
      </SectionShell>

      <SectionShell as="section" width="default" aria-labelledby="icon-buttons-heading">
        <h2 id="icon-buttons-heading">Icon buttons</h2>
        <div style={{ display: "flex", gap: "1rem", padding: "1rem 0" }}>
          <IconButton aria-label="Search products" icon={<SearchIcon />} variant="dark" size="md" />
          <IconButton
            aria-label="Open cart with 3 items"
            icon={<CartIcon />}
            variant="dark"
            size="md"
            badgeCount={3}
            badgeTone="pink"
          />
          <IconButton aria-label="Browse offers" icon={<CartIcon />} variant="light" size="lg" />
        </div>
      </SectionShell>

      <SectionShell as="section" width="default" aria-labelledby="pills-heading">
        <h2 id="pills-heading">Pills</h2>
        <div style={{ display: "flex", gap: "0.5rem", padding: "1rem 0", flexWrap: "wrap" }}>
          <Pill tone="green">In stock</Pill>
          <Pill tone="pink" size="md">
            RFQ pending
          </Pill>
          <Pill tone="ink">Premium</Pill>
          <Pill tone="neutral">Draft</Pill>
        </div>
      </SectionShell>

      <SectionShell as="section" width="default" aria-labelledby="cards-heading">
        <h2 id="cards-heading">Cards</h2>
        <div style={{ display: "grid", gap: "1rem", padding: "1rem 0" }}>
          <Card padding="md" header={<h3>SKU LG-1042</h3>}>
            Premium ceramic mug with embossed logo plate.
          </Card>
          <Card
            padding="lg"
            header={<h3>Holiday Gift Box</h3>}
            footer={
              <Button variant="primary" size="sm">
                Add to RFQ
              </Button>
            }
          >
            Curated set of three artisan products in branded packaging.
          </Card>
        </div>
      </SectionShell>

      <Toaster />
    </SectionShell>
  );
}
