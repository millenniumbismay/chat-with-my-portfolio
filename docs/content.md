# Public portfolio content

The website uses JSON configuration for identity, social links, experience, and publications. These files are public and ship in the static site. Backend source drafts and AI approval are separate.

## Social logos and section visibility

Set URLs in `portfolio.config.json` under `profile`: `github`, `linkedin`, `scholar`, `x`, `medium`, and `email`. Empty values are omitted. Logo links have accessible names, hover labels, and keyboard focus styles; their SVGs are bundled locally. No external image service is required. See [icon attribution](../THIRD_PARTY_NOTICES.md).

`site.socialLinks` controls order and visibility:

```json
{
  "socialLinks": ["github", "linkedin", "scholar", "email"],
  "sections": {
    "experience": true,
    "publications": true,
    "projects": true,
    "blogs": true
  }
}
```

This is the `site` settings excerpt; keep your description and other settings. Supported platforms are GitHub, LinkedIn, Google Scholar, X, Medium, and email. Section flags control the homepage and shared navigation. Experience is omitted when its list is empty. Hiding the blog navigation does not remove existing article URLs.

## Experience

Edit `content/experience.json`. Its `entries` array determines display order, so keep the latest roles first. Each role can include a source link and location:

```json
{
  "id": "example-scientist",
  "role": "Research Scientist",
  "organization": "Example Lab",
  "startDate": "2024-06",
  "endDate": null,
  "location": "Remote",
  "description": "A short explanation of the work you want to share.",
  "url": "https://www.linkedin.com/in/your-name"
}
```

Dates use `YYYY-MM`. Set `endDate` to `null` for a current role. Dates are formatted consistently for visitors, and the validator rejects end dates earlier than start dates. Each entry gets an Ask about this action.

## Publications

Edit `content/publications.json`. Entries include `id`, `title`, `authors`, `venue`, `year`, `description`, and an optional paper `url` and metadata `sourceUrl`. The author matching `profile.name` is highlighted. Descriptions are concise overviews, not verbatim abstracts.

```json
{
  "id": "example-paper",
  "title": "A descriptive paper title",
  "authors": ["Your Name", "A Collaborator"],
  "venue": "Conference or journal",
  "year": "2026",
  "description": "A brief overview of the research question and approach.",
  "url": "https://example.com/paper"
}
```

Both files reference JSON Schemas in `schema/` for editor completion. IDs must be unique lowercase slugs; URLs must use HTTPS. Run `npm run check` after editing, then rebuild and deploy to update the public website.

## Imported content and forks

The current portfolio shows six LinkedIn roles and the three publications listed on the supplied Scholar profile. Paper titles, author lists, publication status, and summaries were checked against their ACL Anthology or arXiv pages. These are snapshots; re-check source pages when updating them. Citation counts are deliberately omitted.

`npm run init` backs up and clears inherited experience and publications along with AI source files. A fork starts with empty lists and its own identity; add your own entries using the schemas above. Projects and blog samples still live in `content/site.ts` and remain marked as sample content.

Showing information on the website does not automatically approve it as model context. Use Studio to select and publish what the assistant may discuss, as described in [backend setup](backend.md).
