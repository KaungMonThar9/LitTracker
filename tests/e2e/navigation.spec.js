import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Rec Page!")).toBeVisible();
});

test("user list redirects to login when logged out", async ({ page }) => {
  await page.goto("/UserList");
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
});
