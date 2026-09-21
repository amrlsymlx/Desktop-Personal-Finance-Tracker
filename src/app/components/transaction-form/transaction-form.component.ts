import { Component, computed, effect, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Transaction, TransactionType } from "../../models/transaction.model";
import { AccountService } from "../../services/account.service";
import { CategoryService } from "../../services/category.service";

export type TransactionDraft = Omit<Transaction, "id" | "createdAt">;

const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: "app-transaction-form",
  imports: [FormsModule],
  templateUrl: "./transaction-form.component.html",
  styleUrl: "./transaction-form.component.css",
})
export class TransactionFormComponent {
  open = input<boolean>(false);
  editing = input<Transaction | null>(null);
  initialType = input<TransactionType>("expense");

  saved = output<{ id: string | null; data: TransactionDraft }>();
  closed = output<void>();

  accountsSvc = inject(AccountService);
  categorySvc = inject(CategoryService);

  type = signal<TransactionType>("expense");
  amount = signal<string>("");
  category = signal<string>("");
  accountId = signal<string>("");
  date = signal<string>(todayIso());
  note = signal<string>("");
  attachmentName = signal<string | null>(null);
  attachmentDataUrl = signal<string | null>(null);
  attachmentError = signal<string | null>(null);

  categories = computed(() => this.categorySvc.categoriesFor(this.type()));

  constructor() {
    effect(() => {
      const tx = this.editing();
      if (tx) {
        this.type.set(tx.type);
        this.amount.set(String(tx.amount));
        this.category.set(tx.category);
        this.accountId.set(tx.accountId ?? this.accountsSvc.accounts()[0]?.id ?? "");
        this.date.set(tx.date);
        this.note.set(tx.note ?? "");
        this.attachmentName.set(tx.attachmentName ?? null);
        this.attachmentDataUrl.set(tx.attachmentDataUrl ?? null);
      } else if (this.open()) {
        this.resetForm();
      }
    });
  }

  setType(type: TransactionType): void {
    this.type.set(type);
    const list = this.categorySvc.categoriesFor(type);
    if (!list.some((c) => c.name === this.category())) {
      this.category.set(list[0]?.name ?? "");
    }
  }

  onAttachmentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > MAX_ATTACHMENT_BYTES) {
      this.attachmentError.set("Attachment must be smaller than 3MB.");
      input.value = "";
      return;
    }

    this.attachmentError.set(null);
    const reader = new FileReader();
    reader.onload = () => {
      this.attachmentName.set(file.name);
      this.attachmentDataUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);
    input.value = "";
  }

  removeAttachment(): void {
    this.attachmentName.set(null);
    this.attachmentDataUrl.set(null);
    this.attachmentError.set(null);
  }

  submit(): void {
    const amountNum = parseFloat(this.amount());
    if (!amountNum || amountNum <= 0 || !this.category() || !this.date() || !this.accountId()) return;

    this.saved.emit({
      id: this.editing()?.id ?? null,
      data: {
        type: this.type(),
        amount: amountNum,
        category: this.category() || this.categories()[0]?.name || "",
        accountId: this.accountId(),
        date: this.date(),
        note: this.note().trim(),
        attachmentName: this.attachmentName() ?? undefined,
        attachmentDataUrl: this.attachmentDataUrl() ?? undefined,
      },
    });
    this.resetForm();
  }

  cancel(): void {
    this.closed.emit();
    this.resetForm();
  }

  private resetForm(): void {
    const type = this.initialType();
    this.type.set(type);
    this.amount.set("");
    this.category.set(this.categorySvc.categoriesFor(type)[0]?.name ?? "");
    this.accountId.set(this.accountsSvc.accounts()[0]?.id ?? "");
    this.date.set(todayIso());
    this.note.set("");
    this.attachmentName.set(null);
    this.attachmentDataUrl.set(null);
    this.attachmentError.set(null);
  }
}
