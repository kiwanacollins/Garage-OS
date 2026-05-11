import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "garageos.accessToken",
      "workspace-access-token",
    );
    window.localStorage.setItem(
      "garageos.refreshToken",
      "workspace-refresh-token",
    );
  });

  await page.route("**/api/v1/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "user-1",
          name: "Workspace User",
          email: "workspace@example.com",
          phone: null,
          role: "admin",
        },
        accessToken: "workspace-access-token",
        refreshToken: "workspace-refresh-token",
      }),
    });
  });
});

test("mechanic can inspect job card tabs", async ({ page }) => {
  await page.goto("/mechanic");
  await expect(page.getByRole("heading", { name: "Job cards" })).toBeVisible();
  await expect(page.getByText("UAX 123A").first()).toBeVisible();

  await page.getByRole("tab", { name: "labour" }).click();
  await expect(page.getByText("Road test and lift inspection")).toBeVisible();

  await page.getByRole("tab", { name: "parts" }).click();
  await expect(page.getByText("Front brake pads")).toBeVisible();
});

test("mechanic can move an assigned job into progress and complete it", async ({
  page,
}) => {
  await page.goto("/mechanic");
  await page.getByText("UBK 442M").click();

  await page.getByRole("button", { name: "Start work" }).click();
  await expect(page.getByText("In progress").first()).toBeVisible();

  await page.getByRole("button", { name: "Mark complete" }).click();
  await expect(page.getByText("Completed").first()).toBeVisible();
});

test("mechanic can inspect, log labour, request parts, and submit completion", async ({
  page,
}) => {
  await page.goto("/mechanic");
  await page.getByText("UBK 442M").click();

  await page.getByLabel("Finding").fill("Rear sway bar link has play");
  await page
    .getByLabel("Recommendation")
    .fill("Replace rear sway bar links during service");
  await page.getByRole("button", { name: "Record finding" }).click();
  await expect(page.getByText("Rear sway bar link has play")).toBeVisible();

  await page.getByRole("tab", { name: "labour" }).click();
  await page
    .getByLabel("Labour task")
    .fill("Oil service and suspension inspection");
  await page.getByLabel("Hours").fill("1.2");
  await page.getByRole("button", { name: "Add labour entry" }).click();
  await expect(
    page.getByText("Oil service and suspension inspection"),
  ).toBeVisible();

  await page.getByRole("tab", { name: "parts" }).click();
  await page.getByLabel("Part name").fill("Rear sway bar link");
  await page.getByLabel("Quantity").fill("2");
  await page
    .getByLabel("Urgency note")
    .fill("Noise confirmed during inspection");
  await page.getByRole("button", { name: "Request part" }).click();
  await expect(page.getByText("Rear sway bar link x2")).toBeVisible();
  await expect(page.getByText("Awaiting parts").first()).toBeVisible();

  await page.getByRole("tab", { name: "complete" }).click();
  await page
    .getByLabel("Final notes")
    .fill("Service complete after inspection and parts request.");
  await page.getByRole("button", { name: "Submit for quality check" }).click();
  await expect(page.getByText("Completed").first()).toBeVisible();
  await expect(
    page.getByText("Service complete after inspection and parts request."),
  ).toBeVisible();
});

test("admin can assign an unassigned work order", async ({ page }) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Admin dashboard" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "operations" }).click();
  await expect(page.getByText("No mechanic")).toBeVisible();

  await page.getByRole("textbox", { name: "Assign mechanic" }).click();
  await page.getByRole("option", { name: "Sarah Auma (2 active)" }).click();
  await page.getByRole("button", { name: "Assign job card" }).click();

  await expect(
    page.getByRole("textbox", { name: "Assign mechanic" }),
  ).toHaveValue("Sarah Auma (2 active)");
  await expect(page.getByText("Assigned").first()).toBeVisible();
});

test("admin can approve a pending parts request", async ({ page }) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Admin dashboard" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "operations" }).click();
  await expect(
    page.getByRole("heading", { name: "Parts approval" }),
  ).toBeVisible();

  await page
    .getByLabel("Approval note")
    .fill("Customer approved this item by phone.");
  await page.getByRole("button", { name: "Approve" }).first().click();

  await expect(
    page.getByLabel("Parts approval queue").getByText("approved").first(),
  ).toBeVisible();
  await expect(
    page.getByText("Admin: Customer approved this item by phone."),
  ).toBeVisible();
});

