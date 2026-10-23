# Source backend

The Worker now has an optional persistent owner backend: SQLite locally and Cloudflare D1 in production. GitHub Pages can still serve the portfolio with API calls sent to the Worker.

## Local setup

```sh
npm ci
npm run backend:init
npm run check
npm run dev
```

Open `http://127.0.0.1:8888/studio/`. Read `ADMIN_TOKEN` from your ignored `.env`, enter it in the Owner backend panel, and click **Load server draft**. Loading replaces the browser draft. The token stays in tab memory, never browser storage or the client bundle. Restart the server after changing `.env`.

SQLite is stored in `.portfolio/<config.id>.sqlite`; its schema is applied automatically. Keep this directory to retain sources between restarts. A new portfolio ID selects separate database state. `npm run init` clears inherited source seed files and creates a new ID for a new owner.

The first owner load can seed the database from `content/source-drafts.json` only if its owner matches configuration. The distributed seed is empty. Keep working imports in the protected database; committing an imported payload to a public repository exposes it even when its entries are unselected. Review and publish through Studio when ready.

## Connect, review, and publish

1. Configure `sources.linkedin.url` and `sources.scholar.url`, or enter URLs in Studio.
2. **LinkedIn:** paste only the About, experience, education, projects, or authored posts you want to include. This is a selected-text import, not an OAuth connection. Standard LinkedIn sign-in access does not provide a full work-history/post archive. See [documented scopes](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2).
3. **Scholar:** try **Fetch publications**. The adapter fetches the first public page, up to 100 articles, without redirects. A block, rate limit, or challenge produces an error and an export fallback; there is no bypass.
4. For the fallback, select publications on your Scholar profile, choose **Export → CSV**, and import the file. Up to 500 rows and 750 KB are supported. See [Scholar’s export help](https://scholar.google.com/intl/en/scholar/citations.html).
5. Select what the assistant may use. New or changed imports are excluded; unchanged text retains existing selections. Absent entries remain for manual review.
6. **Save server draft** persists your working copy without changing the public assistant.
7. **Publish saved selections** atomically replaces public knowledge without a rebuild. An empty selection revokes every source. Turn the demo checkbox off for grounded live answers.

Scholar imports contain publication metadata, not paper bodies, abstracts, or verified contribution statements. CSV imports do not verify that the supplied profile owns the exported papers. Review authors and provenance. Source imports do not connect an AI provider; live generation still needs your chosen provider’s credentials.

The file workflow remains supported. Without a database, or before the first server publication, the assistant uses `content/knowledge.json`. A published database snapshot takes precedence afterward. Editing a file or draft does not overwrite that snapshot.

## Cloudflare deployment

```sh
npx wrangler login
npx wrangler d1 create your-name-portfolio
```

Copy the database UUID into `deployment.databaseId`. Then:

```sh
npm run build
npx wrangler d1 migrations apply PORTFOLIO_DB --remote --config .portfolio/wrangler.json
npx wrangler secret put ADMIN_TOKEN --config .portfolio/wrangler.json
# Set your chosen AI provider's secrets; see deployment.md.
npm run deploy
```

Use a random owner token of at least 32 characters; the local setup command generates one. Wrangler prompts for the production secret. The generated binding is `PORTFOLIO_DB`; migrations live in `migrations/`. Each fork needs its own database and secrets.

For GitHub Pages, set the build variable `PORTFOLIO_API_URL` to the Worker origin and add the Pages origin to `deployment.allowedOrigins`. Owner CORS supports Authorization and PUT. Use HTTPS in production. Configuration contains public URLs and database identity, never credentials.

## API

| Method | Route                        | Behavior                                                         |
| ------ | ---------------------------- | ---------------------------------------------------------------- |
| GET    | `/api/knowledge`             | Public published references, or file fallback before publication |
| POST   | `/api/chat`                  | Chat using published database sources when available             |
| GET    | `/api/admin/knowledge`       | Owner draft, revision, and last publication time                 |
| PUT    | `/api/admin/knowledge`       | Save `{revision, draft}` with optimistic concurrency             |
| POST   | `/api/admin/publish`         | Publish `{revision}` from the saved draft                        |
| POST   | `/api/admin/import/linkedin` | Prepare excluded entries from `{url, text}`                      |
| POST   | `/api/admin/import/scholar`  | Fetch `{url}`, or import `{url, text, format: "csv"}`            |

Every admin route requires `Authorization: Bearer <ADMIN_TOKEN>`. Unconfigured backend: 503; invalid token: 401; stale revision: 409. Admin JSON bodies are limited to 1 MB. Drafts allow 500 entries, each with a unique ID, bounded text, explicit approval, and an HTTPS source URL or empty URL. Responses use `Cache-Control: no-store`.

This is a single-owner token workflow, not a multi-user account system. Database drafts are protected through the API, but committing them to a public repository still exposes them. Browser drafts remain local to that browser.

## Verification and limits

`npm run check` includes backend tests against real temporary SQLite databases: authentication, CORS, save/publish separation, revision conflicts, restart persistence, revocation, model-context exclusion, URL validation, CSV parsing, blocked Scholar responses, and import review rules. External services are mocked.

Throttling is best-effort per isolate, not a distributed abuse limiter or monetary cap. Automatic refresh, full LinkedIn OAuth imports, embeddings, background jobs, and third-party account-token storage remain future work.
