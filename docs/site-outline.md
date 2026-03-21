# Site Outline

## Positioning

Blue Shell Almanac is a static website that works as a project journal and blog collection. It is organized around four main tracks:

- Art
- School
- Personal
- Writing

## Homepage Structure

1. Hero
   - Site title
   - Short tagline
   - Intro paragraph
   - Primary actions to browse posts and edit locally
2. Category Grid
   - Four cards for the main sections
   - Each card explains what belongs there
3. Featured Posts
   - Highlight a few strong entries across categories
4. Archive
   - Full list of posts
   - Search by title, summary, or tags
   - Filter by category
5. About Strip
   - Short paragraph explaining the site approach
   - Contact link

## Panel Layout Rules

Panels should follow a few consistent layout rules across the site:

- Treat each panel as a self-contained content block with comfortable internal padding and a readable max line length.
- Text should never compete with decorative media for the same horizontal space.
- If a panel mixes a large image or media stage with text, switch to a stacked layout before the text area becomes cramped.
- Prefer stacking early rather than waiting for overlap, crowding, or visually hidden text.
- In stacked layouts, center the media block and keep it slightly smaller than full width when that improves readability.
- Keep supporting copy constrained to a readable width instead of stretching edge to edge.
- Mobile should not be the only breakpoint for stacking. Mid-width tablet and small laptop ranges should also stack when the two-column layout is no longer comfortable.
- Decorative elements should scale down or drop out before they interfere with navigation, headings, or body copy.

## Post Structure

Each post contains:

- Title
- Category
- Date
- Summary
- Featured toggle
- Tags
- Body in Markdown

## Local Editor

The local editor is a simple admin wrapper for `data/content.json`. It should allow:

- Updating global site copy
- Creating and editing posts
- Managing category metadata
- Saving directly into the repo for deployment
- Exporting a backup JSON file if needed

## Publishing Flow

1. Run the local editor
2. Make edits in the browser UI
3. Save changes
4. Review the static homepage locally
5. Commit and push the updated files to the static host
