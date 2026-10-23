import { todayInIndia } from "./dates";

export type ParsedSms = {
  amount: number;
  direction: "debit" | "credit";
  merchant: string;
  txnDate: string;
};

const IGNORE_PATTERNS: RegExp[] = [
  /\botp\b/i,
  /one[\s-]?time\s+pass/i,
  /verification\s+code/i,
  /\bcode\s+is\b/i,
  /do\s+not\s+share/i,
  /\boffer(s)?\b/i,
  /\bdiscount\b/i,
  /\bcashback\s+(up\s*to|of\s+up)/i,
  /\bsale\b/i,
  /\bwin\b/i,
  /\bcongratulations\b/i,
  /apply\s+now/i,
  /\bpre-?approved\b/i,
  /recharge\s+now/i,
  /\bt\s*&\s*c\b/i,
  /\bunsubscribe\b/i,
  /\bemi\s+starting\b/i,
  /will\s+be\s+(debited|deducted)/i, // upcoming auto-debit reminders, not actual transactions
  /\brequested\s+money\b/i,
  /payment\s+request/i,
  /\bcollect\s+request\b/i,
];

const DEBIT_RE =
  /\b(debited|debit|spent|paid|payment\s+of|sent|withdrawn|withdrawal|purchase[d]?|deducted)\b/i;
const CREDIT_RE = /\b(credited|received|deposited|refund(?:ed)?)\b/i;

const AMOUNT_PATTERNS: RegExp[] = [
  /(?:rs\.?|inr|₹)\s*:?\s*([\d,]+(?:\.\d{1,2})?)/i,
  /\b([\d,]+(?:\.\d{1,2})?)\s*(?:rs\.?|inr)\b/i,
  /\b(?:by|of|for)\s+([\d,]+\.\d{1,2})\b/i,
];

const REJECT_MERCHANTS =
  /^(you|your|yours|the|a\/?c|ac|acct|account|bank|upi|vpa|card|credit|debit|wallet|linked|no|number|customer|user|beneficiary|mobile)$/i;

const MERCHANT_PATTERNS: RegExp[] = [
  // UPI VPA: "to VPA swiggy.stores@icici", "from q123456@ybl"
  /(?:to|at|from|by)\s+(?:vpa\s+)?([a-z0-9._-]{2,50})@[a-z0-9.-]+/i,
  // SBI style: "trf to MERCHANT Refno"
  /\btrf\s+to\s+([a-z0-9 .&'*_-]{2,40}?)\s+(?:ref|refno)/i,
  // "UPI/P2M/123456789/MERCHANT NAME" or "UPI/123456/merchant"
  /\bupi\/(?:p2[ma]\/)?\d+\/([^\/\n]{2,40}?)(?:\/|\s+on\b|\s+ref|\.|,|$)/i,
  // "Info: MERCHANT" / "Info- UPI-MERCHANT"
  /\binfo[:\-*]\s*(?:upi[\/-])?([a-z0-9 &'*_-]{2,40}?)(?=\s+(?:avl|bal|ref)\b|[.,;]|$)/i,
  // "at MERCHANT on", "to MERCHANT on/via/ref"
  /\b(?:at|to)\s+([a-z0-9][a-z0-9 .&'*_-]{1,40}?)(?=\s+(?:on|dt|dated|via|using|ref\b|refno|upi|avl|bal|info|txn|towards)\b|[.,;]|$)/i,
  // credits: "from MERCHANT on/ref"
  /\bfrom\s+([a-z0-9][a-z0-9 .&'*_-]{1,40}?)(?=\s+(?:on|via|ref\b|refno|avl|bal|to)\b|[.,;]|$)/i,
];

function cleanMerchant(candidate: string): string | null {
  let m = candidate.replace(/\s+/g, " ").trim();
  m = m.replace(/^[\s.,:*-]+|[\s.,:*-]+$/g, "");
  if (!m) return null;
  if (/^\d+$/.test(m)) return null;
  if (REJECT_MERCHANTS.test(m)) return null;
  // reject fragments like "your a" that sneak past the lookahead
  if (/^(your|you|the|a|an)\b/i.test(m) && m.length < 12) return null;
  if (m.length > 40) m = m.slice(0, 40).trim();
  return m;
}

function extractMerchant(text: string): string {
  for (const re of MERCHANT_PATTERNS) {
    const match = re.exec(text);
    if (match?.[1]) {
      const cleaned = cleanMerchant(match[1]);
      if (cleaned) return cleaned;
    }
  }
  return "Unknown";
}

function extractAmount(text: string): number | null {
  for (const re of AMOUNT_PATTERNS) {
    const match = re.exec(text);
    if (match?.[1]) {
      const value = Number(match[1].replace(/,/g, ""));
      if (Number.isFinite(value) && value > 0) return value;
    }
  }
  return null;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function buildDate(y: number, m: number, d: number): string | null {
  if (y < 100) y += 2000;
  if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function extractDate(text: string): string {
  // ISO: 2026-10-23
  const iso = /\b(20\d{2})-(\d{2})-(\d{2})\b/.exec(text);
  if (iso) {
    const date = buildDate(+iso[1], +iso[2], +iso[3]);
    if (date) return date;
  }
  // dd-MMM-yy, dd MMM yyyy, 12Oct25
  const dmon = /\b(\d{1,2})[-\s]?([a-z]{3})[a-z]*[-,\s]*(\d{2,4})\b/i.exec(text);
  if (dmon) {
    const month = MONTHS[dmon[2].toLowerCase()];
    if (month) {
      const date = buildDate(+dmon[3], month, +dmon[1]);
      if (date) return date;
    }
  }
  // dd-mm-yy(yy), dd/mm/yyyy, dd.mm.yy
  const dmy = /\b(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})\b/.exec(text);
  if (dmy) {
    let d = +dmy[1];
    let m = +dmy[2];
    if (m > 12 && d <= 12) [d, m] = [m, d];
    const date = buildDate(+dmy[3], m, d);
    if (date) return date;
  }
  return todayInIndia();
}

/**
 * Parses a bank/UPI transaction SMS. Returns null for anything that does not
 * look like an actual transaction (OTPs, promos, balance alerts, reminders).
 */
export function parseSms(raw: string): ParsedSms | null {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return null;

  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.test(text)) return null;
  }

  const debitMatch = DEBIT_RE.exec(text);
  const creditMatch = CREDIT_RE.exec(text);
  if (!debitMatch && !creditMatch) return null;

  const direction: "debit" | "credit" =
    !creditMatch ? "debit"
    : !debitMatch ? "credit"
    : debitMatch.index <= creditMatch.index ? "debit"
    : "credit";

  const amount = extractAmount(text);
  if (amount === null) return null;

  return {
    amount,
    direction,
    merchant: extractMerchant(text),
    txnDate: extractDate(text),
  };
}
