import {test, expect} from '@playwright/test';
// TEMPLATE_TEST_REPLACE: Agent must replace with domain-specific real-world assertion before PASS.
test('starter page renders', async ({page}) => { await page.goto('/'); await expect(page.getByRole('heading', {name:'mcp-firewall'})).toBeVisible(); });
