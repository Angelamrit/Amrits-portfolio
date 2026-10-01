import "server-only";
import { articles } from "@/data/journal";
import { nav } from "@/data/nav";

/**
 * The name a page goes by on the site, for the dashboard's lists.
 *
 * The log stores addresses ("/", "/menus", "/journal/the-art-of-plating"),
 * which is right for a log and wrong for a chef: "/" does not say "the home
 * page" to anyone who has not built a website. Names come from the site's own
 * navigation and journal, so they match what a visitor sees and never need a
 * separate list kept in step.
 */

const named = new Map<string, string>([
  ...nav.map((item): [string, string] => [item.href, item.label]),
  ["/thank-you", "Thank you (after sending a message)"],
  // Retired pages that still turn up in older history.
  ["/experiences", "Experiences (removed page)"],
]);

const articleTitles = new Map(articles.map((article) => [article.slug, article.title]));

export function pageName(path: string): string {
  const known = named.get(path);
  if (known) return known;

  if (path.startsWith("/journal/")) {
    const slug = path.slice("/journal/".length);
    return `Journal · ${articleTitles.get(slug) ?? slug.replace(/-/g, " ")}`;
  }
  if (path.startsWith("/experiences/")) return "Experiences (removed page)";

  return path;
}
