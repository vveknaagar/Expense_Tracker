export type Account = {
  id: string;
  user_id: string;
  name: string;
  sender_match: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string | null;
  raw_sms: string | null;
  sender: string | null;
  amount: number;
  direction: "debit" | "credit";
  merchant: string;
  txn_date: string;
  tagged: boolean;
  source: "sms" | "manual";
  created_at: string;
  categories?: Pick<Category, "id" | "name" | "color"> | null;
  accounts?: Pick<Account, "id" | "name"> | null;
};

export type MerchantRule = {
  id: string;
  user_id: string;
  merchant_pattern: string;
  category_id: string;
  created_at: string;
};
