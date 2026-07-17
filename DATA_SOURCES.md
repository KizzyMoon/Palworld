# Data Sources

## Current dataset

- Dataset name: Palworld Companion Paldeck import
- Original URLs:
  - https://api.paldeck.cc/pals
- Licence: Paldeck.cc is a fan-made project and is not affiliated with Pocketpair. Review upstream terms before redistributing bulk data outside this personal GitHub Pages project.
- Date retrieved: 2026-07-17
- Game version: Verification required
- Transformations made: Imported Pal names, Paldeck numbers, icon URLs, elements, descriptions, partner skills, work suitability levels, and Pal drop resources from Paldeck pages using `scripts/import-paldeck-data.ps1`. Assigned local unique numeric IDs so variant Pals such as `5B` do not share collection state.
- Known missing information: Habitat, breeding, recipes, non-Pal resource acquisition methods, resource uses, and some special flags still need separate verified imports. Missing information remains visibly labelled rather than invented.

## Data policy

Do not add third-party Palworld data unless its licence and freshness are checked. Missing values should remain empty, `null`, `unknown`, or visibly marked as unavailable.
