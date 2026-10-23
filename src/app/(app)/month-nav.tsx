import Link from "next/link";
import { addMonths, monthLabel } from "@/lib/dates";

export function MonthNav({
  month,
  basePath,
  extraQuery = "",
}: {
  month: string;
  basePath: string;
  extraQuery?: string;
}) {
  const href = (m: string) => `${basePath}?month=${m}${extraQuery}`;
  return (
    <div className="flex items-center gap-2">
      <Link
        href={href(addMonths(month, -1))}
        className="rounded-lg border border-border bg-surface px-2.5 py-1 text-sm hover:border-accent"
        aria-label="Previous month"
      >
        ←
      </Link>
      <span className="min-w-36 text-center text-sm font-semibold">
        {monthLabel(month)}
      </span>
      <Link
        href={href(addMonths(month, 1))}
        className="rounded-lg border border-border bg-surface px-2.5 py-1 text-sm hover:border-accent"
        aria-label="Next month"
      >
        →
      </Link>
    </div>
  );
}
