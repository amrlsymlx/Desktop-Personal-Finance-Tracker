import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  TransactionFormComponent,
  TransactionDraft,
} from "../../components/transaction-form/transaction-form.component";
import { TransactionService } from "../../services/transaction.service";
import { AccountService } from "../../services/account.service";
import { CategoryService } from "../../services/category.service";
import { Transaction, TransactionType } from "../../models/transaction.model";
import { formatCurrency } from "../../utils/currency";

type TypeFilter = "all" | TransactionType;

@Component({
  selector: "app-transactions",
  imports: [FormsModule, TransactionFormComponent],
  templateUrl: "./transactions.component.html",
  styleUrl: "./transactions.component.css",
})
export class TransactionsComponent {
  search = signal("");
  typeFilter = signal<TypeFilter>("all");

  formOpen = signal(false);
  editingTx = signal<Transaction | null>(null);

  filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const type = this.typeFilter();
    return this.txs.sorted().filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (!term) return true;
      return (
        t.category.toLowerCase().includes(term) ||
        (t.note ?? "").toLowerCase().includes(term)
      );
    });
  });

  categorySvc = inject(CategoryService);

  constructor(public txs: TransactionService, public accounts: AccountService) {}

  categoryMeta(type: Transaction["type"], name: string) {
    return this.categorySvc.categoryMeta(type, name);
  }

  money = formatCurrency;

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

  remove(id: string, event: Event): void {
    event.stopPropagation();
    this.txs.remove(id);
  }
}
