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
 await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'读取笔记',exact:true})).toBeFocused();
 expect(await page.getByRole('button',{name:'读取笔记',exact:true}).evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.route('**/api/invoke',async route=>{await new Promise(resolve=>setTimeout(resolve,700));await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'MCP 调用失败，请检查本地服务后重试'})});});
 await page.getByRole('button',{name:'读取笔记',exact:true}).click();await expect(page.getByRole('status')).toContainText('正在等待 MCP 响应');await expect(page.getByRole('button',{name:'尝试写入'})).toBeDisabled();await page.screenshot({path:'artifacts/loading-state.png',fullPage:true});await expect(page.getByRole('alert')).toContainText('MCP 调用失败');
 await page.waitForTimeout(1200);await expect(page.getByRole('alert')).toBeVisible();
 await page.screenshot({path:'artifacts/zh-mobile-error.png',fullPage:true});
});

 test('空记录不显示虚构请求', async ({page}) => {
 await page.route('**/api/events', route => route.fulfill({contentType:'text/event-stream', body:'data: '+JSON.stringify({allowWrites:false,events:[],hash:''})+'\n\n'}));
 await page.goto('/');
 await expect(page.getByText('还没有调用记录')).toBeVisible();
 await expect(page.getByText('等待第一条请求')).toBeVisible();
 await expect(page.locator('.event')).toHaveCount(0);
 await page.screenshot({path:'artifacts/empty-state.png',fullPage:true});
 });

 test('离线时提示连接状态并禁止发起请求', async ({page}) => {
 await page.route('**/api/events', route => route.abort());
 await page.goto('/');
 await expect(page.getByRole('status')).toContainText('正在连接本地服务');
 await expect(page.getByRole('button',{name:'尝试写入'})).toBeDisabled();
 await expect(page.getByRole('switch')).toBeDisabled();
 });
