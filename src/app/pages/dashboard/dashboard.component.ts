import { Component, computed, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { StatCardComponent } from "../../components/stat-card/stat-card.component";
import {
  TransactionFormComponent,
  TransactionDraft,
} from "../../components/transaction-form/transaction-form.component";
import { AccountFormComponent, AccountDraft } from "../../components/account-form/account-form.component";
import { BalanceUpdateComponent } from "../../components/balance-update/balance-update.component";
import { TransferFormComponent } from "../../components/transfer-form/transfer-form.component";
import { TransactionService } from "../../services/transaction.service";
import { AccountService, AccountBalance } from "../../services/account.service";
import { CategoryService } from "../../services/category.service";
import { TransferService } from "../../services/transfer.service";
import { Transaction } from "../../models/transaction.model";
import { Account } from "../../models/account.model";
import { Transfer } from "../../models/transfer.model";
import { formatCurrency } from "../../utils/currency";

export type ActivityItem =
  | { kind: "tx"; date: string; createdAt: number; tx: Transaction }
  | { kind: "transfer"; date: string; createdAt: number; transfer: Transfer };

@Component({
  selector: "app-dashboard",
  imports: [
    RouterLink,
    StatCardComponent,
    TransactionFormComponent,
    AccountFormComponent,
    BalanceUpdateComponent,
    TransferFormComponent,
    CdkDropList,
    CdkDrag,
  ],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.css",
})
export class DashboardComponent {
  categorySvc = inject(CategoryService);
  transferSvc = inject(TransferService);

  formOpen = signal(false);
  editingTx = signal<Transaction | null>(null);
  walletFormOpen = signal(false);
  editingAccount = signal<Account | null>(null);
  walletError = signal<string | null>(null);
  balanceUpdateOpen = signal(false);
  transferFormOpen = signal(false);

  balanceLabel = computed(() => formatCurrency(this.accounts.totalBalance()));
  incomeLabel = computed(() => formatCurrency(this.txs.totalIncome()));
  expenseLabel = computed(() => formatCurrency(this.txs.totalExpense()));

  varianceErrorValue = computed(() => {
    const variance = this.accounts.totalVariance();
    return Math.abs(variance) < 0.005 ? "" : formatCurrency(variance);
  });

  varianceErrorHint = computed(() => {
    const variance = this.accounts.totalVariance();
    if (variance > 0.005) {
      return "Real Balance is Higher, check for any unrecorded income";
    }
    if (variance < -0.005) {
      return "Real Balance is Lower, check for any unrecorded expense";
    }
    return "";
  });

  recentActivity = computed<ActivityItem[]>(() => {
    const items: ActivityItem[] = [
      ...this.txs
        .transactions()
        .map((tx) => ({ kind: "tx" as const, date: tx.date, createdAt: tx.createdAt, tx })),
      ...this.transferSvc
        .transfers()
        .map((transfer) => ({
          kind: "transfer" as const,
          date: transfer.date,
          createdAt: transfer.createdAt,
          transfer,
        })),
    ];
    return items
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
      .slice(0, 6);
  });

  constructor(public txs: TransactionService, public accounts: AccountService) {}

  categoryMeta(type: Transaction["type"], name: string) {
    return this.categorySvc.categoryMeta(type, name);
  }

  walletName(accountId: string): string {
    return this.accounts.accounts().find((a) => a.id === accountId)?.name ?? "Unassigned";
  }

  openEdit(tx: Transaction): void {
    this.editingTx.set(tx);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingTx.set(null);
  }

  handleSave(event: { id: string | null; data: TransactionDraft }): void {
    if (event.id) {
      this.txs.update(event.id, event.data);
    } else {
      this.txs.add(event.data);
    }
    this.closeForm();
  }

  openWalletForm(): void {
    this.editingAccount.set(null);
    this.walletFormOpen.set(true);
  }

  editWallet(acc: Account, event: Event): void {
    event.stopPropagation();
    this.editingAccount.set(acc);
    this.walletFormOpen.set(true);
  }

  closeWalletForm(): void {
    this.walletFormOpen.set(false);
    this.editingAccount.set(null);
  }

  handleWalletSave(event: { id: string | null; data: AccountDraft }): void {
    if (event.id) {
      this.accounts.update(event.id, event.data);
    } else {
      this.accounts.add(event.data);
    }
    this.closeWalletForm();
  }

  deleteWallet(acc: AccountBalance, event: Event): void {
    event.stopPropagation();
    const reason = this.accounts.deletionBlockReason(acc.id);
    if (reason) {
      this.walletError.set(reason);
      return;
    }

    const txCount = this.accounts.linkedTransactionCount(acc.id);
    const transferCount = this.accounts.linkedTransferCount(acc.id);
    let message = `Delete wallet "${acc.name}"?`;
    if (txCount || transferCount) {
      const parts: string[] = [];
      if (txCount) parts.push(`${txCount} transaction${txCount === 1 ? "" : "s"}`);
      if (transferCount) parts.push(`${transferCount} transfer${transferCount === 1 ? "" : "s"}`);
      message += ` It has ${parts.join(" and ")} linked to it. Its balance of ${this.money(acc.balance)} will no longer be counted in any wallet total.`;
    }
    if (!window.confirm(message)) return;

    this.accounts.remove(acc.id);
    this.walletError.set(null);
  }

  dismissWalletError(): void {
    this.walletError.set(null);
  }

  dropWallet(event: CdkDragDrop<AccountBalance[]>): void {
    const ordered = [...event.container.data];
    moveItemInArray(ordered, event.previousIndex, event.currentIndex);
    this.accounts.reorder(ordered.map((a) => a.id));
  }

  openBalanceUpdate(): void {
    this.balanceUpdateOpen.set(true);
  }

  closeBalanceUpdate(): void {
    this.balanceUpdateOpen.set(false);
  }

  openTransferForm(): void {
    this.transferFormOpen.set(true);
  }

  closeTransferForm(): void {
    this.transferFormOpen.set(false);
  }

  varianceLabel(acc: AccountBalance): string {
    if (acc.variance === null) return "";
    if (Math.abs(acc.variance) < 0.005) return "✓ Reconciled";
    const sign = acc.variance > 0 ? "+" : "-";
    return `Off by ${sign}${formatCurrency(Math.abs(acc.variance))}`;
  }

  money(value: number): string {
    return formatCurrency(value);
  }
}
