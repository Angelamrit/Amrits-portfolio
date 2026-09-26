import { seo } from "@/data/seo";
import { renderShareImage, shareImageSize, shareImageType } from "@/lib/seo/share-image";

export const alt = seo.home.title;
export const size = shareImageSize;
export const contentType = shareImageType;

export default function Image() {
  return renderShareImage(seo.home.card);
}
