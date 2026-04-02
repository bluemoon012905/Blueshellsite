# Blueshellsite

A small content-driven site for art, school, personal work, writing, and everything between them.

https://yuda.work/
## What is in this repo

- A static public site powered by `data/content.json`
- Standalone pages for the homepage, category views, post views, and about/contact
- A local browser editor at `/editor/`
- A tiny Node server for local development and saving editor changes back into the repo
 
## How it is built

- Plain HTML, CSS, and vanilla JavaScript
- No framework, bundler, or database
- One shared content source in `data/content.json`
- A small local server in `server.js`

`npm run dev` starts the Node server, serves the site files directly, exposes `GET /api/content` and `POST /api/content`, and writes validated editor changes back to `data/content.json`.

## Repo structure

- `index.html` renders the public homepage shell
- `assets/app.js` fetches `data/content.json` and renders homepage sections
- `assets/styles.css` contains the shared site styling
- `post/index.html` renders individual post pages
- `category/index.html` renders category archive pages
- `about/index.html` renders the about/contact page
- `editor/index.html`, `editor/editor.js`, and `editor/editor.css` power the local editor
- `data/content.json` stores all editable site content
- `docs/site-outline.md` documents the intended site structure

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
6. Optional custom homepage panels from the editor

The detailed outline lives in `docs/site-outline.md`.
That document also includes panel layout guidance for when sections should stay side by side versus stack.

## Run locally

```bash
npm run dev
```

Then open:

- `http://localhost:4321/` for the public site
- `http://localhost:4321/post/?post=<post-id>` for a post page
- `http://localhost:4321/category/?category=<category-id>` for a category page
- `http://localhost:4321/about/` for the about/contact page
- `http://localhost:4321/editor/` for the local editor

The local editor and its homepage shortcuts are intentionally only shown when the site is running on `localhost` or `127.0.0.1`.

## Editor capabilities

The local editor can:

- Update global site copy and contact details
- Manage built-in and custom homepage panels
- Create, edit, preview, and delete categories
- Create, edit, preview, and delete posts
- Set an optional cover image per post using an asset path or image URL
- Edit post bodies in a rich composer with formatting controls and image paste/upload support
- Toggle the composer preview panel on and off while writing
- Export a backup JSON file
- Save changes directly into `data/content.json`

## Editing workflow

1. Open the editor locally
2. Update site copy, homepage panels, categories, or posts
3. Open a post in the composer for focused editing
4. Click `Save all changes`
5. The editor writes to `data/content.json`
6. Review the public site locally
7. Commit and push the changed files for your static host

Because the public site reads the same JSON file, your local edits are already in deployable form.
