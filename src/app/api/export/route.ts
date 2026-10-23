import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { currentMonth, isValidMonth, monthRange } from "@/lib/dates";
import type { Transaction } from "@/lib/types";

function csvEscape(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const monthParam = req.nextUrl.searchParams.get("month") ?? currentMonth();
  const month = isValidMonth(monthParam) ? monthParam : currentMonth();
  const { start, end } = monthRange(month);

  const { data, error } = await supabase
    .from("transactions")
    .select(
      "txn_date, merchant, amount, direction, source, tagged, raw_sms, categories(name), accounts(name)"
    )
    .gte("txn_date", start)
    .lt("txn_date", end)
    .order("txn_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as Transaction[];
  const header = "Date,Merchant,Amount,Direction,Category,Account,Source,Raw SMS";
  const lines = rows.map((t) =>
    [
      t.txn_date,
      csvEscape(t.merchant),
      String(t.amount),
      t.direction,
      csvEscape(t.categories?.name ?? ""),
      csvEscape(t.accounts?.name ?? ""),
      t.source,
      csvEscape(t.raw_sms ?? ""),
    ].join(",")
  );
  const csv = [header, ...lines].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transactions-${month}.csv"`,
    },
  });
}
