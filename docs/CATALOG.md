# Golden Age catalogue data

The builder uses these values to describe a composition in a quote request. Prices are indicative amounts in euros; the application does not collect payment. The values below were checked against the Groovaly product pages for France on 9 October 2026.

| Module | Grid width | Dimensions H × W × D | Weight | Listed price |
| --- | ---: | --- | ---: | ---: |
| [Tilt](https://groovaly.com/products/tilt) | 2 cells | 47 × 84 × 42 cm | 33.7 kg | €1,190 |
| [Chest](https://groovaly.com/products/chest) | 2 cells | 47 × 84 × 42 cm | 37.3 kg | €1,490 |
| [Bloom](https://groovaly.com/products/bloom) | 1 cell | 47 × 42 × 42 cm | 25.2 kg | €1,050 |
| [Grid](https://groovaly.com/products/grid) | 1 cell | 47 × 42 × 42 cm | 25.8 kg | €950 |
| [Split](https://groovaly.com/products/split) | 1 cell | 47 × 42 × 42 cm | 20.9 kg | €850 |
| [Cub](https://groovaly.com/products/cub) | 1 cell | 47 × 42 × 42 cm | 19.4 kg | €790 |
| [Lean](https://groovaly.com/products/lean) | 1 cell | 47 × 42 × 42 cm | 21.5 kg | €830 |
| [Nest](https://groovaly.com/products/nest) | 1 cell | 3 × 42 × 42 cm | 3.6 kg | €159 |

The numeric quote amounts are stored in `MODULE_PRICES` in `src/components/ModuleBuilder.tsx`. The module's position, width, type and feet setting are exported in the layout JSON. The readable quote text contains the composition's overall dimensions and estimated weight. The application currently adds no separate price for feet.
