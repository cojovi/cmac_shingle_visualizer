# Shingle Visualizer

A complete roofing design studio: upload or photograph a home, select an actual shingle product and color, and generate a reference-guided roof visualization. Includes a searchable manufacturer library, before/after slider, custom material references, local saved designs, and image downloads.

## Run locally

Requires Node.js 22 or newer.

```sh
npm install
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local
npm run dev
```

Open http://localhost:3000. The catalog and sample-home workflow work without a key. Generation requires a Gemini API account with billing and access to the configured image model. The default is `gemini-3.1-flash-image`; override `GEMINI_IMAGE_MODEL` if needed for your account.

**The API key stays on the server.** Do not use a `VITE_` environment variable for it. Changes to `.env.local` require restarting the server.

## Build and run

```sh
npm run build
npm start
```

This application needs its Node server; deploying only `dist` to a static host will not provide image generation. Keep `public`, `data`, `server`, and `dist` with the application. The server binds to `127.0.0.1` by default; use `HOST` and `PORT` for your hosting environment. Protect a public deployment with your organization's authentication or gateway before exposing a paid generation endpoint. The included per-process rate/concurrency limits are intended for a small, single-server studio, not a distributed public service.

## How the image generation works

1. The browser validates the uploaded JPEG, PNG, or WebP (maximum 12 MB), decodes it, strips embedded metadata by re-encoding, and resizes the longest side to 2,048 pixels.
2. The server validates the product/color pair against the curated catalog and reads its bundled manufacturer sample. Custom or missing-swatch products require an uploaded sample; the app never fabricates a reference.
3. The house and reference image are passed together to Gemini with roof-only instructions specifying shingle geometry, granules, perspective, light, and preservation of the home.
4. The browser displays the result with an accessible before/after slider. Results can be saved to IndexedDB on the current device or downloaded. Unsaved recent previews last only for the current session (up to eight).

AI outputs are conceptual visualizations, not calibrated color matches or guarantees that every non-roof pixel is unchanged. Always verify actual shingles with full-size samples and a local supplier. Regional availability varies. See [product research and source notes](docs/PRODUCT_RESEARCH.md).

Photos are sent to Google's image service when generating. The application does not persist home photos on the server or log request bodies. Saved designs are stored only in the browser; clearing browser storage removes them. Provider-side data handling follows your Gemini account terms. Closing a request cancels the local operation, but a provider request already accepted may still incur usage.

## Verification

```sh
npm test          # Catalog, reference grounding, invalid inputs, image payloads
npm run build     # Strict TypeScript and production bundle
npm run test:e2e  # Browser flows; requires Playwright Chromium
```

If Chromium is not installed, run `npx playwright install chromium`. Browser tests use a mocked image provider for predictable UI verification. A real paid image-generation call is intentionally separate and requires an API key.

## Structure

- `App.tsx`, `components/`, `styles.css`: responsive studio and dialogs
- `data/catalog.json`: product/color source records and original manufacturer reference URLs
- `public/images/swatches/`: optimized manufacturer swatches
- `server/`: private generation endpoint, validation, limits, development/production serving
- `utils/`: photo preparation, downloads, and device-local design storage
- `tests/`: backend and browser verification
