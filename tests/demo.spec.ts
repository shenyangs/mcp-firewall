import { test, expect } from "@playwright/test";
test("real MCP policy gate: denied hash, permission flip, allowed mutation", async ({
  page,
  request,
}) => {
  await request.post("/api/restore");
  const baseline = await (await request.get("/api/state")).json();
  await page.goto("/");
  try {
    await page.getByRole("button", { name: "Read note", exact: true }).click();
    await expect(page.locator(".event").first()).toContainText(
      "read_project_note",
    );
    await expect(page.locator(".event").first()).toContainText(
      "executed: true",
    );
    await page.getByRole("button", { name: "Attempt write" }).click();
    await expect(page.locator(".event").first()).toContainText("Denied");
    await expect(page.locator(".event").first()).toContainText(
      "executed: false",
    );
    await expect(page.getByTestId("integrity")).toHaveText("UNCHANGED");
    await page.screenshot({
      path: "artifacts/denied-write.png",
      fullPage: true,
    });
    await page.getByRole("switch").click();
    await expect(page.getByRole("switch")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await page.getByRole("button", { name: "Attempt write" }).click();
    await expect(page.locator(".event").first()).toContainText("Allowed");
    await expect(page.getByTestId("integrity")).toHaveText("CHANGED");
    await expect(page.locator(".stats strong").first()).toHaveText(
      String(
        baseline.events
          .slice(-97)
          .filter((e: { decision: string }) => e.decision === "Allowed")
          .length + 2,
      ),
    );
    await expect(page.locator(".stats strong").nth(1)).toHaveText(
      String(
        baseline.events
          .slice(-97)
          .filter((e: { decision: string }) => e.decision === "Denied").length +
          1,
      ),
    );
    await page.screenshot({
      path: "artifacts/allowed-write.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Restore fixture & lock policy" })
      .click();
    await expect(page.getByRole("switch")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  } finally {
    await request.post("/api/restore");
  }
});
