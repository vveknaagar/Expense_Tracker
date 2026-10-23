import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../login/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count: untaggedCount } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("tagged", false);

  const nav = [
    { href: "/", label: "Dashboard" },
    { href: "/tag", label: "To Tag", badge: untaggedCount ?? 0 },
    { href: "/transactions", label: "Transactions" },
    { href: "/add", label: "Add" },
    { href: "/settings", label: "Settings" },
    { href: "/guide", label: "Guide" },
  ];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-3 py-4">
        <Link href="/" className="text-lg font-bold">
          💸 Expense Tracker
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </header>

      <nav className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-border px-4 pb-2">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
          >
            {item.label}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <main className="flex-1">{children}</main>
    </div>
  );
}
