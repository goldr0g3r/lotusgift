import { test, expect } from "@playwright/experimental-ct-react";
import AxeBuilder from "@axe-core/playwright";
import { AllComponents } from "../pages/AllComponents";

test.describe("@repo/ui accessibility smoke", () => {
  test("renders all 6 baseline components with zero axe violations (WCAG 2A + 2AA + 2.1AA + 2.2AA)", async ({
    mount,
    page,
  }) => {
    await mount(<AllComponents />);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
