import { Component, effect, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AccountService } from "../../services/account.service";
import { TransferService } from "../../services/transfer.service";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: "app-transfer-form",
  imports: [FormsModule],
  templateUrl: "./transfer-form.component.html",
  styleUrl: "./transfer-form.component.css",
})
export class TransferFormComponent {
  open = input<boolean>(false);
  closed = output<void>();

  accountsSvc = inject(AccountService);
  private readonly transferSvc = inject(TransferService);

  fromAccountId = signal("");
  toAccountId = signal("");
  amount = signal("");
  date = signal(todayIso());
  note = signal("");
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.open()) {
        const accounts = this.accountsSvc.accounts();
        this.fromAccountId.set(accounts[0]?.id ?? "");
        this.toAccountId.set(accounts[1]?.id ?? accounts[0]?.id ?? "");
        this.amount.set("");
        this.date.set(todayIso());
        this.note.set("");
        this.error.set(null);
      }
    });
  }

  submit(): void {
    const amountNum = parseFloat(this.amount());
    if (!amountNum || amountNum <= 0) {
      this.error.set("Enter a valid amount.");
      return;
    }
    if (!this.fromAccountId() || !this.toAccountId()) {
      this.error.set("Choose both wallets.");
      return;
    }
    if (this.fromAccountId() === this.toAccountId()) {
      this.error.set("Choose two different wallets.");
      return;
    }

    this.transferSvc.add({
      fromAccountId: this.fromAccountId(),
      toAccountId: this.toAccountId(),
      amount: amountNum,
      date: this.date(),
      note: this.note().trim(),
    });
    this.closed.emit();
  }

  cancel(): void {
    this.closed.emit();
  }
}
