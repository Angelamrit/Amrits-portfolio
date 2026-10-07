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
  { id: "g03", image: images.amritsariPaneerKulcha, category: "signature-dishes", caption: "Amritsari Paneer Kulcha", featured: true, span: "wide" },
  { id: "g04", image: images.tableCandles, category: "private-dining", caption: "A table, ready", featured: true },
  { id: "g06", image: images.mixVegKulcha, category: "signature-dishes", caption: "Mix Veg Kulcha", span: "wide" },
  { id: "g07", image: images.choleBhatura, category: "signature-dishes", caption: "Chole Bhatura", span: "wide" },
  // The rest of the signature dishes, in the photographs the dish list on the home page uses.
  // All 4:3 like the "wide" tile, so they show whole (the chicken biryani is 3:2: a sliver of
  // table goes at the sides).
  { id: "g35", image: images.amritsariAlooKulcha, category: "signature-dishes", caption: "Amritsari Aloo Kulcha", span: "wide" },
  { id: "g36", image: images.vegetableDumBiryani, category: "signature-dishes", caption: "Vegetable Dum Biryani", span: "wide" },
  { id: "g37", image: images.chickenDumBiryani, category: "signature-dishes", caption: "Chicken Dum Biryani", span: "wide" },
  { id: "g38", image: images.goatDumBiryani, category: "signature-dishes", caption: "Goat Dum Biryani", span: "wide" },
  { id: "g14", image: images.storefrontDay, category: "private-dining", caption: "Angel on 37th Avenue", span: "tall" },
  { id: "g16", image: images.angelDiningRoom, category: "private-dining", caption: "The new dining room", span: "wide" },
  { id: "g17", image: images.bar, category: "private-dining", caption: "The bar", span: "tall" },
];

export const featuredGallery = gallery.filter((g) => g.featured);
export const galleryByCategory = (category: GalleryCategory) => gallery.filter((g) => g.category === category);
