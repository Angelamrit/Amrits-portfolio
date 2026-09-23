import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Pushes an edit out to the public site.
 *
 * Every public page is statically rendered, which is why the site is fast and
 * why it must be told, explicitly, that something it has already rendered is
 * out of date. The scope is the whole layout rather than a single route
 * because the navigation in the header lists menus and gallery categories, so
 * editing a menu name changes the header on every page — revalidating only
 * `/menus` would leave the rest of the site showing the old name.
 *
 * Next.js regenerates a page when it is next requested, not all at once here,
 * so this is cheap even though its scope is broad.
 */
export function revalidateSite(): void {
  revalidatePath("/", "layout");
}
