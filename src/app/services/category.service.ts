import { Injectable, computed, effect, inject, signal } from "@angular/core";
import { Category, DEFAULT_CATEGORIES } from "../models/category.model";
import { TransactionType } from "../models/transaction.model";
import { TransactionService } from "./transaction.service";

const STORAGE_KEY = "finance-tracker:categories";

function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function defaultCategories(): Category[] {
  return DEFAULT_CATEGORIES.map((c) => ({ ...c, id: uid() }));
}

function loadFromStorage(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Category[]) : [];
    return parsed.length ? parsed : defaultCategories();
  } catch {
    return defaultCategories();
  }
}

@Injectable({ providedIn: "root" })
export class CategoryService {
  private readonly txs = inject(TransactionService);
  private readonly _categories = signal<Category[]>(loadFromStorage());
  readonly categories = this._categories.asReadonly();

  readonly expenseCategories = computed(() =>
    this._categories()
      .filter((c) => c.type === "expense")
      .sort((a, b) => a.order - b.order),
  );

  readonly incomeCategories = computed(() =>
    this._categories()
      .filter((c) => c.type === "income")
      .sort((a, b) => a.order - b.order),
  );

  constructor() {
    effect(() => {
      const value = this._categories();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        // storage unavailable, ignore
      }
    });
  }

  categoriesFor(type: TransactionType): Category[] {
    return type === "income" ? this.incomeCategories() : this.expenseCategories();
  }

  categoryMeta(type: TransactionType, name: string): Category {
    const list = this.categoriesFor(type);
    return (
      list.find((c) => c.name === name) ?? {
        id: "",
        name,
        icon: "📦",
        color: "#94a3b8",
        type,
        order: 0,
      }
    );
  }

  add(input: Omit<Category, "id" | "order">): void {
    const siblings = this.categoriesFor(input.type);
    const order = siblings.length ? Math.max(...siblings.map((c) => c.order)) + 1 : 0;
    const category: Category = { ...input, id: uid(), order };
    this._categories.update((list) => [...list, category]);
  }

  update(id: string, input: Omit<Category, "id" | "order" | "type">): void {
    this._categories.update((list) =>
      list.map((c) => (c.id === id ? { ...c, ...input } : c)),
    );
  }

  transactionCount(category: Category): number {
    return this.txs
      .transactions()
      .filter((t) => t.type === category.type && t.category === category.name).length;
  }

  deletionBlockReason(id: string): string | null {
    const category = this._categories().find((c) => c.id === id);
    if (!category) return null;
    if (this.categoriesFor(category.type).length <= 1) {
      return "You must keep at least one category.";
    }
    return null;
  }

  remove(id: string): boolean {
    if (this.deletionBlockReason(id)) return false;
    this._categories.update((list) => list.filter((c) => c.id !== id));
    return true;
  }

  reorder(type: TransactionType, orderedIds: string[]): void {
    this._categories.update((list) =>
      list.map((c) => {
        if (c.type !== type) return c;
        const index = orderedIds.indexOf(c.id);
        return index === -1 ? c : { ...c, order: index };
      }),
    );
  }
}
