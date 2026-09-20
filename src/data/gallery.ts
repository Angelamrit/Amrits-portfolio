import type { GalleryCategory, GalleryItem } from "@/types/content";
import { images } from "./images";

export const galleryCategories: { value: GalleryCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "signature-dishes", label: "Signature Dishes" },
  { value: "private-dining", label: "Private Dining" },
  { value: "events", label: "Events" },
  { value: "behind-the-scenes", label: "Behind the Scenes" },
  { value: "chef-in-action", label: "Chef in Action" },
  { value: "plating", label: "Plating" },
];

export const gallery: GalleryItem[] = [
  { id: "g01", image: images.thaliOverhead, category: "signature-dishes", caption: "A tasting of the house", featured: true, span: "tall" },
  { id: "g02", image: images.chefPlating, category: "chef-in-action", caption: "At the pass", featured: true, span: "wide" },
  { id: "g03", image: images.paneerCurry, category: "signature-dishes", caption: "Amritsari Paneer Kulcha", featured: true },
  { id: "g04", image: images.tableCandles, category: "private-dining", caption: "A private table, ready", featured: true },
  { id: "g05", image: images.platedFine, category: "plating", caption: "Composed, not crowded", featured: true },
  { id: "g06", image: images.curryNaan, category: "signature-dishes", caption: "Mix Veg Kulcha" },
  { id: "g07", image: images.pavBhaji, category: "signature-dishes", caption: "Chole Bhatura" },
  { id: "g08", image: images.karahi, category: "signature-dishes", caption: "From the karahi", span: "wide" },
  { id: "g09", image: images.chefFlame, category: "chef-in-action", caption: "Open flame", span: "wide" },
  { id: "g10", image: images.chefCooking, category: "chef-in-action", caption: "Service" },
  { id: "g11", image: images.chopping, category: "behind-the-scenes", caption: "Mise en place" },
  { id: "g12", image: images.choppingHerbs, category: "behind-the-scenes", caption: "Fresh coriander, every morning" },
  { id: "g13", image: images.prepOverhead, category: "behind-the-scenes", caption: "Prep, overhead", span: "wide" },
  { id: "g14", image: images.kitchenLine, category: "behind-the-scenes", caption: "The line" },
  { id: "g15", image: images.tableSetting, category: "private-dining", caption: "Set for eight" },
  { id: "g16", image: images.angelDiningRoom, category: "private-dining", caption: "The new dining room", span: "wide" },
  { id: "g17", image: images.bar, category: "private-dining", caption: "The bar" },
  { id: "g18", image: images.toast, category: "events", caption: "A toast" },
  { id: "g19", image: images.banquet, category: "events", caption: "Dressed for a wedding", span: "wide" },
  { id: "g20", image: images.tableFlorals, category: "events", caption: "Florals and glassware" },
  { id: "g21", image: images.restaurantOverhead, category: "events", caption: "A full room" },
  { id: "g22", image: images.platedDish, category: "plating", caption: "Detail" },
  { id: "g23", image: images.soupBowl, category: "plating", caption: "A bowl, finished with herbs" },
  { id: "g24", image: images.naanDal, category: "signature-dishes", caption: "Naan and dal" },
  { id: "g25", image: images.dosa, category: "signature-dishes", caption: "Street food, refined" },
  { id: "g26", image: images.curryPan, category: "plating", caption: "Fresh coriander to finish" },
];

export const featuredGallery = gallery.filter((g) => g.featured);
export const galleryByCategory = (category: GalleryCategory) => gallery.filter((g) => g.category === category);
