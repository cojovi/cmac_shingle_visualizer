import catalog from "./catalog.json";
import type { ShingleProduct, Selection } from "../types";
export const products = catalog as ShingleProduct[];
export const brands = [
  "CertainTeed",
  "GAF",
  "Owens Corning",
  "IKO",
  "Atlas",
  "TAMKO",
];
export const colorCount = products.reduce((sum, p) => sum + p.colors.length, 0);
export function getSelection(selection: Selection) {
  const product = products.find((p) => p.id === selection.productId);
  const color = product?.colors.find((c) => c.id === selection.colorId);
  return { product, color };
}
export const defaultSelection: Selection = {
  productId: "ct-landmark",
  colorId: "moire-black",
};
