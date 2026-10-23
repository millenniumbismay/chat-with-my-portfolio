# Configuration

`portfolio.config.json` is the public source of truth for identity and behavior. The example file shows the complete shape. Keep `schemaVersion: 1`; the `$schema` reference enables editor completion. Run `npm run validate` before publishing.

| Section                      | Fields and behavior                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                         | A lowercase slug that namespaces browser drafts, theme preference, and database state. Give a fork its own ID.                                                                                                            |
| `profile`                    | Name, first name, initials, sample flag, tagline, bio, background, email, profile links, and interests. URLs must use HTTPS. The `sample` flag identifies illustrative profile content in the UI.                         |
| `site`                       | Metadata, social logo order in `socialLinks`, section visibility in `sections`, and `showStudioLink`. Hiding the studio link is cosmetic; `/studio/` remains reachable; backend draft operations require the owner token. |
| `assistant.name`             | Drives the CTA, chat title, greetings, name recognition, and live persona. No other code edit is needed.                                                                                                                  |
| `assistant.role`             | The assistant's description, such as “AI assistant and alter ego” or “AI research guide.” It must remain understandable as AI.                                                                                            |
| `assistant.tagline`          | Short description beside the homepage chat prompt.                                                                                                                                                                        |
| `assistant.tone`             | Natural-language voice guidance, such as “precise, friendly, and concise.”                                                                                                                                                |
| `assistant.behavior`         | A list of instructions about answer structure, follow-ups, explanations, or humor.                                                                                                                                        |
| `assistant.prompt`           | Your own directions for the assistant's focus. This is added to the server's persona instructions.                                                                                                                        |
| `assistant.starterQuestions` | One to six suggested questions, also used by the surprise-question button.                                                                                                                                                |
| `sources.github`             | Enable/disable the GitHub importer and prefill a username. This does not connect a private account.                                                                                                                       |
| `sources.linkedin`           | Enable/disable chosen-text imports and prefill a LinkedIn profile URL.                                                                                                                                                    |
| `sources.scholar`            | Enable/disable public-profile or CSV publication imports and prefill a Scholar URL.                                                                                                                                       |
| `sources.manual`             | Enable/disable adding source text manually in the studio.                                                                                                                                                                 |
| `ai`                         | Default provider (`cloudflare` or `openai`) and each provider's model name. Server environment variables can override defaults.                                                                                           |
| `deployment`                 | Your Worker name, optional D1 database UUID in `databaseId`, and a list of allowed frontend origins. Origins must be exact HTTPS origins without paths or trailing slashes.                                               |

Example behavior settings:

```json
{
  "tone": "friendly, direct, and technically precise",
  "behavior": [
    "Begin with a short answer, then explain the reasoning.",
    "Offer a concrete example when introducing a technical idea.",
    "Ask a follow-up only when needed to answer the question."
  ],
  "prompt": "Help visitors explore my research on developer tools. Explain why I made particular design decisions when the selected sources describe them."
}
```

The custom prompt is public configuration. Do not use it to store secrets or private background. The assembled prompt adds the assistant's identity, your chosen behavior, your custom instructions, and the approved references. Source-grounding and AI transparency remain part of the default prompt.

Changing settings requires a rebuild. For a split deployment, rebuild both the Pages frontend and the Worker so their identities stay synchronized. `content/knowledge.json` retains an `ownerName` field for export compatibility, but the app takes the actual owner name from the configuration.

## Environment variables

Local commands load `.env` if present. The shell takes precedence over that file. The model adapter then uses configured defaults when the corresponding environment variable is blank or absent.

| Variable                | Purpose                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `LLM_PROVIDER`          | Optional override for `ai.provider`                                                                           |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account for AI requests                                                                            |
| `CLOUDFLARE_AI_TOKEN`   | Server-only Workers AI credential                                                                             |
| `CLOUDFLARE_AI_MODEL`   | Optional Cloudflare model override                                                                            |
| `OPENAI_API_KEY`        | Server-only OpenAI credential                                                                                 |
| `OPENAI_MODEL`          | Optional OpenAI model override                                                                                |
| `PORTFOLIO_API_URL`     | Build-time public backend origin for a static frontend; never a credential                                    |
| `ALLOWED_ORIGIN`        | Server-side comma-separated origin override; the generated Worker uses `deployment.allowedOrigins` by default |
| `PORT`                  | Local preview port; default 8888                                                                              |

Configuration validation enforces bounded text, explicit source approval, safe source URLs, and nonempty starter questions. Model output still requires evaluation: passing a configuration check is not proof that every model will follow every behavioral instruction.

The `profile.scholar` field adds a public Google Scholar link. Source URLs must be supported LinkedIn or Scholar profile addresses. Keep `deployment.databaseId` blank until you create a Cloudflare D1 database; local development uses SQLite automatically. See [backend setup](backend.md). Existing configs need the new `sources.linkedin` and `sources.scholar` blocks from the example.

Public experience and publications are editable JSON datasets with separate schemas. See [content configuration](content.md). `site.socialLinks` and `site.sections` are required; copy their complete blocks from the example when updating an older config. Optional X and Medium URLs use `profile.x` and `profile.medium`.
