import type { GalleryCategory, GalleryItem } from "@/types/content";
import { images } from "./images";

export const galleryCategories: { value: GalleryCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "signature-dishes", label: "Signature Dishes" },
  { value: "private-dining", label: "The Dining Room" },
  { value: "events", label: "Celebrations" },
  { value: "behind-the-scenes", label: "Behind the Scenes" },
  { value: "chef-in-action", label: "Chef in Action" },
  { value: "the-chef", label: "The Chef" },
  { value: "plating", label: "Plating" },
];

export const gallery: GalleryItem[] = [
  // The chef's own photographs, first so they lead the gallery and the home page strip.
  { id: "g27", image: images.hero, category: "chef-in-action", caption: "At the range", span: "wide" },
  { id: "g28", image: images.chefPortrait, category: "the-chef", caption: "Chef Amrit Pal Singh", span: "tall" },
  { id: "g29", image: images.storefrontEvening, category: "private-dining", caption: "37th Avenue at dusk", span: "wide" },
  { id: "g30", image: images.chefKitchenPrep, category: "behind-the-scenes", caption: "Prep before service", span: "tall" },
  { id: "g31", image: images.angelFullRoom, category: "private-dining", caption: "A full house", span: "wide" },
  { id: "g32", image: images.chefBehindTheBar, category: "the-chef", caption: "Behind the bar", span: "tall" },
  { id: "g33", image: images.angelBanquette, category: "private-dining", caption: "Set for service", span: "wide" },
  { id: "g34", image: images.chefInterview, category: "the-chef", caption: "In conversation", span: "wide" },
  { id: "g01", image: images.thaliOverhead, category: "signature-dishes", caption: "A tasting of the house", featured: true, span: "tall" },
  { id: "g03", image: images.paneerCurry, category: "signature-dishes", caption: "Amritsari Paneer Kulcha", featured: true },
  { id: "g04", image: images.tableCandles, category: "private-dining", caption: "A table, ready", featured: true },
  { id: "g06", image: images.curryNaan, category: "signature-dishes", caption: "Mix Veg Kulcha" },
  { id: "g07", image: images.pavBhaji, category: "signature-dishes", caption: "Chole Bhatura" },
  { id: "g08", image: images.karahi, category: "signature-dishes", caption: "From the karahi", span: "wide" },
  { id: "g09", image: images.chefFlame, category: "chef-in-action", caption: "Open flame", span: "wide" },
  { id: "g13", image: images.prepOverhead, category: "behind-the-scenes", caption: "Prep, overhead", span: "wide" },
  { id: "g14", image: images.kitchenLine, category: "behind-the-scenes", caption: "The line" },
  { id: "g16", image: images.angelDiningRoom, category: "private-dining", caption: "The new dining room", span: "wide" },
  { id: "g17", image: images.bar, category: "private-dining", caption: "The bar" },
  { id: "g22", image: images.platedDish, category: "plating", caption: "Detail" },
  { id: "g23", image: images.soupBowl, category: "plating", caption: "A bowl, finished with herbs" },
  { id: "g24", image: images.naanDal, category: "signature-dishes", caption: "Naan and dal" },
  { id: "g25", image: images.dosa, category: "signature-dishes", caption: "Street food, refined" },
  { id: "g26", image: images.curryPan, category: "plating", caption: "Fresh coriander to finish" },
];

export const featuredGallery = gallery.filter((g) => g.featured);
export const galleryByCategory = (category: GalleryCategory) => gallery.filter((g) => g.category === category);
