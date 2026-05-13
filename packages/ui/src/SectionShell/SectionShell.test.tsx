import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { SectionShell } from "./SectionShell";

describe("SectionShell", () => {
  it("renders children inside the configured element", () => {
    render(
      <SectionShell as="main" data-testid="shell">
        <h1>Title</h1>
      </SectionShell>,
    );
    const shell = screen.getByTestId("shell");
    expect(shell.tagName).toBe("MAIN");
    expect(screen.getByRole("heading", { name: /title/i })).toBeInTheDocument();
  });

  it.each([
    ["section", "default"],
    ["div", "narrow"],
    ["article", "wide"],
  ] as const)("renders as=%s width=%s without axe violations", async (as, width) => {
    const { container } = render(
      <SectionShell as={as} width={width}>
        <h2>Heading</h2>
        <p>Body</p>
      </SectionShell>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
