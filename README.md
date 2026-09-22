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

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`, `npm test`.

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
| `/admin` | The dashboard: visitor numbers, menus, dishes, restaurant details and gallery. Password-protected, never indexed. See [The dashboard](#the-dashboard). |

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

## The dashboard

`/admin` is a private area where the chef can see who is visiting the site and change its content himself, without a deploy.

### Turning it on

Set one environment variable and reload. Until it is set, `/admin` has nothing behind it and says so.

```bash
npm run admin:password          # asks for a password, prints the hash
```

Put the printed line in `.env.local` (development) or the host's environment (production):

```
ADMIN_PASSWORD_HASH=scrypt:32768:8:1:…
```

A plain `ADMIN_PASSWORD` is accepted instead if you would rather not run the script; the hash is safer, because anything that can read the environment then learns nothing it can sign in with. Sessions are a signed, http-only cookie lasting 12 hours. Changing the password signs every open session out.

### What it does

| Screen | What it is for |
|---|---|
| Overview | Visitors, page views, visits, traffic over time, most-read pages, referrers, devices, hours of the day and the latest arrivals, over 24 hours to 12 months |
| Menus | Names, intros, notes, and the courses themselves — add, remove, reorder, point a course at a dish or write it out |
| Dishes | Names, taglines, descriptions, dietary tags, signature flag, order, and which photograph is used |
| Restaurant | Address, hours, telephone, reservations and menu links, social links, the badges beside the restaurant |
| Gallery | Upload photographs, caption them, set the description screen readers read, reorder, hide, delete |

Every screen has a **Reset to original** that discards the stored edits and returns to the version in `src/data/`.

### How edits reach the site

`src/data/` is still the source of truth. The dashboard stores a *patch* — only the fields somebody actually changed — and the content layer in `src/lib/content/` lays those over the code's values at render time. Two consequences worth knowing:

- A later code change still reaches the site for every field the chef has not personally overridden.
- Resetting is deleting a key, not reconstructing a value.

Saving calls `revalidatePath("/", "layout")`, so the statically rendered pages regenerate on their next request. Public pages stay static; nothing became dynamic.

### Visitor numbers

Counting is first-party and built into this site: one small `POST /api/track` per page opened, from `PageViewBeacon`. There is no third-party analytics script anywhere, which is also why there is no consent banner — nothing that identifies a visitor is collected.

- No cookie is set and no IP address is stored. A visitor is a SHA-256 hash of the address, the user agent and a secret salt that is re-mixed with the date, so the same person on two days is two unrelated values.
- Obvious bots are dropped by user agent, and the endpoint is same-origin only and rate limited.
- Events are appended one line per visit to `analytics/<date>.jsonl`, and days older than 400 are pruned automatically.

### Where the data lives

Everything the dashboard writes — visit logs, content patches, uploaded photographs — goes through the `Store` interface in `src/lib/store/types.ts`. The default adapter writes plain files under `.data/` (or `DATA_DIR`), which needs no account, no dependency and no configuration.

**It does need a filesystem that survives a restart.** That is true of a VPS, Docker with a volume, or Render/Railway with a disk. It is *not* true of Vercel, Netlify or any other serverless platform, where the filesystem is read-only apart from `/tmp` and `/tmp` is discarded between requests — the dashboard would appear to work and then lose everything. Moving there means adding one file next to `fs-store.ts` that implements the same interface against a database, and changing the single line in `src/lib/store/index.ts` that picks the adapter. Nothing else in the application reads or writes storage directly.

The dashboard says which store is in use, and warns on its own if the directory looks temporary.

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, sitemap and Open Graph |
| `NEXT_PUBLIC_SHOW_PLACEHOLDERS` | `true` shows draft articles / placeholder content. Keep `false` in production. |
| `RESEND_API_KEY` | Resend API key for enquiry emails |
| `INQUIRY_TO_EMAIL` | Where enquiries are sent (comma-separated allowed) |
| `INQUIRY_FROM_EMAIL` | Verified sender, e.g. `Chef Amrit Pal Singh <inquiries@yourdomain.com>` |
| `ADMIN_PASSWORD_HASH` | Sign-in for `/admin`. Generate with `npm run admin:password`. Without it (or `ADMIN_PASSWORD`) the dashboard cannot be opened at all. |
| `ADMIN_PASSWORD` | Accepted instead of the hash. Simpler; less safe. |
| `ADMIN_SESSION_SECRET` | Optional. Signs the session cookie. Derived from the password when unset, which means changing the password signs everyone out. |
| `DATA_DIR` | Optional. Where the dashboard writes. Defaults to `.data`. Must survive a restart — see [The dashboard](#the-dashboard). |

A literal `$` in any `.env` value is read as a variable reference and has to be escaped as `\$`. The generated password hash deliberately contains none.

Values are validated in `src/lib/env.ts`. A malformed value (a misspelled address, a site URL that is not absolute) throws immediately, wherever it is found. A *missing* value only warns, because taking the whole site down over the mailer would be worse than the problem it reports.

What that means in practice:

- **In development**, with no `RESEND_API_KEY` / `INQUIRY_TO_EMAIL`, enquiries are logged to the console as `[inquiry:dry-run]` and the visitor sees the success state. This is what lets the form be worked on without credentials.
- **In production**, the same gap prints a banner at server startup (from `src/instrumentation.ts`) and the form stops claiming success: the guest is told it could not be sent and asked to telephone instead. An enquiry is never silently lost.

## Caching

Every route here is static, so Next already serves the pages themselves with `Cache-Control: s-maxage=31536000`, and its own build output from `/_next/static` as `immutable`. Two gaps were left, and `next.config.ts` closes both:

| What | Before | Now |
|---|---|---|
| `/public` files (`/images`, `/sequences`, `/video`) | `max-age=0` — revalidated on every visit | `public, max-age=604800, stale-while-revalidate=2592000` |
| Optimized images from `/_next/image` | 4 hours (the default `minimumCacheTTL`) | 7 days, matching the upstream file |

Seven days rather than a year because these filenames carry no content hash: an `immutable` year would strand a browser on an old photo when a new one is dropped in. A week self-corrects without needing a CDN purge, and the `stale-while-revalidate` window keeps the swap invisible to whoever is on the site at the time. The same value drives the optimizer, whose cache has no invalidation hook at all — which is the reason not to reach for a longer one.

Photography is nearly all of this site's weight, so this is the caching change that matters. If a CDN is put in front of the origin later, it needs no extra configuration to benefit; it only needs to pass the `rsc` request header and keep `_rsc` in its cache key.

## Security

- **Headers** — CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and the two Cross-Origin policies, set for every path in `next.config.ts`. The CSP keeps `'unsafe-inline'` for scripts; the comment above it explains why locking that down needs a per-request nonce, which would force every page to render dynamically.
- **No remote images.** `images.remotePatterns` is empty and must stay that way unless a real remote source appears. A hostname listed there turns `/_next/image` into an open image proxy for that host, on this domain.
- **The enquiry form** is the only input the site accepts, and is treated accordingly: sanitising, then server-side validation with Zod, then two tiers of rate limit, with a honeypot field and a minimum fill time. `src/lib/inquiry/submit.ts` explains each decision at the point it is made.
- **Secrets** live only in the environment, never in `src/data`. `.env*` is gitignored; `.env.example` documents what is needed.
- **The dashboard** is closed by default: with no credential configured there is nothing behind `/admin`. The password is stored as a scrypt hash, compared in constant time, and sign-in is rate limited per address and globally so a distributed run at it is capped too. Every failure — wrong password, no password configured, too many attempts — returns the same sentence, so nothing is learned by probing. `proxy.ts` turns anonymous requests away before a dashboard route renders, and every Server Action behind it checks the session again next to the data it is about to change, because a Server Action is a public endpoint whether or not a page links to it.
- **Uploads** are accepted only as JPEG, PNG or WebP, and the type is read from the file's own header rather than taken from the browser's word for it. The stored filename is generated on the server; nothing from the upload's own name is used. They are served from a route with `nosniff` and their real type.

One limitation to know about: the rate limiter counts in the server's own memory (`src/lib/rate-limit.ts`). On a single long-lived Node process that is exactly right. On a serverless platform, or across several instances, each worker keeps its own counts and the effective limit is multiplied by the number of live workers. If the site is deployed that way, swap the body of `rateLimit` for a shared store — Upstash Redis or Vercel KV — which is all the signature was designed to allow.

## Tests

```bash
npm test          # once
npm run test:watch
```

No test framework and no new dependencies: Node runs the TypeScript sources directly, and `test/alias-hook.mjs` teaches its loader the `@/*` alias so the tests import the application modules unchanged rather than a copy of them. Requires Node 24 or newer.

The suite covers the parts where being wrong is expensive rather than merely visible — the sanitiser's defence against forged lines in the enquiry email, both tiers of rate limit (including that one address cannot be used to mail-bomb a third party), the bot traps, that a production server never reports an undelivered enquiry as sent, and, for the dashboard, that an edited session cookie is refused, that an expired one is refused even though it is genuinely signed, that changing the password invalidates open sessions, that a malformed or absurdly expensive password hash never verifies, and that an upload's type comes from its bytes rather than its name. `.github/workflows/ci.yml` runs lint, typecheck, tests and a build on every push and pull request.

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
- Set the environment variables on the host and send a test enquiry. Check the startup logs: an unconfigured mailer announces itself there.
- Add real guest testimonials (with permission) and un-hide the Testimonials nav item.
