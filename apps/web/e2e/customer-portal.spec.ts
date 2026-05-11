import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "garageos.accessToken",
      "customer-access-token",
    );
    window.localStorage.setItem(
      "garageos.refreshToken",
      "customer-refresh-token",
    );
  });

  await page.route("**/api/v1/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "customer-1",
          name: "Alice Customer",
          email: "customer@example.com",
          phone: "+256700000004",
          role: "customer",
        },
        accessToken: "customer-access-token",
        refreshToken: "customer-refresh-token",
      }),
    });
  });
});

test("customer can manage portal workflow from vehicle to payment and feedback", async ({
  page,
}) => {
  await page.goto("/customer");
  await expect(
    page.getByRole("heading", { name: "Customer portal" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "UAX 123A" })).toBeVisible();

  await page.getByRole("tab", { name: "profile" }).click();
  await page.getByLabel("Address").fill("Bukoto, Kampala");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved")).toBeVisible();

  await page.getByRole("tab", { name: "vehicles" }).click();
  await page.getByLabel("Make").fill("Mazda");
  await page.getByLabel("Model").fill("CX-5");
  await page.getByLabel("Year").fill("2020");
  await page.getByLabel("Colour").fill("Red");
  await page.getByLabel("Registration plate").fill("UCA 990P");
  await page.getByLabel("Odometer").fill("34800");
  await page.getByRole("button", { name: "Add vehicle" }).click();
  await expect(page.getByRole("button", { name: /UCA 990P/ })).toBeVisible();

  await page.getByRole("tab", { name: "appointments" }).click();
  await page
    .getByLabel("Issue description")
    .fill("Wheel alignment and brake check");
  await page.getByRole("button", { name: "Book appointment" }).click();
  await expect(page.getByText("Wheel alignment and brake check")).toBeVisible();
  await expect(page.getByText("Booking confirmed for")).toBeVisible();

  await page.getByRole("tab", { name: "invoices" }).click();
  await page.getByRole("button", { name: "Pay online" }).first().click();
  await expect(
    page
      .getByLabel("Invoices")
      .getByText("Pesapal checkout ready: mock-INV-1849"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm Pesapal callback" }).click();
  await expect(
    page.getByLabel("Invoices").getByText("Pesapal payment completed"),
  ).toBeVisible();
  await expect(
    page.getByLabel("Invoices").getByText("paid").first(),
  ).toBeVisible();

  await page.getByRole("tab", { name: "feedback" }).click();
  await page.getByLabel("Rating").fill("5");
  await page.getByLabel("Comment").fill("Clear updates and smooth pickup.");
  await page.getByRole("button", { name: "Submit feedback" }).click();
  await expect(
    page.getByLabel("Customer feedback").getByText("Feedback submitted: 5/5"),
  ).toBeVisible();
});
