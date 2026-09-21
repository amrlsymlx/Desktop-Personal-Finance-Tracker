import { TransactionType } from "./transaction.model";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  order: number;
}

export interface CategoryMeta {
  name: string;
  icon: string;
  color: string;
}

export const CATEGORY_ICONS = [
  "🍜",
  "🚗",
  "🛍️",
  "💡",
  "🎮",
  "💊",
  "🏠",
  "📦",
  "💼",
  "🧑‍💻",
  "📈",
  "🎁",
  "✈️",
  "📚",
  "🐾",
  "🎓",
];

export const CATEGORY_COLORS = [
  "#00e5ff",
  "#a855f7",
  "#ec4899",
  "#22ff88",
  "#ffb800",
  "#ff4d6d",
  "#3b82f6",
  "#94a3b8",
];

export const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  { name: "Food & Dining", icon: "🍜", color: "#ff6b6b", type: "expense", order: 0 },
  { name: "Transport", icon: "🚗", color: "#3b82f6", type: "expense", order: 1 },
  { name: "Shopping", icon: "🛍️", color: "#ec4899", type: "expense", order: 2 },
  { name: "Bills & Utilities", icon: "💡", color: "#f59e0b", type: "expense", order: 3 },
  { name: "Entertainment", icon: "🎮", color: "#a855f7", type: "expense", order: 4 },
  { name: "Health", icon: "💊", color: "#22ff88", type: "expense", order: 5 },
  { name: "Housing", icon: "🏠", color: "#00e5ff", type: "expense", order: 6 },
  { name: "Other", icon: "📦", color: "#94a3b8", type: "expense", order: 7 },
  { name: "Salary", icon: "💼", color: "#22ff88", type: "income", order: 0 },
  { name: "Freelance", icon: "🧑‍💻", color: "#00e5ff", type: "income", order: 1 },
  { name: "Investment", icon: "📈", color: "#a855f7", type: "income", order: 2 },
  { name: "Gift", icon: "🎁", color: "#ec4899", type: "income", order: 3 },
  { name: "Other", icon: "📦", color: "#94a3b8", type: "income", order: 4 },
];
