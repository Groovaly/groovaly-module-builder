# Groovaly Golden Age Builder

Static React, TypeScript and Vite application for composing Golden Age furniture modules on a 6 × 4 grid and requesting an individual quote. The current product flow does not add items to a cart or take payment. See [Versions and deployment](docs/VERSIONS.md) for the release history and handoff details.

## Production status (14 October 2026)

`main` contains the live Golden Age Builder V2, including Lean's four image exports, one-cell placement, metrics and quote data. Its palette shows Bloom, Grid, Lean on the second row and Cub, Split, Nest on the third. The [organization Pages site](https://groovaly.github.io/groovaly-module-builder/?embed=1) is embedded in the live [Golden Age collection](https://groovaly.com/collections/golden-age#create-your-own). Desktop, mobile and end-to-end quote checks passed after the Shopify cutover. The former personal Golden V1 Pages site remains available for rollback during stabilization.

## How it works

- Drag modules from the palette to the grid or move a placed module. Placement checks grid boundaries, overlap and support from below.
- The direct Pages URL and the embedded view use the same fluid builder layout. `?embed=1` removes the standalone page margins and enables communication with the Shopify parent page.
- Review the composition and request a quote. The builder creates a layout, module counts, an estimated total and composition details for the request. This estimate is informational; the quote is handled individually.
- When embedded with `?embed=1`, the builder sends the quote data to the Shopify page through `postMessage`. Shopify owns the customer-facing quote form and must accept messages from the builder's current Pages origin.
- The builder attempts to upload an image of the composition to Cloudinary and include its URL in the quote data. If that upload fails, the data can still be sent without the image.

The application has no database or application server. GitHub Pages hosts its built files. The customer form lives in a Shopify Custom Liquid block and sends requests through Formspree; Romain owns that Formspree account. Preview uploads use the Cloudinary cloud `dnzdunl2d` and unsigned preset `groovaly_quotes_unsigned`. These services are managed outside this repository.

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

These tests do not cover the complete Shopify quote flow. For a future release, also check module placement, the generated quote data, the composition image and an actual form submission on desktop and mobile.

## Code map

- `src/App.tsx`: standalone or embedded page (`?embed=1`).
- `src/components/ModuleBuilder.tsx`: module catalogue, palette, quote data, metrics and image export.
- `src/logic/grid.ts` and `src/logic/grid.test.ts`: grid placement rules and tests.
- `src/logic/exportPreview.ts`: layout data for the quote.
- `public/images/grid` and `public/images/selection`: module images at normal and high resolution.
- `.github/workflows/deploy-pages.yml`: Pages build and deployment workflow.

The current module dimensions, weights and indicative prices are recorded in [Golden Age catalogue data](docs/CATALOG.md). Numeric prices are stored in `ModuleBuilder.tsx` and included in internal quote JSON, but the current customer-facing Shopify form does not display them. If that JSON is used for pricing later, update the code when Groovaly changes its catalogue.

## Deployment and ownership

This public repository contains a clean Golden Age V2 source snapshot. The complete earlier development history, including Classic Builder V2, is kept separately in the private [Groovaly archive](https://github.com/Groovaly/groovaly-module-builder-archive). The workflow publishes `main` at [groovaly.github.io/groovaly-module-builder](https://groovaly.github.io/groovaly-module-builder/). The live Shopify block points to this Pages site and trusts `https://groovaly.github.io` for builder messages. Romain has Owner access to the Groovaly GitHub organization. A Cloudinary Master Admin invitation was sent on 14 October; acceptance still needs confirmation. See [Versions and deployment](docs/VERSIONS.md).
