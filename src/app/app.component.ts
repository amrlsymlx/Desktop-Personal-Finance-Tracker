import { Component, signal } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { ThemeToggleComponent } from "./components/theme-toggle/theme-toggle.component";
import {
  TransactionFormComponent,
  TransactionDraft,
} from "./components/transaction-form/transaction-form.component";
import { TransactionService } from "./services/transaction.service";
import { TransactionType } from "./models/transaction.model";

@Component({
  selector: "app-root",
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ThemeToggleComponent,
    TransactionFormComponent,
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  navItems = [
    { path: "/", label: "Dashboard", icon: "◈", exact: true },
    { path: "/transactions", label: "Transactions", icon: "☰", exact: false },
    { path: "/stats", label: "Stats", icon: "◫", exact: false },
    { path: "/categories", label: "Categories", icon: "◐", exact: false },
  ];

  fabMenuOpen = signal(false);
  addFormOpen = signal(false);
  addType = signal<TransactionType>("expense");

  constructor(private txs: TransactionService) {}

  toggleFabMenu(): void {
    this.fabMenuOpen.update((v) => !v);
  }

  closeFabMenu(): void {
    this.fabMenuOpen.set(false);
  }

  chooseType(type: TransactionType): void {
    this.addType.set(type);
    this.fabMenuOpen.set(false);
    this.addFormOpen.set(true);
  }

  closeAddForm(): void {
    this.addFormOpen.set(false);
  }

  handleAddSave(event: { id: string | null; data: TransactionDraft }): void {
    this.txs.add(event.data);
    this.closeAddForm();
  }
}
