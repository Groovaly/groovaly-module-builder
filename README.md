# Groovaly Golden Age Builder

Static React, TypeScript and Vite application for composing Golden Age furniture modules on a 6 × 4 grid and requesting an individual quote. The current product flow does not add items to a cart or take payment. See [Versions and deployment](docs/VERSIONS.md) for the release and handoff plan.

## Current work

`main` contains Golden Age Builder V2. Lean's four image exports, palette position, one-cell placement, metrics and quote data are implemented. Catalogue prices were aligned with Groovaly's current product pages. The [new Pages preview](https://groovaly.github.io/groovaly-module-builder/) is published and has passed standalone desktop and mobile checks. The Shopify quote flow still requires an end-to-end check; the Golden V1 site remains live until cutover.

## How it works

- Drag modules from the palette to the grid or move a placed module. Placement checks grid boundaries, overlap and support from below.
- Review the composition and request a quote. The builder creates a layout, module counts, an estimated total and composition details for the request. This estimate is informational; the quote is handled individually.
- When embedded with `?embed=1`, the builder sends the quote data to the Shopify page through `postMessage`. Shopify owns the customer-facing quote form and must accept messages from the builder's current Pages origin.
- The builder attempts to upload an image of the composition to Cloudinary and include its URL in the quote data. If that upload fails, the data can still be sent without the image.

The application has no database or application server. GitHub Pages can host its built files. The quote form's Shopify integration and the Cloudinary upload are external services.

## Run locally

Use Node.js 20, as in the Pages workflow:

```bash
npm ci
npm run dev
```

Build and preview the production files:

```bash
npm run build
npm run preview
```

Run the logic tests:

```bash
npm test
```

These tests do not cover the complete Shopify quote flow. Before release, check module placement, the generated quote data, the composition image and an actual form submission on desktop and mobile.

## Code map

- `src/App.tsx`: standalone or embedded page (`?embed=1`).
- `src/components/ModuleBuilder.tsx`: module catalogue, palette, quote data, metrics and image export.
- `src/logic/grid.ts` and `src/logic/grid.test.ts`: grid placement rules and tests.
- `src/logic/exportPreview.ts`: layout data for the quote.
- `public/images/grid` and `public/images/selection`: module images at normal and high resolution.
- `.github/workflows/deploy-pages.yml`: Pages build and deployment workflow.

The current module dimensions, weights and indicative prices are recorded in [Golden Age catalogue data](docs/CATALOG.md). Update the numeric prices in `ModuleBuilder.tsx` when Groovaly changes its public catalogue.

## Deployment and ownership

This public repository contains a clean Golden Age V2 source snapshot. The complete earlier development history, including Classic Builder V2, is kept separately in a private archive under Groovaly's control. The workflow publishes `main` at [groovaly.github.io/groovaly-module-builder](https://groovaly.github.io/groovaly-module-builder/), allowing V2 to be checked while the old V1 site continues to serve visitors. At cutover, update both the Shopify iframe URL and its trusted `postMessage` origin. See [Versions and deployment](docs/VERSIONS.md).
