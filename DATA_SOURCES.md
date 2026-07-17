# Data Sources

## Current dataset

- Dataset name: Palworld Companion Paldeck import
- Original URLs:
  - https://api.paldeck.cc/pals
  - https://palworld.th.gl/guides/Lamball
  - https://cdn.th.gl/palworld/version.json
- Licence: Paldeck.cc is a fan-made project and is not affiliated with Pocketpair. Review upstream terms before redistributing bulk data outside this personal GitHub Pages project.
- Date retrieved: 2026-07-17
- Game version: Verification required
- Transformations made: Imported Pal names, Paldeck numbers, icon URLs, elements, descriptions, partner skills, work suitability levels, and Pal drop resources from Paldeck pages using `scripts/import-paldeck-data.ps1`. Assigned local unique numeric IDs so variant Pals such as `5B` do not share collection state. Decoded TH.GL Palpagos Island map node data with `scripts/enrich-habitats.mjs` to add spawn marker counts, source guide links, and sampled map coordinates for matching Pals.
- Known missing information: Exact day/night restrictions, breeding combinations, recipes, non-Pal resource acquisition methods, resource uses, and some special flags still need separate verified imports. Missing information remains visibly labelled rather than invented.

## Data policy

Do not add third-party Palworld data unless its licence and freshness are checked. Missing values should remain empty, `null`, `unknown`, or visibly marked as unavailable.
