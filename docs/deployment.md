# Deployment

## Local

```sh
npm ci
# Copy .env.example only if you do not already have .env.
npm run backend:init
npm run check
npm run dev
```

The default URL is `http://127.0.0.1:8888`. The dev command rebuilds and restarts the server after source/content changes; refresh the page to see them. This is not a hot-module-replacement server.

The first build validates configuration and knowledge, prerenders pages, bundles the browser app and Worker, and generates `.portfolio/wrangler.json`. The generated directory and `.env` are ignored by Git.

## One Cloudflare deployment

Set your worker name in `portfolio.config.json`. Choose a provider and models there too. Then:

```sh
npx wrangler login
npm run build
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID --config .portfolio/wrangler.json
npx wrangler secret put CLOUDFLARE_AI_TOKEN --config .portfolio/wrangler.json
npm run deploy
```

To use OpenAI, choose `openai` in `ai.provider` and set `OPENAI_API_KEY` instead. A paid provider is not needed for demo mode. Requests that require live generation fail clearly when credentials are missing; basic identity replies work without a model call.

The tracked `wrangler.portfolio.jsonc` is a generic reference. The normal deploy command uses the generated file, whose name, models, and origins come from your configuration. Do not manually edit generated output.

## GitHub Pages with a Worker API

1. Enable GitHub Pages in your repository, with **GitHub Actions** as the source.
2. Use a repository named `<username>.github.io` for the account-root address, or any project repository for `<username>.github.io/<repository>/`.
3. Deploy your Worker and add the frontend origin to `deployment.allowedOrigins`, for example `https://alex-river.github.io`. Do not include a repository path or trailing slash.
4. In repository **Settings → Secrets and variables → Actions → Variables**, add `PORTFOLIO_API_URL` with the Worker origin.
5. Run the **Publish portfolio to GitHub Pages** workflow.

Only `dist/pages` is uploaded. Provider tokens and the Worker bundle do not belong in the Pages artifact. Relative article/studio links support both root and repository addresses. Requests to the Worker use a CORS origin allowlist. CORS is browser request policy, not owner authentication or a substitute for an abuse/spending limit.

If `PORTFOLIO_API_URL` is empty, static hosting uses the explicitly labelled demo mode. The Pages workflow is manual by default; the separate CI workflow checks pushes and pull requests without publishing.

## Updates

- Edit public content or config, run `npm run check`, and commit the changes.
- Rebuild/deploy the website to publish public content changes.
- With the owner backend, save and publish reviewed selections directly; no Worker rebuild is needed. Otherwise, export reviewed studio sources into `content/knowledge.json`, then rebuild/deploy the Worker to update live answers.
- For an identity change on a split deployment, rebuild both the frontend and the Worker.

For durable drafts and protected live publishing, follow [backend setup](backend.md): create D1, configure its UUID, apply migrations, and set ADMIN_TOKEN. Automatic source refresh and authenticated third-party account connections are not implemented.

## Costs and verification

GitHub Pages and Cloudflare have free allowances, with limitations. AI usage depends on the selected model, context, output, and provider. Check current [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) and [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

The app includes bounded requests/context/output and best-effort per-isolate throttling. It does not enforce a distributed user quota or monetary cap. Configure provider spending controls and platform rate limits appropriate to your traffic before enabling paid public inference.

CI checks configuration, TypeScript, the build, source approval, routing, origin handling, mocked providers, and an alternate owner's configuration. These checks do not replace live model evaluation or visual testing of the browser interactions.
