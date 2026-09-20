import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { buildGeneration, validatePhoto } from "../server/generate";
import { products } from "../data/catalog";
import type { GenerationRequest, Photo } from "../types";
const photo: Photo = {
  data: (await readFile("public/images/colonial-home.jpg")).toString("base64"),
  mimeType: "image/jpeg",
  width: 1000,
  height: 749,
  name: "Home.jpg",
};
const base: GenerationRequest = {
  photo,
  selection: { productId: "ct-landmark", colorId: "moire-black" },
};
test("every catalog combination is unique, sourced, and has a readable local reference when declared", async () => {
  const ids = new Set<string>();
  for (const product of products) {
    assert.ok(!ids.has(product.id));
    ids.add(product.id);
    assert.match(product.source, /^https:/);
    assert.ok(product.colors.length);
    assert.equal(
      new Set(product.colors.map((c) => c.id)).size,
      product.colors.length,
    );
    for (const color of product.colors)
      if (color.swatch) await access(`public${color.swatch}`);
  }
});
test("prompt grounds the exact brand, product and color in a second reference image", async () => {
  const result = await buildGeneration(base);
  assert.match(result.prompt, /CertainTeed Landmark in Moire Black/);
  assert.match(result.prompt, /Preserve the EXACT framing/);
  assert.ok(result.reference.data.length > 1000);
  validatePhoto(result.reference);
});
test("rejects invented color/product combinations", async () => {
  await assert.rejects(
    buildGeneration({
      ...base,
      selection: { productId: "ct-landmark", colorId: "onyx-black" },
    }),
    /valid brand/,
  );
});
test("requires a sample instead of silently guessing when a swatch is unavailable", async () => {
  await assert.rejects(
    buildGeneration({
      ...base,
      selection: { productId: "gaf-hdz", colorId: "charcoal" },
    }),
    /manufacturer swatch/,
  );
});
test("accepts custom products only with a reference and all three identifiers", async () => {
  const custom = {
    brand: "Custom brand",
    style: "Designer shake",
    color: "Slate",
  };
  await assert.rejects(
    buildGeneration({ ...base, custom }),
    /photo of the custom/,
  );
  await assert.rejects(
    buildGeneration({
      ...base,
      custom: { ...custom, color: "" },
      reference: photo,
    }),
    /Enter the brand/,
  );
  const result = await buildGeneration({ ...base, custom, reference: photo });
  assert.match(result.prompt, /Custom brand Designer shake in Slate/);
});
test("rejects fake image contents, excessive payloads and missing images", () => {
  assert.throws(
    () =>
      validatePhoto({
        ...photo,
        data: Buffer.from("not an image").toString("base64"),
      }),
    /contents/,
  );
  assert.throws(
    () => validatePhoto({ ...photo, data: "A".repeat(8_000_004) }),
    /valid JPG/,
  );
  assert.throws(() => validatePhoto(undefined), /valid JPG/);
});