test("admin can review KPIs, filter reports, and add service catalogue items", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Admin dashboard" }),
  ).toBeVisible();
  await expect(page.getByText("Revenue today")).toBeVisible();
  await expect(page.getByText("Mechanic utilisation")).toBeVisible();
  await expect(page.getByText("Parts awaiting approval")).toBeVisible();

  await page.getByRole("tab", { name: "reports" }).click();
  await page.getByLabel("From").fill("2026-05-01");
  await page.getByRole("textbox", { name: "To" }).fill("2026-05-10");
  await page.getByRole("button", { name: "Export Tax summary" }).click();
  await expect(
    page.getByText("Tax summary export queued for 2026-05-01 to 2026-05-10"),
  ).toBeVisible();

  await page.getByRole("tab", { name: "staff" }).click();
  await expect(
    page.getByRole("heading", { name: "Staff management" }),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: "Moses Kato" })).toBeVisible();

  await page.getByRole("tab", { name: "services" }).click();
  await page.getByRole("textbox", { name: "Service" }).fill("Wheel alignment");
  await page.getByRole("textbox", { name: "Price" }).fill("110000");
  await page.getByRole("button", { name: "Add service" }).click();
  await expect(page.getByText("Wheel alignment")).toBeVisible();
});

test("admin can manage audit logs, settings, suppliers, and purchase orders", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Admin dashboard" }),
  ).toBeVisible();

  await page.getByRole("tab", { name: "audit" }).click();
  await expect(
    page.getByRole("heading", { name: "Change diff" }),
  ).toBeVisible();
  await page.getByLabel("Search audit logs").fill("invoice");
  await expect(page.getByText("INV-1849")).toBeVisible();

  await page.getByRole("tab", { name: "settings" }).click();
  await page.getByLabel("Garage name").fill("Kiwana Auto Works");
  await page.getByLabel("VAT rate").fill("18");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(
    page.getByText(
      "Kiwana Auto Works settings saved with 18% VAT and GOS invoices",
    ),
  ).toBeVisible();

  await page.getByRole("tab", { name: "suppliers" }).click();
  await page.getByLabel("Supplier name").fill("Entebbe Parts Hub");
  await page.getByLabel("Supplier phone").fill("+256 702 000 111");
  await page.getByLabel("Supplier email").fill("orders@entebbeparts.local");
  await page.getByRole("button", { name: "Add supplier" }).click();
  await expect(
    page.getByRole("cell", { name: "Entebbe Parts Hub" }),
  ).toBeVisible();

  await page.getByRole("tab", { name: "purchases" }).click();
  await page.getByRole("button", { name: "Create purchase order" }).click();
  await expect(page.getByText("PO-7002")).toBeVisible();
  await page.getByRole("button", { name: "Mark shipped" }).last().click();
  await expect(page.getByText("shipped").last()).toBeVisible();
  await page.getByRole("button", { name: "Mark received" }).last().click();
  await expect(page.getByText("received").last()).toBeVisible();
});

test("mechanic can keep a job card usable offline and sync queued changes", async ({
  page,
  context,
}) => {
  await page.goto("/mechanic");
  await expect(page.getByRole("heading", { name: "Job cards" })).toBeVisible();
  await expect(page.getByText("UAX 123A").first()).toBeVisible();
  await expect(page.getByLabel("Offline sync status")).toContainText(
    /Offline ready|Preparing offline cache/,
  );

  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(page.getByText("Offline mode active")).toBeVisible();

  await page.getByLabel("Finding").fill("Offline brake measurement saved");
  await page.getByRole("button", { name: "Record finding" }).click();
  await expect(page.getByText("Offline brake measurement saved")).toBeVisible();
  await expect(page.getByText("1 changes queued offline")).toBeVisible();

  await page.getByRole("tab", { name: "parts" }).click();
  await page.getByLabel("Part name").fill("Offline pad sensor");
  await page.getByLabel("Quantity").fill("1");
  await page
    .getByLabel("Urgency note")
    .fill("Queued while inspecting without network");
  await page.getByRole("button", { name: "Request part" }).click();
  await expect(page.getByText("Offline pad sensor x1")).toBeVisible();
  await expect(page.getByText("2 changes queued offline")).toBeVisible();

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(
    page.getByText("Sync complete for 2 queued changes"),
  ).toBeVisible();
});
