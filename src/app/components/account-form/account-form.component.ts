import { Component, effect, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Account, ACCOUNT_COLORS, ACCOUNT_ICONS } from "../../models/account.model";

export type AccountDraft = Omit<Account, "id" | "createdAt" | "order">;

@Component({
  selector: "app-account-form",
  imports: [FormsModule],
  templateUrl: "./account-form.component.html",
  styleUrl: "./account-form.component.css",
})
export class AccountFormComponent {
  open = input<boolean>(false);
  editing = input<Account | null>(null);

  saved = output<{ id: string | null; data: AccountDraft }>();
  closed = output<void>();

  icons = ACCOUNT_ICONS;
  colors = ACCOUNT_COLORS;

  name = signal("");
  icon = signal(ACCOUNT_ICONS[0]);
  color = signal(ACCOUNT_COLORS[0]);
  startingBalance = signal("");

  constructor() {
    effect(() => {
      const acc = this.editing();
      if (acc) {
        this.name.set(acc.name);
        this.icon.set(acc.icon);
        this.color.set(acc.color);
        this.startingBalance.set(String(acc.startingBalance));
      } else if (this.open()) {
        this.reset();
      }
    });
  }

  submit(): void {
    const name = this.name().trim();
    if (!name) return;
    const startingBalance = parseFloat(this.startingBalance()) || 0;
    this.saved.emit({
      id: this.editing()?.id ?? null,
      data: {
        name,
        icon: this.icon(),
        color: this.color(),
        startingBalance,
      },
    });
    this.reset();
  }

  cancel(): void {
    this.closed.emit();
    this.reset();
  }

  private reset(): void {
    this.name.set("");
    this.icon.set(ACCOUNT_ICONS[0]);
    this.color.set(ACCOUNT_COLORS[0]);
    this.startingBalance.set("");
  }
}
