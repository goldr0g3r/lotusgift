import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import { IconButton } from "./IconButton";

const TestIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <circle cx="8" cy="8" r="6" />
  </svg>
);

describe("IconButton", () => {
  it("renders with the provided aria-label", () => {
    render(<IconButton aria-label="Search" icon={<TestIcon />} />);
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  it("calls onClick", () => {
    const handler = vi.fn();
    render(<IconButton aria-label="Open cart" icon={<TestIcon />} onClick={handler} />);
    fireEvent.click(screen.getByRole("button"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("renders a badge when badgeCount > 0", () => {
    render(<IconButton aria-label="Cart" icon={<TestIcon />} badgeCount={3} />);
    expect(screen.getByRole("button", { name: /cart/i }).textContent).toContain("3");
  });

  it("caps badge at 99+", () => {
    render(<IconButton aria-label="Inbox" icon={<TestIcon />} badgeCount={250} />);
    expect(screen.getByRole("button", { name: /inbox/i }).textContent).toContain("99+");
  });

  it.each([
    ["dark", "sm", "pink"],
    ["light", "md", "green"],
    ["dark", "lg", undefined],
  ] as const)(
    "renders %s variant at %s size (badge tone %s) without axe violations",
    async (variant, size, tone) => {
      const { container } = render(
        <IconButton
          aria-label={`Action ${variant}-${size}`}
          icon={<TestIcon />}
          variant={variant}
          size={size}
          badgeCount={tone ? 2 : undefined}
          badgeTone={tone}
        />,
      );
      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
