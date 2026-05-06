import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Genel bakış özet kartlarına benzer gölgesiz dikdörtgen panel */
export function SmsAdminSection({
  title,
  headerAside,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  /** Başlıkla aynı satırda, sağa hizalı (örn. özet sayaçlar) */
  headerAside?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-md border border-border bg-card text-card-foreground shadow-none overflow-hidden",
        className
      )}
    >
      <h2 className="text-base font-semibold border-b px-4 py-3 flex items-center justify-between gap-3 min-w-0">
        <span className="min-w-0 truncate">{title}</span>
        {headerAside != null ? (
          <span className="shrink-0 text-sm font-normal">{headerAside}</span>
        ) : null}
      </h2>
      <div className={cn("p-4 space-y-4", bodyClassName)}>{children}</div>
    </section>
  );
}
