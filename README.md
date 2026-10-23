# Chat with My Portfolio

**An AI portfolio you can talk to. Fork it and make it yours.**

Chat with My Portfolio brings your projects, publications, and writing together with an AI guide that can answer questions about the work you choose to share. Visitors can read a paper abstract, open a blog post, or ask a question about a specific project without losing the context of what they were looking at.

I started this as my own portfolio. My version uses **Baymax**, my AI alter ego. The project is being structured so anyone can use the same foundation with their own name, work, sources, assistant, and voice.

This is an early working starter. The portfolio and curated chat flow work; richer connectors and the AI experience will keep improving. This README will evolve with them.

## Make your own

Use **[this repository as a template](https://github.com/millenniumbismay/chat-with-my-portfolio/generate)** for a fresh copy, or **fork it** if you want to keep a connection to upstream changes. Clone your copy, then:

```sh
npm ci
npm run init -- --name "Alex River" --assistant "Nova" --github alex-river
npm run check
npm run dev
```

Requires **Node.js 22.13 or newer**. Open `http://127.0.0.1:8888`.

The setup command creates your configuration and clears inherited experience, publications, and AI sources. It keeps a local backup in the ignored `.portfolio/backups/` folder. Sample projects and essays remain clearly marked so you can replace them at your own pace. You can omit `--github`; without `--name`, an interactive terminal asks for your name.

You do **not** need an AI account or API key to try the design, reading pages, source studio, or demo conversation. Live answers about your own work need approved sources and a configured AI provider.

## What the portfolio includes

- A minimal, text-first homepage with About, Experience, Publications, Projects, and a link to Blogs & Thoughts.
- Accessible social logo links, with configurable URLs, order, and visibility.
- A dedicated `/blogs/` index and separate blog reading pages with direct links and browser reload support.
- A sticky writing navigation with your AI assistant available on the index and every article.
- An **Ask about this** action beside every experience entry, publication, project, and blog entry.
- A named AI assistant with a configurable role, tone, behavior, and custom prompt.
- A sticky navigation bar; the AI orb moves beside your initials as its main prompt scrolls away.
- Light and Palenight-inspired dark themes, with a navigation toggle and a saved per-portfolio preference. The first visit follows the device’s color scheme.
- A source studio with optional protected backend storage and publication for reviewed AI knowledge.
- GitHub summary imports, selected LinkedIn text, Google Scholar public-profile/CSV imports, and manual sources.
- Static output for GitHub Pages, plus a Cloudflare Worker for live chat.
- Configuration validation, TypeScript checks, automated tests, and GitHub Actions.

The current biography, experience, and publication list are populated from the supplied profiles and checked publication sources. Project and blog examples remain clearly marked as samples.

## One configuration, your own identity

Edit **[`portfolio.config.json`](portfolio.config.json)**. This file drives both the interface and the assistant. Names and personality settings are not scattered through component files.

Here is part of the configuration:

```json
{
  "profile": {
    "name": "Alex River",
    "firstName": "Alex",
    "initials": "AR"
  },
  "assistant": {
    "name": "Nova",
    "role": "AI research guide",
    "tone": "clear, curious, and encouraging",
    "behavior": [
      "Explain technical ideas using concrete examples.",
      "Keep answers short unless the visitor asks for more detail."
    ],
    "prompt": "Help visitors understand my research methods and the decisions behind my projects."
  }
}
```

This is an excerpt, not a complete replacement file. [`portfolio.config.example.json`](portfolio.config.example.json) contains a complete generic configuration. A JSON Schema provides editor hints, and `npm run validate` catches missing or invalid settings before a build.

The same assistant name appears in the main button, navigation, article actions, conversation, identity replies, and live model instructions. Tone, behavior, and the custom prompt are sent to either supported model provider. Basic greetings and name recognition also work in demo mode.

The default instructions keep the assistant clearly identified as AI, distinguish its own voice from your real-world experience, and require approved references for personal facts. Your custom prompt shapes its focus and behavior; the default source-grounding rules remain part of the assembled prompt.

**Configuration is public.** Do not put credentials, private instructions, or confidential information in it. Provider tokens belong in `.env` locally and hosting secrets in production.

See [all configuration options](docs/configuration.md).

## Add your work and keep it current

Public presentation content and AI knowledge use separate paths:

| File                        | What it controls                                                                          |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| `portfolio.config.json`     | Your identity, bio, links, interests, assistant, source settings, and deployment defaults |
| `content/site.ts`           | Projects and blog entries displayed on the website                                        |
| `content/experience.json`   | Public roles, organizations, dates, locations, and descriptions                           |
| `content/publications.json` | Public papers, author lists, venues, overviews, and links                                 |
| `content/knowledge.json`    | File fallback for reviewed AI references before a database snapshot is published          |

New items added to the public content files appear after a rebuild and deployment. See [content configuration](docs/content.md) for social icons, section visibility, experience, and papers. Blog pages are generated from their IDs. The assistant's knowledge is updated separately through reviewed sources; displaying an item on the website does not automatically approve it for AI answers.

For AI updates with the backend:

1. Run `npm run backend:init`, then start the local server.
2. Open `/studio/` and load the server draft with the owner token from `.env`.
3. Import selected LinkedIn text or Scholar publication metadata (public fetch or CSV export), add notes, and review entries.
4. Select only what visitors may ask about. New and changed imports remain excluded.
5. Save the server draft, then publish saved selections. The assistant updates without a rebuild.

For a deployment without a database, export selected knowledge to `content/knowledge.json` and redeploy the Worker. Studio drafts also stay in the current browser; the owner token stays only in tab memory. Saving a server draft does not change the live assistant until publication. The configured owner name remains authoritative.

See [local backend setup, Cloudflare D1 deployment, and API details](docs/backend.md). The reusable template ships with an empty source seed. Imported material stays in the owner database until explicitly published; it is not added to the public repository.

Approved references are public through `/api/knowledge`. An excluded entry is withheld from model requests and that endpoint, but exclusion does not make a committed file private. Keep private drafts and credentials outside a public repository.

See [sources, approval, and future connectors](docs/sources.md).

## How the AI works today

```text
Your selected sources
        ↓
Review and explicit approval
        ↓
Published knowledge snapshot (database or file fallback)
        ↓
Relevant references + your assistant's configured persona
        ↓
Server-side model call
        ↓
Answer with the supplied reference links
```

This is a configurable assistant using retrieved context, not a model trained to become you. It can discuss the sources you supply and acknowledge gaps. It does not gain access to your private accounts just because their profile links are on the page.

The initial retrieval approach is deliberately small: keyword ranking, at most six references, and a bounded context budget. It needs no vector database. Larger archives may benefit from document chunking and semantic retrieval later.

Supported providers are **Cloudflare Workers AI** and the **OpenAI Responses API**. Pick one in `ai.provider`; model names are configurable too. There is no automatic switch to another paid provider if a request fails.

## Sources: working now and planned

| Source                | Current support                                                                                                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub                | Import up to 100 recently updated public repository summaries; exclude forks and archived repositories; select entries before export. READMEs and code are not imported yet.              |
| Manual sources        | Add chosen background, notes, blog text, project context, and paper abstracts with optional source URLs.                                                                                  |
| Medium / RSS          | Planned adapter; not connected yet.                                                                                                                                                       |
| General URLs / papers | Manual text and link entry today; automatic fetching is planned.                                                                                                                          |
| LinkedIn              | Working selected-text import with profile URL and provenance. Full-profile OAuth and post syncing are not implemented; sign-in alone is not a complete import.                            |
| Google Scholar        | Working public-profile metadata import (up to 100 articles) with CSV fallback (up to 500 rows). Scholar may block fetching. Full papers, abstracts, and citation counts are not imported. |
| X / Twitter           | Planned optional connector; API access and cost need to be considered.                                                                                                                    |

A source-adapter interface already lives in `src/sources/`. New adapters produce excluded drafts, so imports remain separate from approval and publication. The owner backend uses a server-only access token, SQLite locally, and optional Cloudflare D1 in production. Third-party OAuth account connections, account-token storage, and scheduled refreshes remain future work.

## Run and check the project

| Command                | Purpose                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| `npm run init`         | Set up a new owner's configuration and clear inherited AI knowledge                                           |
| `npm run backend:init` | Generate a local owner token in ignored `.env` for the persistent source backend                              |
| `npm run dev`          | Build, serve locally, and rebuild/restart when source or content changes; refresh the browser after a rebuild |
| `npm run build`        | Validate and build the static site, Worker, and file previews                                                 |
| `npm start`            | Serve the existing Worker build on localhost                                                                  |
| `npm run validate`     | Check config and knowledge shapes                                                                             |
| `npm run typecheck`    | Run TypeScript checks                                                                                         |
| `npm test`             | Test the existing build and a different owner's configuration without real AI calls                           |
| `npm run check`        | Run validation, TypeScript, build, and tests together                                                         |
| `npm run deploy`       | Build and publish the Worker to your Cloudflare account                                                       |

Use `.env.example` as a reference for local credentials; preserve `.env` if `backend:init` has already created it. The build and local server load it; environment variables already set in your shell take precedence. Change `PORT` to use a port other than 8888.

Build output:

- `dist/pages/`: static files for GitHub Pages or another static host.
- `dist/server/index.js`: the portable Worker with page and API handlers.
- `preview/index.html`: a file preview you can open without a server. It uses illustrative replies.
- `.portfolio/wrangler.json`: generated Cloudflare configuration using your worker name, models, and allowed origins. It contains no provider tokens.

## Hosting

### GitHub Pages + a small AI backend

The portfolio can live at `https://<username>.github.io` or `https://<username>.github.io/<repository>/`. GitHub Pages serves static files. Live model calls run in a separate Worker to keep the API key off the page.

1. In repository **Settings → Pages**, select **GitHub Actions**.
2. Run the **Publish portfolio to GitHub Pages** workflow from the Actions tab.
3. For live chat, deploy the Worker, add your GitHub Pages origin to `deployment.allowedOrigins`, and set the repository variable `PORTFOLIO_API_URL` to the Worker origin.
4. Run the Pages workflow again to connect the frontend.

Without a backend URL, the static site uses demo replies. Publishing is manually triggered by default; ordinary pushes run checks without publishing a website.

### Everything on Cloudflare

The Worker can also serve both the portfolio and chat, so you can use a single host. Its generated configuration comes from your portfolio settings. Run `npm run build` before setting secrets:

```sh
npx wrangler login
npm run build
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID --config .portfolio/wrangler.json
npx wrangler secret put CLOUDFLARE_AI_TOKEN --config .portfolio/wrangler.json
npm run deploy
```

For OpenAI, choose `openai` in `ai.provider` and set the `OPENAI_API_KEY` secret instead. Provider accounts and keys are yours; forks do not inherit the original author's credentials or hosting identity.

Both hosting approaches can fit free allowances for light usage, but live AI is subject to provider availability, limits, and pricing. There is no unlimited-chat promise or hard monetary cap in this application. Check [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/), and your chosen provider's current rates.

See [deployment details](docs/deployment.md).

## Project structure

```text
portfolio.config.json          Your public configuration
portfolio.config.example.json  Generic starting point for a new owner
content/                       Portfolio content and approved AI knowledge
schema/                        Configuration schema for editors
src/
  ui/                          Portfolio, articles, studio, and styles
  components/                  Shared UI and the docking AI orb
  client/                      Hydration, API routing, and file-preview behavior
  server/                      Worker and HTTP route handlers
  lib/                         Persona, retrieval, provider adapters, and origin checks
  sources/                     GitHub, LinkedIn selected-text, and Scholar adapters
migrations/                    Cloudflare D1 / local SQLite schema
scripts/                       Setup, validation, build, dev server, and tests
docs/                          Configuration, sources, and deployment guides
.github/workflows/             CI and optional Pages publication
```

The file-only flow needs no database. The optional owner backend adds SQLite locally or Cloudflare D1 in production, durable drafts, and live publication. It uses one owner token rather than a multi-user account system. Public website content and configuration still rebuild from versioned files.

## Where this is going

- More convenient source-link imports, starting with RSS and public writing.
- Richer import previews and change comparison; basic review of changed imports is already supported.
- Better retrieval and more precise references as the knowledge base grows.
- Third-party OAuth account connectors and scheduled refreshes; owner draft storage and live publishing are already implemented.
- More control over personality and a more natural conversational experience.

Those are directions, not features already available. The immediate aim is a useful foundation that people can understand, fork, and extend.

## Contribute or build your own

If this fits what you want from a personal site, **use the template and make it yours**. Change the assistant's name, give it a different voice, add your work, and share what you build.

Issues and focused pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow. Improvements to source adapters, accessibility, retrieval, documentation, and onboarding are especially useful at this stage.

The source code is released under the [MIT license](LICENSE). Respect the ownership and sharing terms of any real writing, papers, or other material you add to your own instance.
