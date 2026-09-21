import { Injectable, computed, effect, signal } from "@angular/core";
import { Transaction, TransactionType } from "../models/transaction.model";

const STORAGE_KEY = "finance-tracker:transactions";

function loadFromStorage(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Transaction[]) : [];
  } catch {
    return [];
  }
}

function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export interface CategoryTotal {
  category: string;
  total: number;
  percent: number;
}

export interface MonthPoint {
  label: string;
  income: number;
  expense: number;
}

@Injectable({ providedIn: "root" })
export class TransactionService {
  private readonly _transactions = signal<Transaction[]>(loadFromStorage());
  readonly transactions = this._transactions.asReadonly();

  readonly sorted = computed(() =>
    [...this._transactions()].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
  );

  readonly totalIncome = computed(() =>
    this._transactions()
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0),
  );

  readonly totalExpense = computed(() =>
    this._transactions()
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0),
  );

  readonly balance = computed(() => this.totalIncome() - this.totalExpense());

  readonly recentTransactions = computed(() => this.sorted().slice(0, 6));

  readonly expenseByCategory = computed<CategoryTotal[]>(() =>
    this.breakdown("expense"),
  );

  readonly incomeByCategory = computed<CategoryTotal[]>(() =>
    this.breakdown("income"),
  );

  readonly monthlyTrend = computed<MonthPoint[]>(() => {
    const months: MonthPoint[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString(undefined, { month: "short" });
      const inMonth = this._transactions().filter((t) => t.date.startsWith(key));
      months.push({
        label,
        income: inMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
        expense: inMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      });
    }
    return months;
  });

  constructor() {
    effect(() => {
      const value = this._transactions();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        // storage unavailable, ignore
      }
    });
  }

  add(input: Omit<Transaction, "id" | "createdAt">): void {
    const tx: Transaction = { ...input, id: uid(), createdAt: Date.now() };
    this._transactions.update((list) => [...list, tx]);
  }

  update(id: string, input: Omit<Transaction, "id" | "createdAt">): void {
    this._transactions.update((list) =>
      list.map((t) => (t.id === id ? { ...t, ...input } : t)),
    );
  }

  remove(id: string): void {
    this._transactions.update((list) => list.filter((t) => t.id !== id));
  }

  private breakdown(type: TransactionType): CategoryTotal[] {
    const items = this._transactions().filter((t) => t.type === type);
    const total = items.reduce((s, t) => s + t.amount, 0);
    const map = new Map<string, number>();
    for (const t of items) {
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    }
    return [...map.entries()]
      .map(([category, amount]) => ({
        category,
        total: amount,
        percent: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }
}
