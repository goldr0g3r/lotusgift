import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Pill } from "./Pill";

describe("Pill", () => {
  it("renders children", () => {
    render(<Pill>In stock</Pill>);
    expect(screen.getByText(/in stock/i)).toBeInTheDocument();
  });

  it.each([
    ["green", "sm"],
    ["pink", "md"],
    ["ink", "sm"],
    ["neutral", "md"],
  ] as const)("renders tone=%s size=%s without axe violations", async (tone, size) => {
    const { container } = render(
      <Pill tone={tone} size={size}>
        Status
      </Pill>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
