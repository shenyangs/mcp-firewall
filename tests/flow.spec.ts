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
