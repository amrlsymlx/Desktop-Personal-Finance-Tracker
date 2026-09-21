import { Injectable, computed, effect, inject, signal } from "@angular/core";
import { Account } from "../models/account.model";
import { TransactionService } from "./transaction.service";
import { TransferService } from "./transfer.service";

const STORAGE_KEY = "finance-tracker:accounts";

const DEFAULT_ACCOUNT: Account = {
  id: "default-cash",
  name: "Cash",
  icon: "💵",
  color: "#00e5ff",
  startingBalance: 0,
  createdAt: Date.now(),
  order: 0,
};

function loadFromStorage(): Account[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Account[]) : [];
    if (!parsed.length) return [DEFAULT_ACCOUNT];
    return parsed.map((a, i) => ({ ...a, order: a.order ?? i }));
  } catch {
    return [DEFAULT_ACCOUNT];
  }
}

function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export interface AccountBalance extends Account {
  balance: number;
  variance: number | null;
}

@Injectable({ providedIn: "root" })
export class AccountService {
  private readonly txs = inject(TransactionService);
  private readonly transfers = inject(TransferService);
  private readonly _accounts = signal<Account[]>(loadFromStorage());

  readonly accounts = computed(() =>
    [...this._accounts()].sort((a, b) => a.order - b.order),
  );

  readonly accountsWithBalance = computed<AccountBalance[]>(() => {
    const accounts = this.accounts();
    const firstId = accounts[0]?.id;
    const transactions = this.txs.transactions();
    const transfers = this.transfers.transfers();
    return accounts.map((acc) => {
      const txDelta = transactions
        .filter((t) => t.accountId === acc.id || (!t.accountId && acc.id === firstId))
        .reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0);
      const transferDelta = transfers.reduce((sum, tr) => {
        if (tr.fromAccountId === acc.id) return sum - tr.amount;
        if (tr.toAccountId === acc.id) return sum + tr.amount;
        return sum;
      }, 0);
      const balance = acc.startingBalance + txDelta + transferDelta;
      const variance = acc.actualBalance != null ? acc.actualBalance - balance : null;
      return { ...acc, balance, variance };
    });
  });

  readonly totalBalance = computed(() =>
    this.accountsWithBalance().reduce((sum, a) => sum + a.balance, 0),
  );

  readonly totalVariance = computed(() =>
    this.accountsWithBalance().reduce((sum, a) => sum + (a.variance ?? 0), 0),
  );

  readonly totalVariancePercent = computed(() => {
    const total = this.totalBalance();
    if (Math.abs(total) < 0.005) return 0;
    return (this.totalVariance() / total) * 100;
  });

  constructor() {
    effect(() => {
      const value = this._accounts();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        // storage unavailable, ignore
      }
    });
  }

  add(input: Omit<Account, "id" | "createdAt" | "order">): void {
    const existing = this._accounts();
    const order = existing.length ? Math.max(...existing.map((a) => a.order)) + 1 : 0;
    const acc: Account = { ...input, id: uid(), createdAt: Date.now(), order };
    this._accounts.update((list) => [...list, acc]);
  }

  update(id: string, input: Omit<Account, "id" | "createdAt" | "order">): void {
    this._accounts.update((list) =>
      list.map((a) => (a.id === id ? { ...a, ...input } : a)),
    );
  }

  reorder(orderedIds: string[]): void {
    this._accounts.update((list) =>
      list.map((a) => {
        const index = orderedIds.indexOf(a.id);
        return index === -1 ? a : { ...a, order: index };
      }),
    );
  }

  deletionBlockReason(id: string): string | null {
    if (this._accounts().length <= 1) {
      return "You must keep at least one wallet.";
    }
    return null;
  }

  linkedTransactionCount(id: string): number {
    const firstId = this.accounts()[0]?.id;
    return this.txs
      .transactions()
      .filter((t) => t.accountId === id || (!t.accountId && id === firstId)).length;
  }

  linkedTransferCount(id: string): number {
    return this.transfers
      .transfers()
      .filter((t) => t.fromAccountId === id || t.toAccountId === id).length;
  }

  remove(id: string): boolean {
    if (this.deletionBlockReason(id)) return false;
    this._accounts.update((list) => list.filter((a) => a.id !== id));
    return true;
  }

  updateActualBalance(id: string, actualBalance: number): void {
    this._accounts.update((list) =>
      list.map((a) =>
        a.id === id ? { ...a, actualBalance, actualBalanceUpdatedAt: Date.now() } : a,
      ),
    );
  }
}
