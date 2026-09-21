import { Component, effect, inject, input, output, signal, untracked } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AccountService } from "../../services/account.service";
import { formatCurrency } from "../../utils/currency";

interface VarianceInfo {
  label: string;
  isOff: boolean;
}

@Component({
  selector: "app-balance-update",
  imports: [FormsModule],
  templateUrl: "./balance-update.component.html",
  styleUrl: "./balance-update.component.css",
})
export class BalanceUpdateComponent {
  open = input<boolean>(false);
  closed = output<void>();

  accountsSvc = inject(AccountService);
  values = signal<Record<string, string>>({});
  formatCurrency = formatCurrency;

  constructor() {
    effect(() => {
      if (this.open()) {
        untracked(() => {
          const map: Record<string, string> = {};
          for (const acc of this.accountsSvc.accountsWithBalance()) {
            map[acc.id] =
              acc.actualBalance != null
                ? String(acc.actualBalance)
                : acc.balance.toFixed(2);
          }
          this.values.set(map);
        });
      }
    });
  }

  setValue(id: string, value: string | number): void {
    this.values.update((m) => ({ ...m, [id]: String(value) }));
  }

  variance(id: string, calculated: number): VarianceInfo | null {
    const raw = this.values()[id];
    if (raw === undefined || String(raw).trim() === "") return null;
    const num = parseFloat(raw);
    if (isNaN(num)) return null;
    const diff = num - calculated;
    if (Math.abs(diff) < 0.005) {
      return { label: "✓ Matches calculated", isOff: false };
    }
    const sign = diff > 0 ? "+" : "-";
    return { label: `Off by ${sign}${formatCurrency(Math.abs(diff))}`, isOff: true };
  }

  submit(): void {
    for (const [id, raw] of Object.entries(this.values())) {
      const num = parseFloat(raw);
      if (!isNaN(num)) {
        this.accountsSvc.updateActualBalance(id, num);
      }
    }
    this.closed.emit();
  }

  cancel(): void {
    this.closed.emit();
  }
}
