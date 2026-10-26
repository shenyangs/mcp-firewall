import { test, expect } from "@playwright/test";
test("API rejects invalid requests and cross-origin writes", async ({
  request,
}) => {
  expect((await request.get("/api/health")).ok()).toBe(true);
  expect(
    (
      await request.post("/api/policy", { data: { allowWrites: "yes" } })
    ).status(),
  ).toBe(400);
  expect(
    (await request.post("/api/invoke", { data: { tool: "shell" } })).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/policy", {
        headers: { Origin: "https://example.com" },
        data: { allowWrites: true },
      })
    ).status(),
  ).toBe(403);
});

test('中文小屏引导、键盘焦点和失败提示',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await expect(page.getByLabel('首次使用三步引导')).toBeVisible();
 await expect(page.locator('.fixture')).toBeVisible();
 await expect(page.getByText('无模型推理 · 按明确规则执行')).toBeVisible();
 await expect(page.getByRole('button',{name:'读取笔记',exact:true})).toBeEnabled();
 await page.getByRole('switch').focus();await expect(page.getByRole('switch')).toBeFocused();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.route('**/api/invoke',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'MCP 调用失败，请检查本地服务后重试'})}));
 await page.getByRole('button',{name:'读取笔记',exact:true}).click();await expect(page.getByRole('alert')).toContainText('MCP 调用失败');
 await page.waitForTimeout(1200);await expect(page.getByRole('alert')).toBeVisible();
 await page.screenshot({path:'artifacts/zh-mobile-error.png',fullPage:true});
});
