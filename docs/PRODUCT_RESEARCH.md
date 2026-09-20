# Shingle catalog research

Reviewed September 19, 2026. The catalog contains 67 product/color combinations in eight collections from six manufacturers. This is a curated selection, not a complete or ZIP-code-specific inventory. Manufacturer names, color names, product images, and trademarks remain the property of their respective owners.

| Manufacturer | Collection | Research source |
| --- | --- | --- |
| CertainTeed | Landmark | [Official Landmark product page](https://www.certainteed.com/products/residential-roofing-products/landmark) |
| Owens Corning | TruDefinition Duration, Oakridge, Woodmoor | [Official Build Your Roof catalog](https://www.owenscorning.com/en-us/roofing/build-your-roof/artisan-roofing-268449/shingles) |
| IKO | Dynasty | [Official Dynasty product page](https://www.iko.com/na/product/dynasty/) |
| Atlas | Pinnacle Pristine | [Official Pinnacle Pristine product page](https://www.atlasroofing.com/products/roof-shingles/pinnacle-pristine-shingles) |
| TAMKO | Titan XT | [Official Titan XT color pages](https://www.tamko.com/all-shingle-colors/titan-xt-rustic-black) |
| GAF | Timberline HDZ | [Official Timberline HDZ product page](https://www.gaf.com/en-us/roofing-materials/residential-roofing-materials/shingles/timberline-hdz) and [manufacturer brochure](https://www.gaf.com/en-us/document-library/documents/brochures-%26-literature/timberline-hdz-brochure-restz145.pdf) |

## Reference fidelity

- 58 combinations have actual manufacturer sample images, not fabricated CSS colors or generic shingle textures. Images were obtained from each manufacturer's product page or linked product CDN. The original image URL is recorded for each color in `data/catalog.json`.
- GAF's nine nationally listed HDZ colors are verified by the official product page and brochure. The source image server did not supply accessible swatches during collection. These nine entries therefore explicitly require a reference upload before generation. They do not use another manufacturer's similar-looking swatch.
- CertainTeed Landmark is kept distinct from Landmark PRO; no shared-color assumption is made across these lines. Owens Corning product lines also remain separate.
- Atlas images are the manufacturer's named regional swatches; blends and availability can differ across production regions.
- Architectural laminated shingles and Woodmoor's thicker designer shake profile carry different descriptions. The image reference provides additional pattern and color guidance. Specifications such as hail classification or warranty terms are intentionally not inferred from appearance.
- Local images are resized and JPEG-compressed for efficient display and generation. This introduces normal digital reproduction limitations and is not color calibration.

## Photography

The studio's inspiration/sample home is the CertainTeed Landmark Moire Black house photograph linked by its official Landmark page. The exact source URL is retained in `public/images/ATTRIBUTION.md`. It is labeled a sample home, not an AI-generated result.

## Generation API

Implementation follows [Google's official image-generation documentation](https://ai.google.dev/gemini-api/docs/image-generation), using a house image plus a material reference. The configurable default model is Gemini 3.1 Flash Image. Model access and billing must be verified in the operator's account. Roof-only editing and color fidelity remain model instructions, not deterministic masking guarantees.

## Maintaining the catalog

Check product names, color availability, original source URLs, and sample images against the manufacturer before updating. Add separate entries for materially different styles or regions. Never assign one brand's texture to another brand solely because they share a color name. Missing samples must continue to require a user-supplied reference. Run catalog validation after every update.
