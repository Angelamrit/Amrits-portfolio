import "server-only";

/**
 * Warms the image optimizer after the server starts.
 *
 * Every photograph is served through `/_next/image`, which resizes and
 * re-encodes it to WebP the first time each size is asked for and keeps the
 * result in `.next/cache/images`. That first time is slow — on the VPS it was
 * measured at close to a second per picture — and it was being paid by
 * visitors: after every deploy that started with an empty cache, the first
 * person to open each page waited for each photograph to be encoded on the
 * spot, and the pictures arrived one by one. Once a size is cached it is
 * served from disk in a few milliseconds, and when it expires Next serves the
 * stale copy while refreshing it in the background, so the only cold moment
 * is the first.
 *
 * This moves that first moment to the server's own startup. A little after
 * the server is listening it opens every page in the sitemap, collects each
 * `/_next/image` address those pages offer (every width in every `srcset`),
 * and requests each one, two at a time, with the `Accept` header a browser
 * sends. Anything already cached answers at once and costs nothing; anything
 * not yet cached is encoded now, while no one is waiting for it. With the
 * site's photography it is a few hundred files and a minute or two of
 * background work on a cold start, nothing on a warm one.
 *
 * Production only; `IMAGE_WARMUP=off` switches it off. It never throws: a
 * failure here only means the pictures are encoded on demand as before.
 */

const WARMUP_DELAY_MS = 4_000;
const CONCURRENCY = 2;
const FALLBACK_PAGES = ["/", "/about", "/angel", "/gallery", "/menus", "/press", "/contact", "/journal", "/testimonials"];

const log = (message: string) => console.log(`[images] ${message}`);

async function waitForServer(base: string): Promise<boolean> {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const res = await fetch(`${base}/api/health`, { headers: { "x-image-warmup": "1" } });
      if (res.ok) return true;
    } catch {
      // Not listening yet.
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }
  return false;
}

async function pagePaths(base: string): Promise<string[]> {
  try {
    const res = await fetch(`${base}/sitemap.xml`, { headers: { "x-image-warmup": "1" } });
    if (!res.ok) return FALLBACK_PAGES;
    const xml = await res.text();
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => {
        try {
          return new URL(m[1].trim()).pathname;
        } catch {
          return null;
        }
      })
      .filter((p): p is string => p !== null);
    return paths.length ? [...new Set(paths)] : FALLBACK_PAGES;
  } catch {
    return FALLBACK_PAGES;
  }
}

/** Every optimized-image address a page's HTML offers the browser. */
function imageUrlsIn(html: string): string[] {
  const found = new Set<string>();
  for (const m of html.matchAll(/\/_next\/image\?url=[^"'\s,]+/g)) found.add(m[0].replace(/&amp;/g, "&"));
  return [...found];
}

async function collect(base: string): Promise<string[]> {
  const urls = new Set<string>();
  for (const path of await pagePaths(base)) {
    try {
      const res = await fetch(`${base}${path}`, { headers: { "x-image-warmup": "1", accept: "text/html" } });
      if (!res.ok) continue;
      for (const url of imageUrlsIn(await res.text())) urls.add(url);
    } catch {
      // A page that fails to render is someone else's problem; the rest still warm.
    }
  }
  return [...urls];
}

export async function warmImages(): Promise<void> {
  if (process.env.NODE_ENV !== "production" || process.env.IMAGE_WARMUP === "off") return;
  const base = `http://127.0.0.1:${process.env.PORT || 3000}`;

  await new Promise((r) => setTimeout(r, WARMUP_DELAY_MS));
  if (!(await waitForServer(base))) {
    log("warm-up skipped: the server did not answer on its own port");
    return;
  }

  const started = Date.now();
  const urls = await collect(base);
  if (urls.length === 0) {
    log("warm-up found no images to prepare");
    return;
  }

  let cached = 0;
  let encoded = 0;
  let failed = 0;
  let next = 0;
  const worker = async () => {
    while (next < urls.length) {
      const url = urls[next++];
      try {
        const res = await fetch(`${base}${url}`, { headers: { accept: "image/webp,image/*,*/*;q=0.8", "x-image-warmup": "1" } });
        // The body has to be read for the optimizer's work to complete.
        await res.arrayBuffer();
        if (!res.ok) failed++;
        else if (res.headers.get("x-nextjs-cache") === "HIT") cached++;
        else encoded++;
      } catch {
        failed++;
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const seconds = Math.round((Date.now() - started) / 1000);
  log(`${urls.length} image sizes ready in ${seconds}s: ${encoded} encoded now, ${cached} already cached${failed ? `, ${failed} failed` : ""}`);
}
