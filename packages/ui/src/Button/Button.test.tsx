import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Button } from "./Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("calls onClick", () => {
    const handler = vi.fn();
    render(<Button onClick={handler}>Go</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["primary", "md"],
    ["pink", "lg"],
    ["outline", "sm"],
  ] as const)("renders %s variant at %s size with no axe violations", async (variant, size) => {
    const { container } = render(
      <Button variant={variant} size={size}>
        {variant} {size}
      </Button>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("supports asChild slot for use as a link wrapper", () => {
    render(
      <Button asChild>
        <a href="/somewhere">Anchor</a>
      </Button>,
    );
    const anchor = screen.getByRole("link", { name: /anchor/i });
    expect(anchor).toHaveAttribute("href", "/somewhere");
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>Off</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
