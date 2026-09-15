# Chef Amrit Pal Singh — Portfolio

Personal brand and private-dining website for Chef Amrit Pal Singh, owner and head chef of Angel Indian Restaurant (Michelin Bib Gourmand), Jackson Heights, Queens.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, `motion` and Lenis.

**Palette.** Sampled from the Angel dining room (`resturant.jpeg`): honey-oak gold (`#b3844a`) for page backgrounds and chocolate brown (`#2c1b12`) for the navbar, footer and alternating sections. Text colour flips automatically via the `tone-gold` / `tone-dark` utilities in `src/app/globals.css`, so new sections should use `<Section tone="base|raised|deep">` rather than hard-coding colours. Structure follows the project brief in `docs/Chef_Portfolio_Website_Structure.pdf`.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional, see below
npm run dev                  # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`.

> The `dev` and `start` scripts pass `--dns-result-order=ipv4first` to Node. Some Windows/ISP setups resolve IPv6 first and stall for ~10 s, which makes remote image optimisation time out.

## Site map

The site is arranged as one story, in the order a visitor should meet it: who the chef is, where he cooks, what he cooks, what he offers privately, proof, process, action. Navigation follows the same order.

| Route | Purpose |
|---|---|
| `/` | Hero → credentials strip → 01 Meet the Chef → 02 Angel (the restaurant) → 03 Signature Dishes → 04 Private Experiences → 05 Menus → 06 Gallery → 07 Recognition → 08 How it works → Final CTA |
| `/about` | The Chef: story → philosophy → milestones → training and career → recognition |
| `/angel` | The Restaurant: story → the two dining rooms → what is served → recognition → visit / reserve |
| `/experiences` and `/experiences/[slug]` | Six private services, then a cross-link to dining at Angel, then the booking process |
| `/menus` | Tasting menu and house specialties (served at Angel) plus the private event menu (tab switcher, `?menu=`) |
| `/gallery` | Filterable editorial grid with lightbox |
| `/press` | Genuine press and awards only |
| `/journal` and `/journal/[slug]` | Articles (drafts hidden until published; footer and mobile nav only until then) |
| `/testimonials` | Built but hidden from the nav until real guest quotes exist |
| `/contact` | Seven-step booking wizard with live summary and estimated menu → server action → Resend email to the chef + video auto-reply to the guest |
| `/thank-you` | Chef's video message, linked from the auto-reply email (not indexed) |

## Editing content

All copy and images live in `src/data/`. Components only render what they are given.

| File | Contents |
|---|---|
| `site.ts` | Name, URL, restaurant address, Resy link, CTA |
| `chef.ts` | Bio, timeline, training, specialties, philosophy, stats, recognition |
| `restaurant.ts` | Angel: story, features, the two dining rooms, facts |
| `dishes.ts` | Signature dishes with dietary tags |
| `menus.ts` | Menus and courses. Courses with `status: "draft"` show "To be confirmed with Chef". |
| `experiences.ts` | The six services (copy, inclusions, FAQ) |
| `gallery.ts` | Gallery items and categories |
| `journal.ts` | Articles as typed blocks. Set `status: "published"` and `isPlaceholder: false` to release. |
| `press.ts` / `testimonials.ts` | Genuine recognition only. Never add unverified awards or invented quotes. |
| `process.ts` | The five booking steps |
| `nav.ts` | Navigation order. `secondary` keeps a page out of the desktop header; `hidden` removes it everywhere. |
| `images.ts` | Every photograph on the site |

### Swapping in real photography

All images are stock placeholders stored in `public/images/placeholders/` and flagged `placeholder: true` in `src/data/images.ts`.

1. Drop the real file in `public/images/<group>/` (for example `public/images/chef/portrait.jpg`).
2. Replace that entry in `images.ts`:
   ```ts
   chefPortrait: { src: "/images/chef/portrait.jpg", alt: "Chef Amrit Pal Singh at the pass", width: 1600, height: 2000 },
   ```
3. Nothing else changes. Delete the unused placeholder file if you like.

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, sitemap and Open Graph |
| `NEXT_PUBLIC_SHOW_PLACEHOLDERS` | `true` shows draft articles / placeholder content. Keep `false` in production. |
| `RESEND_API_KEY` | Resend API key for enquiry emails |
| `INQUIRY_TO_EMAIL` | Where enquiries are sent (comma-separated allowed) |
| `INQUIRY_FROM_EMAIL` | Verified sender, e.g. `Chef Amrit Pal Singh <inquiries@yourdomain.com>` |

Without `RESEND_API_KEY` and `INQUIRY_TO_EMAIL`, enquiries are logged to the server console as `[inquiry:dry-run]` and the visitor still sees the success state.

## Feature assets to supply

| Asset | Where | Notes |
|---|---|---|
| Plating frames | `public/sequences/plating/frame-001.jpg …` | Scroll-scrubbed sequence on the home page. Shipped frames are a generated placeholder; export 48–96 real frames at 1400×875 and update `count` in `src/data/sequences.ts`. |
| Thank-you video | `public/video/chef-thank-you.mp4` | 20–30 s clip of Chef Amrit. Shown on the enquiry success screen and `/thank-you`, and linked from the auto-reply email. Until it exists the poster image is shown. |
| Then / now photos | `src/data/restaurant.ts` → `thenNow` | The before/after slider (2019 kitchen vs new dining room). |

## Before launch

- Confirm the two draft courses on the tasting menu and the dessert on the event menu with Chef.
- Confirm the Resy listing URL in `site.ts` and add social handles.
- Replace placeholder photography.
- Set the environment variables on Vercel and send a test enquiry.
- Add real guest testimonials (with permission) and un-hide the Testimonials nav item.
