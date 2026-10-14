# Versions and deployment

This document records the Golden Age V2 handoff started on 9 October 2026 and the live Shopify cutover completed on 14 October 2026.

## Version map

| Version | Location | Purpose and status |
| --- | --- | --- |
| Golden Age Builder V1 | Personal repository's Pages site | Former live quote builder, retained temporarily for rollback. |
| Classic Builder V2 | Private Groovaly archive | Former e-commerce work and its complete Git history, retained for possible future reuse. |
| Golden Age Builder V2 | `main` in this public repository; [organization Pages site](https://groovaly.github.io/groovaly-module-builder/) | Live Golden Age quote builder with Lean and current catalogue data, embedded in Shopify. |

The names “V1” and “V2” refer to the Golden Age builder here. Classic Builder V2 is a different product line. This public repository starts from a clean Golden V2 snapshot, without prior Git history. The private archive preserves that history and the Classic source for Groovaly.

## Publishing and cutover, completed 14 October 2026

1. The personal Pages site continued to serve Golden V1 while the separate V2 site was prepared.
2. This clean V2 repository was published from `main` through GitHub Pages on 9 October 2026. The private archive holds the earlier branches, tags and Classic Builder history.
3. The new Pages URL was checked directly on desktop and mobile before the live switch.
4. On 14 October, the live Shopify Custom Liquid block was updated to use `https://groovaly.github.io/groovaly-module-builder/?embed=1` and to trust `https://groovaly.github.io` for `postMessage`. Desktop and mobile behavior, an actual form submission, the resulting email and Cloudinary preview image were checked. The personal V1 site remains available for rollback during stabilization.

A repository has one Pages site. The separate organization repository provides the second Pages URL needed to test Golden V2 while the original V1 continues to serve visitors.

The workflow in this public repository deploys `main` only. The personal V1 site's workflow remains separate. The Shopify Custom Liquid embed and Formspree submission endpoint are configured in Shopify, not by this repository's Pages workflow.

On GitHub Free, this repository must be public for GitHub Pages. The private archive is not used as the Pages source and is not part of this public repository's history.

## Local validation, 9 October 2026

- `npm test`: six tests passed, including Lean's one-cell layout export.
- `npm run build`: successful; existing font-path warnings remain to check in the published page.
- At that point, desktop and simulated mobile views showed Cub, Lean and Nest on the same third palette row, with all images loaded. The palette order was changed on 14 October.
- Mouse and simulated touch placement of Lean succeeded. A local quote request generated `LEAN` in the layout and module summary, €830 as its current unit amount, 47 × 42 × 42 cm and 21.5 kg in the readable details. Cloudinary was simulated in the local test; the real upload was checked later on the hosted page.

## Hosted validation, 9 October 2026

- GitHub Actions built and deployed `main` to [the new Pages URL](https://groovaly.github.io/groovaly-module-builder/) after Pages was enabled in repository settings.
- Desktop: the third palette row then showed Cub, Lean and Nest. Lean could be placed on the bottom grid row; the standalone quote JSON contained `LEAN`, a €830 estimate, one-cell layout, 47 × 42 × 42 cm and 21.5 kg. The actual Cloudinary upload returned a preview image URL.
- Mobile viewport: the grid, placed Lean, quote button and third palette row render correctly.
- The personal Golden V1 Pages URL remained available and still showed the earlier palette without Lean. At this point, the Shopify URL and trusted origin had not yet been changed.

## Live validation and handoff, 14 October 2026

- Lean and Split were swapped in the palette: the second row is Bloom, Grid, Lean, and the third row is Cub, Split, Nest.
- The live Shopify embed uses the organization Pages site. Romain and Mathieu checked the builder on desktop and mobile, then submitted a test quote with Lean. Formspree delivered the email and the Cloudinary preview image appeared in the confirmation flow.
- Romain has Owner access to the Groovaly GitHub organization and its public production repository and private archive. He confirmed that the Formspree account is his. A Cloudinary Master Admin invitation was sent to him; acceptance is still to be verified.
- The numeric module prices remain in builder JSON as informational data. The current customer-facing Shopify quote form and received email do not display those prices.
