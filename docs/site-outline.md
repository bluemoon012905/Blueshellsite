# Site Outline

## Current Positioning

Blue Shell Almanac is a static personal site that functions as a project archive, blog, and collection of stuff.

The current content model is organized around four categories defined in `data/content.json`:

- `art`
- `Research`
- `projects`
- `writing`

This is the actual live taxonomy in the repo today. The older "Art / School / Personal / Writing" outline is no longer accurate.

## Primary Navigation

The public top nav currently includes:

- Home: `/`
- About: `/about/`
- Contact: `/contact/`

When running locally, a `Local editor` link is injected into the nav and points to:

- Editor: `/editor/`

## Current Public Routes

### Homepage

Route:

- `/`

Purpose:

- Landing page for the site
- Entry point into category browsing, featured posts, and archive browsing

Current homepage structure:

1. Top navigation
2. Hero carousel
3. Homepage panels rendered from `site.homepagePanels`
4. About strip

Hero carousel slides currently include:

- Intro slide
- Outline slide with category cards
- Featured slide
- About slide

Default homepage panels currently include:

- `outline`
- `featured`
- `archive`

## Category Page

Route:

- `/category/?category=<category-id>`

Purpose:

- Show one category and its published posts

Behavior:

- Loads category metadata from `data/content.json`
- Filters posts by exact `post.category === category.id`
- Shows only posts where `published !== false`

## Post Page

Route:

- `/post/?post=<post-id>`

Purpose:

- Render a single published post

Behavior:

- Loads one post from `data/content.json`
- Rejects unpublished posts
- Displays title, summary, date, tags, and body
- Supports HTML or Markdown-backed body rendering
- Includes browser speech synthesis "Read aloud" controls

## About Page

Route:

- `/about/`

Purpose:

- Personal/profile page
- Extended introduction and contact context

## Contact Page

Route:

- `/contact/`

Purpose:

- Direct contact options
- Copy-email interaction

## Local Editor

Route:

- `/editor/`

Purpose:

- Local admin/editor interface for `data/content.json`

Current editor scope:

- Edit site-wide copy
- Edit homepage panels
- Edit categories
- Create, update, preview, and delete posts
- Export backup JSON
- Save directly back into the repo data file

## Content Model

### Site Object

`site` currently stores:

- Title and tagline
- Intro and about copy
- Brand mark text
- About/contact labels
- Contact and feedback links
- Editor labels
- `homepagePanels`

### Categories

Each category currently has:

- `id`
- `name`
- `description`

Important implementation detail:

- Category ids are not normalized consistently today. For example, `Research` is capitalized while the others are lowercase.
- Any new route or page that keys off categories should match the stored ids exactly unless normalization is introduced intentionally.

### Posts

Each post currently supports:

- `id`
- `title`
- `category`
- `date`
- `summary`
- `coverImage`
- `published`
- `featured`
- `tags`
- `bodyFormat`
- `body`

## Structural Notes

- The site is data-driven from `data/content.json`.
- Public pages fetch content client-side rather than compiling separate static data files per route.
- `about/` and `contact/` are standalone pages, not just homepage sections.
- `category/` and `post/` are query-parameter routes rather than pretty slug folders.
- The homepage hero and homepage sections are separate concepts.

## Planned Addition: Games Page

This repo does not yet have a dedicated games page, but the intended addition should become a first-class public route rather than being hidden inside posts.

Planned route:

- `/games/`

Planned purpose:

- Central place to host and launch playable projects
- Separate "play" discovery from long-form writeups in the posts archive

Recommended information architecture for the new page:

- Add `Games` to the primary nav
- Keep games as their own page, not just a category filter
- Allow each game card to link to a playable build, repo, and optional writeup/post
- Treat posts as supporting context, while `/games/` acts as the playable index

## Publishing Flow

1. Run the local server/editor setup
2. Update `data/content.json` and related page files
3. Review the public pages locally
4. Commit changes
5. Push to deploy the static site
