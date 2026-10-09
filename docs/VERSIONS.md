# Versions and deployment

This document records the Golden Age V2 handoff started on 9 October 2026. Update the deployment status after the organization Pages preview and Shopify cutover.

## Version map

| Version | Location | Purpose and status |
| --- | --- | --- |
| Golden Age Builder V1 | Personal repository's Pages site | Current public quote builder. Keep available during the migration and for rollback. |
| Classic Builder V2 | Private Groovaly archive | Former e-commerce work and its complete Git history, retained for possible future reuse. |
| Golden Age Builder V2 | `main` in this public repository | Quote builder with Lean and current catalogue data. Hosted Pages and Shopify end-to-end checks remain release gates. |

The names “V1” and “V2” refer to the Golden Age builder here. Classic Builder V2 is a different product line. This public repository starts from a clean Golden V2 snapshot, without prior Git history. The private archive preserves that history and the Classic source for Groovaly.

## Publishing and cutover

1. Keep the personal Pages site on Golden V1 while the new site is prepared.
2. Publish this clean V2 repository from `main` through GitHub Pages. The private archive holds the earlier branches, tags and Classic Builder history.
3. Verify the new Pages URL directly and, if available, in an unpublished Shopify theme before changing the live site.
4. At cutover, update both the Shopify iframe URL and the list of trusted builder message origins. Submit a real test quote and check the module data, layout and preview image. Keep the personal V1 site available as a rollback while the new site stabilizes.

A repository has one Pages site. The separate organization repository provides the second Pages URL needed to test Golden V2 while the original V1 continues to serve visitors.

The workflow in this public repository deploys `main` only. The personal V1 site's workflow remains separate.

On GitHub Free, this repository must be public for GitHub Pages. The private archive is not used as the Pages source and is not part of this public repository's history.

## Local validation, 9 October 2026

- `npm test`: six tests passed, including Lean's one-cell layout export.
- `npm run build`: successful; existing font-path warnings remain to check in the published page.
- Desktop and simulated mobile views show Cub, Lean and Nest on the same third palette row, with all images loaded.
- Mouse and simulated touch placement of Lean succeeded. A local quote request generated `LEAN` in the layout and module summary, €830 as its current unit amount, 47 × 42 × 42 cm and 21.5 kg in the readable details. The Cloudinary response was simulated for these tests; an actual hosted quote request still needs to be checked.
