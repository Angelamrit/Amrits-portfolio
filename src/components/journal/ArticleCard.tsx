import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Article } from "@/types/content";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

export function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  return (
    <SpotlightCard as="article" className={cn("group relative p-3", featured && "grid gap-6 lg:grid-cols-12 lg:items-center")} tilt={featured ? 1.5 : 3}>
      <Link href={`/journal/${article.slug}`} className="absolute inset-0 z-[4]" aria-label={article.title} />
      <div className={cn(featured && "lg:col-span-7")}>
        <ImageFrame
          image={article.cover}
          ratio={featured ? "3/2" : "4/3"}
          hover
          reveal="none"
          sizes={featured ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
        />
      </div>
      <div className={cn("p-4 md:p-5", featured && "lg:col-span-5 lg:p-8")}>
        <div className="flex flex-wrap items-center gap-3">
          <p className="eyebrow text-[0.6rem] text-muted">
            {fmt(article.date)} · {article.readingTime} min read
          </p>
          {article.status === "draft" && <Badge tone="gold">Draft</Badge>}
        </div>
        <h3 className={cn("mt-3 font-display font-light transition-colors group-hover:text-gold-light", featured ? "text-display-md" : "text-display-sm")}>
          {article.title}
        </h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-fg/65">{article.excerpt}</p>
        <span className="mt-5 inline-flex items-center gap-2 eyebrow text-gold-light">
          Read <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.75} />
        </span>
      </div>
    </SpotlightCard>
  );
}
