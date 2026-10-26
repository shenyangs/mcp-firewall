import {test, expect} from '@playwright/test';
// TEMPLATE_DEMO_REPLACE: Agent must replace with scripted real P0 demonstration.
test('starter demo', async ({page}) => { await page.goto('/'); await expect(page.locator('main')).toBeVisible(); await page.screenshot({path:'artifacts/starter.png'}); });
