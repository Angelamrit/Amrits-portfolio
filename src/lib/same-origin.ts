/**
 * Whether a request came from a page on this site.
 *
 * `Sec-Fetch-Site` is set by the browser and cannot be overridden by page
 * script, so when it is present it is the strongest signal available. Older
 * browsers that do not send it fall back to comparing `Origin` against the
 * host. Neither stops a script run outside a browser — nothing on a public
 * endpoint can — but together they keep another site from pointing a visitor's
 * browser at an endpoint here.
 */
export function sameOrigin(requestHeaders: Headers): boolean {
  const fetchSite = requestHeaders.get("sec-fetch-site");
  if (fetchSite) return fetchSite === "same-origin";

  const origin = requestHeaders.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).host === requestHeaders.get("host");
  } catch {
    return false;
  }
}
