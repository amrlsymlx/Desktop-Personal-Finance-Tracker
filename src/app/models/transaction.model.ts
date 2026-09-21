export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  accountId: string;
  date: string;
  note?: string;
  attachmentName?: string;
  attachmentDataUrl?: string;
  createdAt: number;
}
