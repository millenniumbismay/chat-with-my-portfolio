# Contributing

Fork the repository, install dependencies with `npm ci`, and run `npm run dev`. Keep changes focused and run `npm run check` before opening a pull request.

The main boundaries are:

- Owner/assistant settings belong in `portfolio.config.json`, not components.
- Portfolio material belongs in `content/`; do not add real private sources to examples or fixtures.
- New source adapters belong in `src/sources/` and return excluded drafts. Account access and publication need explicit owner flows.
- Provider credentials stay server-side. Do not commit `.env`, tokens, generated build state, or hosting project IDs.
- Tests use mocked external services and must not make real paid AI calls.

If you add a configuration field, update the example, schema, runtime validation, documentation, and fork-configuration tests. If you add a connector, include its actual access/refresh limitations in the sources guide.

Accessibility, a readable mobile layout, reduced-motion support, and the minimal visual direction are part of the project. Please include a short before/after explanation and relevant verification when changing the UI.

For larger changes, open an issue describing the problem and proposed behavior before starting. Documentation fixes and small focused improvements can go straight to a pull request.
