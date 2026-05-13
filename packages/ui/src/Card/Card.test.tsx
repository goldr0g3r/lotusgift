import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Card } from "./Card";

describe("Card", () => {
  it("renders children inside the body", () => {
    render(<Card>Body content</Card>);
    expect(screen.getByText(/body content/i)).toBeInTheDocument();
  });

  it("renders header + footer when provided", () => {
    render(
      <Card header={<h3>Header</h3>} footer={<button type="button">Action</button>}>
        Body
      </Card>,
    );
    expect(screen.getByRole("heading", { name: /header/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /action/i })).toBeInTheDocument();
  });

  it.each([
    ["sm", "div"],
    ["md", "article"],
    ["lg", "section"],
  ] as const)("renders %s padding as %s without axe violations", async (padding, as) => {
    const { container } = render(
      <Card padding={padding} as={as} header={<h3>Title</h3>}>
        Hello world
      </Card>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
