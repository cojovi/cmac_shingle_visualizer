import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const sample = readFileSync("public/images/colonial-home.jpg");
const generated = "data:image/jpeg;base64," + sample.toString("base64");
test("studio renders at desktop and mobile widths with real assets and no overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [1440, 1024, 768, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page).toHaveTitle("Roof Studio — CMAC Roofing");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Original home photograph" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: "Visualize my roof" }),
    ).toBeDisabled();
    await page.screenshot({
      path: `/tmp/cmac-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
    expect(
      await page
        .locator("img")
        .evaluateAll((imgs) =>
          imgs.every(
            (i) =>
              (i as HTMLImageElement).complete &&
              (i as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
test("search resolves exact material, brand selection resets colors, and custom requires reference", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Find a shingle by name" })
    .fill("duration onyx");
  await page
    .locator(".search-results")
    .getByRole("button", { name: /Onyx Black/ })
    .click();
  await expect(page.locator(".material-description h3")).toHaveText(
    "Owens Corning TruDefinition Duration · Onyx Black",
  );
  await page.getByLabel("Brand", { exact: true }).selectOption("GAF");
  await expect(
    page.getByText("Shingle reference photo", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try this home" }).click();
  await expect(
    page.getByRole("button", { name: "Visualize my roof" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Custom shingle", exact: true })
    .click();
  await page.getByLabel("Manufacturer", { exact: true }).fill("GAF");
  await page.getByLabel("Product line / style").fill("Grand Sequoia");
  await page.getByLabel("Color name").fill("Charcoal");
  await page
    .locator("input[type=file]")
    .nth(1)
    .setInputFiles({
      name: "sample.jpg",
      mimeType: "image/jpeg",
      buffer: sample,
    });
  await expect(
    page.getByRole("button", { name: "Visualize my roof" }),
  ).toBeEnabled();
});
test("library filters, empty state, selection and dialog keyboard dismissal work", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Shingle library", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Search shingle library" })
    .fill("missing-shingle");
  await expect(page.getByText("No matching shingles")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByLabel("Filter by manufacturer").selectOption("IKO");
  await page.getByRole("button", { name: /Atlantic Blue/ }).click();
  await expect(page.locator(".material-description h3")).toHaveText(
    "IKO Dynasty · Atlantic Blue",
  );
  await page.getByRole("button", { name: "How it works" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("generation, comparison, save persistence, download and restoration work with a mocked provider", async ({
  page,
}) => {
  await page.route("**/api/generate", async (route) => {
    const body = route.request().postDataJSON();
    expect(body.photo.data).toBeTruthy();
    expect(body.selection).toEqual({
      productId: "ct-landmark",
      colorId: "moire-black",
    });
    await route.fulfill({ json: { image: generated } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Try this home" }).click();
  await page.getByRole("button", { name: "Visualize my roof" }).click();
  await expect(page.getByRole("slider")).toBeVisible();
  await page.getByRole("slider").fill("25");
  await expect(page.getByRole("slider")).toHaveValue("25");
  await page.getByRole("button", { name: "Save design", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Design saved", exact: true }),
  ).toBeDisabled();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download", exact: true }).click();
  expect((await download).suggestedFilename()).toContain("moire-black");
  await page.getByRole("button", { name: "Pewter", exact: true }).click();
  await expect(
    page.getByText("Your selection has changed.", { exact: false }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /Saved designs/ }).click();
  await page.getByRole("button", { name: "Open design" }).click();
  await expect(page.getByRole("slider")).toBeVisible();
  await expect(page.locator(".material-description h3")).toHaveText(
    "CertainTeed Landmark · Moire Black",
  );
});
test("upload rejects unsupported formats and server errors preserve the photo", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "home.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("hello"),
    });
  await expect(page.getByRole("alert")).toContainText("JPG, PNG, or WebP");
  await page.getByRole("button", { name: "Try this home" }).click();
  await page.route("**/api/generate", (r) =>
    r.fulfill({
      status: 503,
      json: { error: "Image generation isn’t connected yet." },
    }),
  );
  await page.getByRole("button", { name: "Visualize my roof" }).click();
  await expect(page.getByRole("alert")).toContainText("isn’t connected");
  await expect(
    page.getByRole("img", { name: "Your uploaded home" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Visualize my roof" }),
  ).toBeEnabled();
});

test("camera denial explains recovery and returns focus to the studio", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: () =>
          Promise.reject(new DOMException("Denied", "NotAllowedError")),
      },
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Camera", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Camera access wasn’t available",
  );
  await expect(
    page.getByRole("button", { name: "Take photo", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Camera", exact: true }),
  ).toBeFocused();
});

test("cancelling generation leaves the original photo and allows another attempt", async ({
  page,
}) => {
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/generate", async (route) => {
    await held;
    await route.fulfill({ json: { image: generated } }).catch(() => {});
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Try this home" }).click();
  await page.getByRole("button", { name: "Visualize my roof" }).click();
  await expect(
    page.getByRole("button", { name: "Cancel preview" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel preview" }).click();
  release();
  await expect(
    page.getByRole("button", { name: "Visualize my roof" }),
  ).toBeEnabled();
  await expect(page.getByRole("slider")).not.toBeVisible();
  await expect(
    page.getByRole("img", { name: "Your uploaded home" }),
  ).toBeVisible();
});

test("real API rejects invalid and foreign-origin requests without contacting the provider", async ({
  request,
}) => {
  const invalid = await request.post("/api/generate", { data: {} });
  expect(invalid.status()).toBe(400);
  const foreign = await request.post("/api/generate", {
    data: {},
    headers: { Origin: "https://unrelated.example" },
  });
  expect(foreign.status()).toBe(403);
  const health = await request.get("/api/health");
  expect(health.ok()).toBe(true);
  expect(typeof (await health.json()).configured).toBe("boolean");
});
