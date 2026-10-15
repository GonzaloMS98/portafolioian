# Sanity CMS setup

The portfolio now reads its visible content from Sanity and keeps the current local content as a fallback. This lets the site continue to work before a Sanity project is connected or when the CMS is temporarily unavailable.

## 1. Create or choose a Sanity project

Create a project at [sanity.io/manage](https://www.sanity.io/manage), then copy its project ID. The default dataset expected by this repository is `production`.

## 2. Configure local variables

Copy `.env.example` to `.env.local` and replace `your_project_id`:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-10-14
```

Restart `npm run dev` after changing environment variables.

## 3. Allow the Studio origin

In the Sanity project settings, add the site origins that will host the embedded Studio. For local development add `http://localhost:3000` and allow credentials. Add the production domain before deployment.

## 4. Add content

Open [http://localhost:3000/studio](http://localhost:3000/studio). Create content in this order:

1. **Site settings** — identity, hero videos/poster, contact information, interface labels, and SEO.
2. **Work sections** — for example Commercial, Narrative, and Corporate. Set their order.
3. **Projects** — choose a section, add editorial copy, cover image, optional MP4 or external video URL, BTS gallery, and order.

The frontend automatically uses the ordered sections and projects. A project without a video opens its cover as the main project media.

The current local portfolio can be copied into a connected, empty dataset with:

```bash
npm run sanity:seed
```

The seed uses fixed document IDs and reuses assets with matching filenames, so it can safely be run again to update the initial content.

## Content covered by Sanity

- Site title and SEO description
- Brand name, DOP tag, navigation and interface labels
- Desktop/mobile hero videos, poster and accessibility label
- Contact details, social link, availability, and copyright
- Work section names, slugs, descriptions, and order
- Project titles, slugs, types, years, editorial text, covers, videos, BTS galleries, and order

## Useful commands

```bash
npm run sanity:schema
npm run sanity:seed
npm run sanity:deploy
```

`sanity:deploy` publishes a standalone Studio if one is needed. The project already includes an embedded Studio at `/studio`, so deploying a second Studio is optional.
