## Current task

The LinkedIn browser-harness foundation is committed on `dev` (efc0b0c, `tools/linkedin-harness/`); next session builds the card-walker that iterates the job cards within a stream and extracts each card's content.

## Open decisions

- Build the card-walker as more scripts inside `tools/linkedin-harness/`, or as the separate complementary triage skill the plugin spec §215 anticipates.
- Sequence next: the card-walker first, or the plugin restructure (`src/`, `preprocess.awk`, `plugin.json`, writing D-33–D-36) before it.
- Durable selector handles for the walker are already recorded in `tools/linkedin-harness/DESIGN.md` (stream map): cards via `getByRole('main')` list, identity via the `/jobs/collections/<slug>/` href segment.
