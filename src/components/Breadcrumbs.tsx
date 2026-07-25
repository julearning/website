import Link from "next/link";

export type Crumb = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground/60">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-2">
            {i > 0 && <span className="text-muted-foreground/20">›</span>}
            {item.href && !isLast ? (
              <Link href={item.href} className="transition-colors hover:text-foreground/60">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-foreground/60" : ""}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
