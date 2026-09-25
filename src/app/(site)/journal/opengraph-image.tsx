import { seo } from "@/data/seo";
import { renderShareImage, shareImageSize, shareImageType } from "@/lib/seo/share-image";

export const alt = seo.journal.title;
export const size = shareImageSize;
export const contentType = shareImageType;

export default function Image() {
  return renderShareImage(seo.journal.card);
}
