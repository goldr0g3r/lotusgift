import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Toaster } from "./Toaster";

describe("Toaster", () => {
  it("renders an ordered list region", () => {
    const { container } = render(<Toaster />);
    expect(container.querySelector("section, ol")).not.toBeNull();
  });

  it("has no axe violations when mounted with no toasts visible", async () => {
    const { container } = render(<Toaster />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
