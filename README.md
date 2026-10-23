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

The setup command creates your configuration and clears the inherited AI sources. It keeps a local backup in the ignored `.portfolio/backups/` folder. Sample projects and essays remain clearly marked so you can replace them at your own pace. You can omit `--github`; without `--name`, an interactive terminal asks for your name.

You do **not** need an AI account or API key to try the design, reading pages, source studio, or demo conversation. Live answers about your own work need approved sources and a configured AI provider.

## What the portfolio includes

- A minimal, text-first homepage with About, Publications, Projects, and a link to Blogs & Thoughts.
- A dedicated `/blogs/` index and separate blog reading pages with direct links and browser reload support.
- A sticky writing navigation with your AI assistant available on the index and every article.
- An **Ask about this** action beside every publication, project, and blog entry.
- A named AI assistant with a configurable role, tone, behavior, and custom prompt.
- A sticky navigation bar; the AI orb moves beside your initials as its main prompt scrolls away.
- Light and Palenight-inspired dark themes, with a navigation toggle and a saved per-portfolio preference. The first visit follows the device’s color scheme.
- A source studio for reviewing the material your assistant can use.
- GitHub repository-summary imports and manually added professional background, paper abstracts, writing, and notes.
- Static output for GitHub Pages, plus a Cloudflare Worker for live chat.
- Configuration validation, TypeScript checks, automated tests, and GitHub Actions.

The current content is illustrative. The repository is not a claim that the sample essays, projects, or publication belong to a real research record.

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

There are two content paths:

| File                     | What it controls                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `portfolio.config.json`  | Your identity, bio, links, interests, assistant, source settings, and deployment defaults |
| `content/site.ts`        | Projects, publications, and blog entries displayed on the website                         |
| `content/knowledge.json` | Reviewed reference material available to the assistant                                    |

New items added to `content/site.ts` appear after a rebuild and deployment. Blog pages are generated from their IDs. The assistant's knowledge is updated separately through reviewed sources; displaying an item on the website does not automatically approve it for AI answers.

For AI updates:

1. Open `/studio/`.
2. Import public GitHub repository summaries, or add selected source text and its link.
3. Review the entries. New imports and edited entries start excluded.
4. Check only the entries you want visitors to ask about.
5. Export the selected knowledge and replace `content/knowledge.json`.
6. Turn off demo replies when your real sources and provider are ready, then rebuild and redeploy the Worker.

Studio drafts stay in the current browser. **They do not update the live assistant until exported and deployed.** The owner name comes from configuration; changing an imported knowledge file cannot rename the portfolio.

Approved references are public through `/api/knowledge`. An excluded entry is withheld from model requests and that endpoint, but exclusion does not make a committed file private. Keep private drafts and credentials outside a public repository.

See [sources, approval, and future connectors](docs/sources.md).

## How the AI works today

```text
Your selected sources
        ↓
Review and explicit approval
        ↓
Published knowledge file
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

| Source                | Current support                                                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub                | Import up to 100 recently updated public repository summaries; exclude forks and archived repositories; select entries before export. READMEs and code are not imported yet. |
| Manual sources        | Add chosen background, notes, blog text, project context, and paper abstracts with optional source URLs.                                                                     |
| Medium / RSS          | Planned adapter; not connected yet.                                                                                                                                          |
| General URLs / papers | Manual text and link entry today; automatic fetching is planned.                                                                                                             |
| LinkedIn              | Selected text today. Full profile and post access depends on appropriate platform permissions; sign-in alone is not a complete import.                                       |
| X / Twitter           | Planned optional connector; API access and cost need to be considered.                                                                                                       |

A source-adapter interface already lives in `src/sources/`. New adapters produce excluded drafts, so imports remain separate from approval and publication. Account connections, token storage, scheduled refreshes, and owner authentication are not implemented in this version.

## Run and check the project

| Command             | Purpose                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `npm run init`      | Set up a new owner's configuration and clear inherited AI knowledge                                           |
| `npm run dev`       | Build, serve locally, and rebuild/restart when source or content changes; refresh the browser after a rebuild |
| `npm run build`     | Validate and build the static site, Worker, and file previews                                                 |
| `npm start`         | Serve the existing Worker build on localhost                                                                  |
| `npm run validate`  | Check config and knowledge shapes                                                                             |
| `npm run typecheck` | Run TypeScript checks                                                                                         |
| `npm test`          | Test the existing build and a different owner's configuration without real AI calls                           |
| `npm run check`     | Run validation, TypeScript, build, and tests together                                                         |
| `npm run deploy`    | Build and publish the Worker to your Cloudflare account                                                       |

Copy `.env.example` to `.env` for local credentials. The build and local server load it; environment variables already set in your shell take precedence. Change `PORT` to use a port other than 8888.

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
  sources/                     Import-adapter contract, registry, and GitHub adapter
scripts/                       Setup, validation, build, dev server, and tests
docs/                          Configuration, sources, and deployment guides
.github/workflows/             CI and optional Pages publication
```

There is no database, user-account system, or always-running server to provision for the current flow. The public portfolio and AI both rebuild from versioned files.

## Where this is going

- More convenient source-link imports, starting with RSS and public writing.
- Reviewable updates that preserve previous selections and show what changed.
- Better retrieval and more precise references as the knowledge base grows.
- Protected owner workflows for real account connections and live publishing.
- More control over personality and a more natural conversational experience.

Those are directions, not features already available. The immediate aim is a useful foundation that people can understand, fork, and extend.

## Contribute or build your own

If this fits what you want from a personal site, **use the template and make it yours**. Change the assistant's name, give it a different voice, add your work, and share what you build.

Issues and focused pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow. Improvements to source adapters, accessibility, retrieval, documentation, and onboarding are especially useful at this stage.

The source code is released under the [MIT license](LICENSE). Respect the ownership and sharing terms of any real writing, papers, or other material you add to your own instance.
