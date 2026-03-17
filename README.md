# Blueshellsite

A static project blog for art, school, personal work, writing, and everything between them.

## What is in this repo

- A static homepage powered by `data/content.json`
- A local browser editor at `/editor/`
- A tiny Node server that lets the editor save changes directly into this repo

## Site Outline

The site is organized into four categories:

- Art
- School
- Personal
- Writing

Homepage sections:

1. Hero
2. Category overview
3. Featured posts
4. Searchable archive
5. About/contact strip

The detailed outline lives in `docs/site-outline.md`.

## Run locally

```bash
npm run dev
```

Then open:

- `http://localhost:4321/` for the public site
- `http://localhost:4321/editor/` for the local editor

## Editing workflow

1. Open the editor locally
2. Update site copy, categories, or posts
3. Click `Save all changes`
4. The editor writes to `data/content.json`
5. Commit and push the changed files for your static host

Because the public site reads the same JSON file, your local edits are already in deployable form.
