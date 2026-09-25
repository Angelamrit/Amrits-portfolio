/**
 * Writes one schema.org JSON-LD block. `<` is escaped so no string in the data
 * can close the script element early.
 */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
