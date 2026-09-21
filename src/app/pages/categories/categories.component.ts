import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CdkDropList, CdkDrag, CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { CategoryService } from "../../services/category.service";
import { Category, CATEGORY_COLORS, CATEGORY_ICONS } from "../../models/category.model";
import { TransactionType } from "../../models/transaction.model";

@Component({
  selector: "app-categories",
  imports: [FormsModule, CdkDropList, CdkDrag],
  templateUrl: "./categories.component.html",
  styleUrl: "./categories.component.css",
})
export class CategoriesComponent {
  categorySvc = inject(CategoryService);

  activeType = signal<TransactionType>("expense");
  mode = signal<"list" | "form">("list");
  editing = signal<Category | null>(null);
  error = signal<string | null>(null);

  icons = CATEGORY_ICONS;
  colors = CATEGORY_COLORS;

  name = signal("");
  icon = signal(CATEGORY_ICONS[0]);
  color = signal(CATEGORY_COLORS[0]);

  list(): Category[] {
    return this.categorySvc.categoriesFor(this.activeType());
  }

  setType(type: TransactionType): void {
    this.activeType.set(type);
    this.error.set(null);
    this.mode.set("list");
  }

  startAdd(): void {
    this.editing.set(null);
    this.name.set("");
    this.icon.set(CATEGORY_ICONS[0]);
    this.color.set(CATEGORY_COLORS[0]);
    this.mode.set("form");
  }

  startEdit(cat: Category): void {
    this.editing.set(cat);
    this.name.set(cat.name);
    this.icon.set(cat.icon);
    this.color.set(cat.color);
    this.mode.set("form");
  }

  saveForm(): void {
    const name = this.name().trim();
    if (!name) return;
    const editing = this.editing();
    if (editing) {
      this.categorySvc.update(editing.id, { name, icon: this.icon(), color: this.color() });
    } else {
      this.categorySvc.add({ name, icon: this.icon(), color: this.color(), type: this.activeType() });
    }
    this.mode.set("list");
  }

  cancelForm(): void {
    this.mode.set("list");
  }

  deleteCategory(cat: Category, event: Event): void {
    event.stopPropagation();
    const reason = this.categorySvc.deletionBlockReason(cat.id);
    if (reason) {
      this.error.set(reason);
      return;
    }

    const txCount = this.categorySvc.transactionCount(cat);
    let message = `Delete category "${cat.name}"?`;
    if (txCount) {
      message += ` It has ${txCount} transaction${txCount === 1 ? "" : "s"} using it — they'll keep this category's name, but it will no longer be selectable for new transactions.`;
    }
    if (!window.confirm(message)) return;

    this.categorySvc.remove(cat.id);
    this.error.set(null);
  }

  drop(event: CdkDragDrop<Category[]>): void {
    const ordered = [...event.container.data];
    moveItemInArray(ordered, event.previousIndex, event.currentIndex);
    this.categorySvc.reorder(
      this.activeType(),
      ordered.map((c) => c.id),
    );
  }

  dismissError(): void {
    this.error.set(null);
  }
}
