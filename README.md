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

The site is arranged as one story, in the order a visitor should meet it: who the chef is, where he cooks, what he cooks, proof, action. Chef Amrit cooks only at Angel, so there is no private dining or event booking; every call to action leads to a table at the restaurant. Navigation follows the same order.

| Route | Purpose |
|---|---|
| `/` | Hero → credentials strip → 01 Meet the Chef → 02 Angel (the restaurant) → 03 Signature Dishes → 04 Menus → 05 Gallery → 06 Recognition → Final CTA (reserve a table) |
| `/about` | The Chef: story → philosophy → milestones → training and career → recognition |
| `/angel` | The Restaurant: story → the two dining rooms → what is served → recognition → visit / reserve |
| `/menus` | The chef's tasting menu, served at Angel (`?menu=` selects a menu) |
| `/gallery` | Filterable editorial grid with lightbox |
| `/press` | Genuine press and awards only |
| `/journal` and `/journal/[slug]` | Articles (drafts hidden until published; footer and mobile nav only until then) |
| `/testimonials` | Built but hidden from the nav until real guest quotes exist |
| `/contact` | Reserve at Angel (Resy), address and phone, plus a short message form (topic, name, email, message) → server action → Resend email to the chef + video auto-reply to the guest |
| `/thank-you` | Chef's video message, linked from the auto-reply email (not indexed) |
| `/admin` | The dashboard: visitor numbers, menus, dishes, restaurant details and photos. Password-protected, never indexed. See [The dashboard](#the-dashboard). |

## Editing content

All copy and images live in `src/data/`. Components only render what they are given.

| File | Contents |
|---|---|
| `site.ts` | Name, URL, restaurant address, Resy link, CTA |
| `chef.ts` | Bio, timeline, training, specialties, philosophy, stats, recognition |
| `restaurant.ts` | Angel: story, features, the two dining rooms, facts |
| `dishes.ts` | Signature dishes with dietary tags |
| `menus.ts` | Menus and courses. Courses with `status: "draft"` show "To be confirmed with Chef". |
| `gallery.ts` | Gallery items and categories |
| `journal.ts` | Articles as typed blocks. Set `status: "published"` and `isPlaceholder: false` to release. |
| `press.ts` / `testimonials.ts` | Genuine recognition only. Never add unverified awards or invented quotes. |
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

Judge the dashboard's speed on a production build (`npm run build && npm start`), not on `npm run dev`. The development server runs React in development mode and compiles each screen the first time it is opened, which makes typing in the editors and the first tap on every screen several times slower than the deployed dashboard — measured at 8× slower per keystroke on the dish editor.

A plain `ADMIN_PASSWORD` is accepted instead if you would rather not run the script; the hash is safer, because anything that can read the environment then learns nothing it can sign in with. Sessions are a signed, http-only cookie lasting 12 hours. Changing the password signs every open session out.

### Changing the password

The variable above is the password the site starts with. The chef changes it himself under **Account → Change password** in the dashboard: current password, new one twice, at least 10 characters. From then on the new password is the only one that opens the dashboard — the one in the environment no longer does — and every other signed-in phone or computer is signed out at once, while the device that made the change stays in. The new password is kept as a scrypt hash in the dashboard's storage (`admin-credential`, next to the menus), so on Vercel it needs the Redis store connected; without that the screen says saving is off. It is never copied by `npm run data:migrate`.

If the password is forgotten, generate a new `ADMIN_PASSWORD_HASH` with `npm run admin:password`, set it on the server and redeploy. A new value there always wins over the one set in the dashboard, which is then discarded; nothing else is touched. `src/lib/admin/credential.ts` explains how the two are weighed.

### What it does

| Screen | What it is for |
|---|---|
| Home | One-tap shortcuts to the jobs the chef comes here to do, the week's visitors against the week before, the most-read pages, and which parts of the website he has edited or hidden |
| Visitors | Visitors, page views, visits, traffic over time, most-read pages (by name), referrers, devices, hours of the day and the latest arrivals, over 24 hours to 12 months. Days and hours are New York time, the restaurant's own clock; the log itself stays in UTC |
| Menus | Names, intros, notes, and the courses themselves — add, remove, reorder, point a course at a dish or write it out |
| Dishes | Names, taglines, descriptions, dietary tags, signature flag, order, and which photograph is used |
| Restaurant details | Address, hours, telephone, reservations and menu links, social links, the badges beside the restaurant |
| Photos | Upload photographs (choose or drag in, up to 12MB each), caption them, set the description screen readers read, reorder, hide, delete. Uploads can also be chosen as a dish's photograph, and the home page's photo strip follows this screen |

On a phone, Home, Visitors and Menus sit in a tab bar at the bottom of the screen.

Every content screen has a **Reset to original** that discards the stored edits and returns to the version in `src/data/`.

Edits are never lost by accident: leaving a screen with unsaved changes (by the sidebar, the tab bar, the back link, signing out or closing the tab) asks first, fields the server would refuse are marked in red before saving, and a save made after the 12-hour session has run out answers with "sign in again, then save" instead of redirecting — the form keeps what was typed.

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

Everything the dashboard writes — visit logs, content patches, uploaded photographs — goes through the `Store` interface in `src/lib/store/types.ts`. Nothing else in the application reads or writes storage directly. There are two adapters, and `src/lib/store/index.ts` picks one:

| Where | Adapter | Data |
|---|---|---|
| **Vercel** (the live site) | `cloud-store.ts` | Content and visitor numbers in **Upstash Redis**, uploaded photographs in **Vercel Blob**. Saves use a compare-and-set, so two instances saving at once cannot overwrite each other. |
| **Anywhere else** (a laptop, a VPS) | `fs-store.ts` | Plain files under `.data/` (or `DATA_DIR`). Needs a folder that survives a restart. |

Off Vercel the file store is used *even when the cloud keys are in `.env.local`*, so a dev server never edits the live site's data by accident. `DASHBOARD_STORE=cloud` or `=files` overrides the choice.

On Vercel without the cloud keys, the site serves normally but every dashboard screen says saving is off, rather than letting a save fail. The Visitors screen shows which store is in use.

### Keeping the data safe (VPS)

On a server that keeps the data in files, five layers stand between the chef's work and losing it:

| Risk | What protects against it |
|---|---|
| Power cut or crash in the middle of a save | Every save is written to a temporary file, flushed to the disk, then swapped in. A reader sees the old version or the new one, never half of either. |
| A bad edit, or a wrong one saved by mistake | The last 30 versions of every content document are kept in `history/<name>/`, one file per save. Copy one back over `content/<name>.json` to undo. |
| A photograph deleted by mistake | It goes to `trash/uploads/` for 30 days instead of being deleted, even one uploaded the same day. Move both its files back into `uploads/` to restore it. |
| The data folder deleted, overwritten or corrupted | A full backup every day, made by the server itself, kept for 30 days (`DATA_BACKUP_KEEP`). Photos are hard-linked, so thirty days cost little more than one. The Visitors screen shows when the last one was made. |
| A deploy that replaces the app folder | The data must live outside it: set `DATA_DIR`. The server prints a warning at startup in production when it is unset or inside the app folder. |

What the server cannot do by itself is survive **its own disk** failing, because the backups are on the same disk unless `DATA_BACKUP_DIR` points at another one. Turn on the hosting provider's automatic snapshots, or copy the backup folder off the server regularly, and that last gap is closed too. The startup log says when backups and data share a disk.

Setting it up on the VPS, once:

```bash
sudo mkdir -p /var/lib/chef-site && sudo chown $USER /var/lib/chef-site
# in the app's .env.production (or the process manager's environment):
DATA_DIR=/var/lib/chef-site/data
# backups default to /var/lib/chef-site/data-backups; DATA_BACKUP_DIR overrides
```

Run one copy of the app (PM2 in fork mode, not cluster mode): the backup schedule, the save queues and the rate limits each live in the one process.

```bash
npm run data:backup                  # a backup right now, e.g. before moving servers
npm run data:restore                 # list the backups
npm run data:restore -- 2026-10-01   # put one back (stop the site first)
npm run build                        # then rebuild, so the public pages show it, and start again
```

A restore backs up the current data first, as `before-restore-<time>`, so it can itself be undone.

To copy a computer's `.data` to the live site once — dishes, gallery, uploaded photographs and visitor numbers — put the three cloud values in `.env.local` and run `npm run data:migrate -- --dry-run`, then `npm run data:migrate`. It is safe to run twice, shrinks any photograph too large for Vercel, and refuses to overwrite content edited on the live dashboard unless given `--force`.

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, sitemap, Open Graph and email links. On Vercel it can be left unset: the project's production address is used (its `.vercel.app` address, or the custom domain once connected). |
| `NEXT_PUBLIC_SHOW_PLACEHOLDERS` | `true` shows draft articles / placeholder content. Keep `false` in production. |
| `RESEND_API_KEY` | Resend API key for enquiry emails |
| `INQUIRY_TO_EMAIL` | Where enquiries are sent (comma-separated allowed) |
| `INQUIRY_FROM_EMAIL` | Verified sender, e.g. `Chef Amrit Pal Singh <inquiries@yourdomain.com>` |
| `ADMIN_PASSWORD_HASH` | The first sign-in for `/admin`. Generate with `npm run admin:password`. Without it (or `ADMIN_PASSWORD`) the dashboard cannot be opened at all. Once the chef changes the password in the dashboard, this one stops working; setting a new value here and redeploying resets it (see [Changing the password](#changing-the-password)). |
| `ADMIN_PASSWORD` | Accepted instead of the hash. Simpler; less safe. |
| `ADMIN_SESSION_SECRET` | Optional. Signs the session cookie. Derived from the password when unset. Changing the password signs everyone out either way. |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Upstash Redis, for the dashboard on Vercel. Added by Vercel when the database is connected in the project's Storage tab. `UPSTASH_REDIS_REST_URL` / `_TOKEN` also work. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob, for uploaded photographs on Vercel. Added by Vercel when the Blob store is connected. |
| `DASHBOARD_STORE` | Optional. `cloud` or `files`; see [Where the data lives](#where-the-data-lives). |
| `DATA_DIR` | Off Vercel. Where the file store writes. Defaults to `.data` inside the app, which a deploy can delete, so **set it on a VPS** to a folder outside the app (e.g. `/var/lib/chef-site/data`). See [Keeping the data safe](#keeping-the-data-safe-vps). |
| `DATA_BACKUP_DIR` | Optional. Where the daily backups go. Defaults to a folder beside `DATA_DIR` named `<DATA_DIR>-backups`. Point it at a second disk if the server has one. |
| `DATA_BACKUP_KEEP` | Optional. How many daily backups to keep. Default 30. |
| `DATA_BACKUPS` | Optional. `off` stops the daily backups; `on` runs them on a development server too. They run in production by default. |
| `OPENAI_API_KEY` | Optional. OpenAI key for the "Ask Angel" assistant. Server-side only — never prefix with `NEXT_PUBLIC_`. Without it the assistant still opens and answers, but hands visitors the restaurant's phone and email instead of calling the model. |

A literal `$` in any `.env` value is read as a variable reference and has to be escaped as `\$`. The generated password hash deliberately contains none.

Values are validated in `src/lib/env.ts`. A malformed value (a misspelled address, a site URL that is not absolute) throws immediately, wherever it is found. A *missing* value only warns, because taking the whole site down over the mailer would be worse than the problem it reports.

What that means in practice:

- **In development**, with no `RESEND_API_KEY` / `INQUIRY_TO_EMAIL`, enquiries are logged to the console as `[inquiry:dry-run]` and the visitor sees the success state. This is what lets the form be worked on without credentials.
- **In production**, the same gap prints a banner at server startup (from `src/instrumentation.ts`) and the form stops claiming success: the guest is told it could not be sent and asked to telephone instead. An enquiry is never silently lost.
- **To check the credentials**, `npm run email:test` sends one clearly labelled test enquiry, and the guest auto-reply, through the real mailer to `INQUIRY_TO_EMAIL`, and prints Resend's own reason when either is refused. Until a domain is verified in Resend the sender is Resend's shared `onboarding@resend.dev`, which delivers only to the address the Resend account was created with: enquiries still arrive there, but the auto-reply cannot reach guests until `INQUIRY_FROM_EMAIL` is on a verified domain.

## Caching

Every route here is static, so Next already serves the pages themselves with `Cache-Control: s-maxage=31536000`, and its own build output from `/_next/static` as `immutable`. Two gaps were left, and `next.config.ts` closes both:

| What | Before | Now |
|---|---|---|
| `/public` files (`/images`, `/video`) | `max-age=0` — revalidated on every visit | `public, max-age=604800, stale-while-revalidate=2592000` |
| Optimized images from `/_next/image` | 4 hours (the default `minimumCacheTTL`) | 7 days, matching the upstream file |

Seven days rather than a year because these filenames carry no content hash: an `immutable` year would strand a browser on an old photo when a new one is dropped in. A week self-corrects without needing a CDN purge, and the `stale-while-revalidate` window keeps the swap invisible to whoever is on the site at the time. The same value drives the optimizer, whose cache has no invalidation hook at all — which is the reason not to reach for a longer one.

Photography is nearly all of this site's weight, so this is the caching change that matters. If a CDN is put in front of the origin later, it needs no extra configuration to benefit; it only needs to pass the `rsc` request header and keep `_rsc` in its cache key.

## Speed on the VPS

What the code does by itself:

- **Photographs never pop into an empty frame.** Every picture carries a tiny blurred copy of itself (`src/data/placeholders.generated.json`, built by `node scripts/image-placeholders.mjs`; uploads get theirs at upload time), drawn in the frame until the real file arrives. Run the script again after adding or replacing a file under `public/images`.
- **A frame opens onto its picture, not before it.** The reveal waits for the photograph to load (up to 0.9s), and the wipe itself is two transforms rather than a clip-path, so it runs on the GPU and never repaints the picture — the stutter on phones and in Safari came from exactly that repaint.
- **Nothing visible waits for JavaScript.** The scroll reveals run from one inline script in `SiteShell.tsx` the moment the HTML is parsed; the React bundle only adds the cursor spotlight.
- **The image optimizer is warmed at startup** (`src/lib/images/warm.ts`): a few seconds after `next start`, the server opens every page in the sitemap and requests every image size they offer, so the first visitor after a deploy never waits for a photograph to be encoded. Already-cached sizes cost nothing; a cold cache takes a minute or two of background work. `IMAGE_WARMUP=off` disables it.
- **Scrolling does no per-event work.** The chapter rail and the header decide what to show through IntersectionObservers and a once-per-frame check, and off-screen sections (including the hero, once it has scrolled away) are skipped entirely, animations paused.

What only the server can do — each of these was measured, and together they are worth more than everything above for a visitor in New York:

1. **Keep `.next/cache/images` between deploys.** It holds every encoded photograph. A deploy that deletes `.next` (a fresh clone, `rm -rf .next`) throws it away; `next build` alone keeps it. If the deploy script replaces the folder, copy `.next/cache` across or point it at a persistent path.
2. **HTTP/2 in nginx** — `listen 443 ssl; http2 on;` (nginx 1.25+) or `listen 443 ssl http2;`. Over HTTP/1.1 a browser opens at most six connections and every photograph waits its turn in that queue; from New York each turn costs a round trip to Mumbai (~250ms). HTTP/2 sends them all down one connection at once. This is the single biggest change available.
3. **Compression for text** — `gzip on; gzip_types text/html text/css application/javascript application/json image/svg+xml;` (or Brotli if the module is installed). The home page is 450KB of HTML and 45KB compressed; the live server already compresses, but check it stays on after any nginx change.
4. **Let nginx serve the static files itself** — `location /_next/static/ { alias <app>/.next/static/; expires 1y; add_header Cache-Control "public, immutable"; }` and the same for `/images/` with the seven-day value above, so Node is not in the path for files that never change.
5. **A CDN in front** (Cloudflare's free plan is enough) caches the photographs and scripts in the visitor's own city, terminates TLS close to them and provides HTTP/2 and HTTP/3 on its own. With the server in Mumbai and the guests in Queens, this is what turns a 250ms round trip into a 20ms one. It is a new service, so it is a decision for the owner, not something the code can make.

## Security

- **Headers** — CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and the two Cross-Origin policies, set for every path in `next.config.ts`. The CSP keeps `'unsafe-inline'` for scripts; the comment above it explains why locking that down needs a per-request nonce, which would force every page to render dynamically.
- **No remote images.** `images.remotePatterns` is empty and must stay that way unless a real remote source appears. A hostname listed there turns `/_next/image` into an open image proxy for that host, on this domain.
- **The enquiry form** is the only input the site accepts, and is treated accordingly. Every submission meets, in order: a five-second cooldown per connection, so one client cannot hammer the endpoint; a ceiling on attempts; a honeypot field; a signed, single-use challenge with an invisible proof of work that the browser fetches and solves while the guest types (`src/lib/inquiry/challenge.ts`, `src/lib/inquiry/proof.ts`), which a script that posts straight at the endpoint cannot produce and which cannot be replayed; sanitising and server-side validation with Zod; and the send limits per connection, per address and per day. No CAPTCHA and no third-party service: the challenge is an HMAC signed by the server itself. Only the form's eight fields are ever read from a request, so a padded body costs nothing; a caught bot is answered with a decoy "success" after about the time a real send takes, so timing gives nothing away; every call to the mail API is held to eight seconds; the guest's auto-reply goes out after the response, so nobody waits for a second email; the in-memory counters and the ledger of spent tokens are capped at every insert; and both Server Actions catch everything, so the form can degrade to an honest sentence but never to the error boundary. `src/lib/inquiry/submit.ts` explains each decision at the point it is made.
- **Secrets** live only in the environment, never in `src/data`. `.env*` is gitignored; `.env.example` documents what is needed.
- **The dashboard** is closed by default: with no credential configured there is nothing behind `/admin`. The password is stored as a scrypt hash, compared in constant time, and sign-in is rate limited per address and globally so a distributed run at it is capped too. Every failure — wrong password, no password configured, too many attempts — returns the same sentence, so nothing is learned by probing. `proxy.ts` turns anonymous requests away before a dashboard route renders, and every Server Action behind it checks the session again next to the data it is about to change, because a Server Action is a public endpoint whether or not a page links to it.
- **Uploads** go to `POST /api/admin/upload`, one file per request, rather than through a Server Action: actions cap a body at 1MB, and raising that limit is site-wide, so it would also apply to the public contact form. The browser shrinks each photograph first (longest side 2400px, which also drops the GPS position a phone records), because Vercel refuses any request over 4.5MB; the chef can pick a photograph of up to 40MB. The route checks the session and the same-origin headers before it reads anything, refuses a body over 12MB from its declared length, and is rate limited. Files are accepted only as JPEG, PNG or WebP, and the type is read from the file's own header rather than taken from the browser's word for it. The stored filename is generated on the server; nothing from the upload's own name is used. They are served from a route with `nosniff` and their real type.

One limitation to know about: the rate limiter counts in the server's own memory (`src/lib/rate-limit.ts`), and so does the ledger of spent challenge tokens. On Vercel each running instance keeps its own counts, so the effective limit is multiplied by the number of live instances — a handful for a site of this size, which is an accepted trade-off. If that ever matters, the Upstash Redis the dashboard already uses can back `rateLimit` instead, which is all its signature was designed to allow. Volumetric denial of service is a job for the host's edge (Vercel and Cloudflare both do it by default); what the application can do, and does, is make sure one connection can never make it do more than a lookup every five seconds.

## Tests

```bash
npm test          # once
npm run test:watch
```

No test framework and no new dependencies: Node runs the TypeScript sources directly, and `test/alias-hook.mjs` teaches its loader the `@/*` alias so the tests import the application modules unchanged rather than a copy of them. Requires Node 24 or newer.

The suite covers the parts where being wrong is expensive rather than merely visible — the sanitiser's defence against forged lines in the enquiry email, both tiers of rate limit (including that one address cannot be used to mail-bomb a third party), the bot traps, that a production server never reports an undelivered enquiry as sent, and, for the dashboard, that an edited session cookie is refused, that an expired one is refused even though it is genuinely signed, that changing the password invalidates open sessions, that a malformed or absurdly expensive password hash never verifies, and that an upload's type comes from its bytes rather than its name. `.github/workflows/ci.yml` runs lint, typecheck, tests and a build on every push and pull request.

Without `OPENAI_API_KEY`, the assistant still opens and answers, but replies with the restaurant's phone and email instead of calling the model.

## Feature assets to supply

| Asset | Where | Notes |
|---|---|---|
| Thank-you video | `public/video/chef-thank-you.mp4` | 20–30 s clip of Chef Amrit, for `/thank-you` and the auto-reply email. Until it exists both show his photograph and note; once the file is in place, set `site.thankYou.videoUrl` in `src/data/site.ts`. |
| Then / now photos | `src/data/restaurant.ts` → `thenNow` | The before/after slider (2019 kitchen vs new dining room). |

## Deploying to Vercel

1. **Import the repository** in Vercel. The defaults are right: framework Next.js, build `next build`, no output setting. Use the Pro plan; Hobby is for non-commercial sites.
2. **Connect the dashboard's storage.** In the project's **Storage** tab, create an **Upstash for Redis** database and a **Blob** store (choose *Private*), and connect both to the project. Put the Redis database in **US East**, next to Vercel's default function region (Washington, D.C.), so every dashboard read is a short hop. Vercel adds `KV_REST_API_URL`, `KV_REST_API_TOKEN` and `BLOB_READ_WRITE_TOKEN` itself.
3. **Add the environment variables** (Settings → Environment Variables, for Production):
   - `OPENAI_API_KEY`
   - `RESEND_API_KEY`, `INQUIRY_TO_EMAIL`, and `INQUIRY_FROM_EMAIL` on a domain verified in Resend (check them first with `npm run email:test`)
   - `ADMIN_PASSWORD_HASH` (from `npm run admin:password`) and `ADMIN_SESSION_SECRET` (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
   - `NEXT_PUBLIC_SITE_URL`, only once a custom domain is connected

   Leave `DATA_DIR`, `TRUSTED_IP_HEADER` and `DASHBOARD_STORE` unset.
4. **Deploy**, then copy the dashboard's existing data across with `npm run data:migrate` (see [Where the data lives](#where-the-data-lives)).
5. **Check the live site**: sign in to `/admin` and save a small edit; upload and delete a photograph; send a test enquiry; ask the assistant a question. The function logs name any missing setting.

Vercel applies a change to an environment variable only to deployments made after it, so redeploy after adding or changing one.

## Being found on Google

What the code already does: every public page has its own title, description and canonical address; `robots.txt` and `sitemap.xml` are generated; a share image is rendered for each page; and structured data (schema.org) describes the chef, the restaurant, its menus, hours, telephone number and the questions answered on the Angel page. The `www.` address redirects to the bare domain.

What has to be done once, outside the code:

1. **Google Search Console.** Add `chefamritpalsingh.com` as a Domain property (a DNS record at the registrar) or as a URL-prefix property. For the URL-prefix method, set `GOOGLE_SITE_VERIFICATION` on the server to the code Google gives and restart; the tag is then written into every page. Submit `https://chefamritpalsingh.com/sitemap.xml`, then open URL Inspection and press "Request indexing" for `/`, `/about`, `/angel`, `/menus`, `/press` and `/contact`. Google still shows the previous website that lived on this domain; this is what replaces it.
2. **Bing Webmaster Tools.** Import the Search Console property (one click), or set `BING_SITE_VERIFICATION`.
3. **Keep the details identical everywhere.** The hours and telephone number under Restaurant details in the dashboard must match Google Business Profile, Resy and Yelp. A mismatch reads as an unreliable listing. When they change, change all of them the same day.
4. **Link to this site from the restaurant's.** `angelindianrestaurantnyc.com` does not link here yet. A "Meet the chef" link to `https://chefamritpalsingh.com/about` from its story page, and this address in the restaurant's Instagram bio, are the two links that matter most for a new domain.
5. **nginx.** Serve HTTP/2 (`listen 443 ssl http2;`): the live site answers over HTTP/1.1, which Lighthouse measures as about a second of avoidable load time on a phone. Add the `www.` redirect at the nginx level too, so it happens before the request reaches Node.
6. **Publish the journal.** The five drafts in `src/data/journal.ts` are the pages Google would rank for dish and recipe searches. Until one is published the journal is deliberately kept out of the index.

## Before launch

- Confirm the two draft courses on the tasting menu and the dessert on the event menu with Chef.
- Confirm the Resy listing URL in `site.ts` and add social handles.
- Set the environment variables on the host and send a test enquiry. Check the startup logs: an unconfigured mailer announces itself there.
- Add real guest testimonials (with permission) and un-hide the Testimonials nav item.
