import { test, expect } from "@playwright/test";
test("real MCP policy gate: denied hash, permission flip, allowed mutation", async ({
  page,
  request,
}) => {
  await request.post("/api/restore");
  const baseline = await (await request.get("/api/state")).json();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  try {
    await page.getByRole("button", { name: "读取笔记", exact: true }).click();
    await expect(page.locator(".event").first()).toContainText(
      "read_project_note",
    );
    await expect(page.locator(".event").first()).toContainText(
      "实际执行：是",
    );
    await page.getByText("编辑写入内容", { exact: false }).first().click();
    await page.getByLabel("写入正文（最多 2,048 字符）").fill("本次写入已由本地操作者确认。\n");
    await page.getByText("编辑写入内容", { exact: false }).first().click();
    await page.getByRole("button", { name: "尝试写入" }).click();
    await expect(page.locator(".event").first()).toContainText("拒绝");
    await expect(page.locator(".event").first()).toContainText(
      "实际执行：否",
    );
    await expect(page.getByTestId("integrity")).toHaveText("未改变");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByTestId("payload")).toContainText("write_project_note");
    await expect(page.getByTestId("payload")).toContainText("本次写入已由本地操作者确认。");
    await page.screenshot({
      path: "docs/images/request-denied.png",
      fullPage: true,
    });
    await page.getByRole("switch").click();
    await expect(page.getByRole("switch")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await page.getByRole("button", { name: "尝试写入" }).click();
    await expect(page.locator(".event").first()).toContainText("允许");
    await expect(page.getByTestId("integrity")).toHaveText("已改变");
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
      path: "docs/images/request-overview.png",
      fullPage: true,
    });
    await page.locator(".event").nth(1).getByRole("button").click();
    await expect(page.getByTestId("integrity")).toHaveText("未改变");
    await expect(page.getByLabel("选中请求详情")).toContainText("写入权限关闭，请求在执行前被拦截");
    await page.locator(".event").first().getByRole("button").click();
    await expect(page.getByTestId("integrity")).toHaveText("已改变");
    await page
      .getByRole("button", { name: "恢复示例并关闭写入" })
      .click();
    await expect(page.getByRole("switch")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  } finally {
    await request.post("/api/restore");
  }
});
