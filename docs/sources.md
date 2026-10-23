# Sources and updates

The website and the assistant have separate, explicit publication paths. Edit `content/site.ts` for visible projects, papers, and blog pages. Update `content/knowledge.json` for what the assistant may discuss. Both changes become live after their respective build and deployment.

## Current workflow

Studio keeps a browser draft and can connect to the protected owner backend. New imports and edited entries are excluded until checked. Save the server draft, then publish saved selections to update the assistant without a rebuild. The file-export workflow is still available. See [backend setup and API](backend.md).

Reimporting GitHub currently adds new repositories and preserves existing entries. It does not synchronize changes to previously imported descriptions. There is no background refresh or automatic account connection yet.

A source entry contains:

```json
{
  "id": "project-parser-notes",
  "title": "Parser design notes",
  "kind": "project",
  "sourceId": "manual",
  "text": "The reviewed explanation you want the assistant to use.",
  "url": "https://example.com/project",
  "approved": true
}
```

`sourceId` and `updatedAt` are optional provenance fields. IDs must be unique. Text is limited to 20,000 characters per entry, and the file to 500 entries. The model receives only a bounded subset for a question. Keep a useful explanation of each project, including your role, decisions, outcomes, and limitations when those are appropriate to share.

## Add a source adapter

1. Implement the `SourceAdapter` contract in `src/sources/types.ts`.
2. Add the implementation under `src/sources/` and register it in `index.ts`.
3. Return normalized entries with stable IDs, source links, and `approved: false`.
4. Add the server route and studio interaction needed for the source, and extend configuration/schema validation if it has settings.
5. Test import failure, limits, deduplication, approval, and excluded-source behavior. Mock external services in tests.

The GitHub, LinkedIn, and Scholar adapters are working examples. LinkedIn accepts chosen profile text; Scholar supports its first public page (up to 100 articles) or a CSV export (up to 500 rows). Blocked Scholar requests report an export fallback. No full paper text, abstracts, citation counts, or detailed LinkedIn OAuth access are imported. Profile imports use stable IDs: unchanged text keeps its selection and changed text needs review again. Missing entries remain for manual review. Public content cards in content/site.ts are updated separately.

The GitHub adapter fetches public summaries and intentionally does not authenticate visitors or request private repository access.

RSS, general web pages, scheduled refreshes, and authenticated third-party account connections are future work. The owner backend already supports durable drafts and publication with an owner token. Authenticated integrations need an owner-only flow and secure server-side credential storage. Do not put tokens in the public configuration, browser local storage, or committed source files.

## What “approved” means

Only published selections are available to the assistant; saving an approved draft does not publish it. Unpublished database drafts require the owner token. Approval selects information for the assistant. It is not access control for a public Git repository. `/api/knowledge` exposes the approved text, and the selected context is sent to your configured AI provider when a live answer is requested.

Do not commit confidential drafts with `approved: false` and assume they are private. Keep private source material outside the public checkout. If you add an automated refresh later, new or changed material should pass review again before publication.
