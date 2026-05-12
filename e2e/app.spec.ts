import { expect, test } from "@playwright/test";

test.describe("app smoke", () => {
  test("loads map and trip sheet", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/siquijor-fare/i);

    await expect(page.locator(".leaflet-container")).toBeVisible();

    await expect(
      page.getByRole("textbox", { name: /pickup/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("textbox", { name: /destination/i }),
    ).toBeVisible();
  });

  test("selecting a local destination suggestion does not crash the map", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => {
      errors.push(err.message);
    });

    await page.goto("/");

    const dest = page.getByRole("textbox", { name: /destination/i });
    await dest.fill("Lazi");
    await expect(
      page.getByRole("button", { name: /Lazi/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /Lazi/i }).first().click();

    await expect(page.locator(".leaflet-container")).toBeVisible();
    expect(
      errors.filter(
        (m) => m.includes("createIcon") || m.includes("_leaflet_events"),
      ),
    ).toEqual([]);
  });
});
