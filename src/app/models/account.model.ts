export interface Account {
  id: string;
  name: string;
  icon: string;
  color: string;
  startingBalance: number;
  createdAt: number;
  order: number;
  actualBalance?: number;
  actualBalanceUpdatedAt?: number;
}

export const ACCOUNT_ICONS = ["💵", "💳", "🏦", "📱", "💰", "🪙", "📈", "🎯"];

export const ACCOUNT_COLORS = [
  "#00e5ff",
  "#a855f7",
  "#ec4899",
  "#22ff88",
  "#ffb800",
  "#ff4d6d",
  "#3b82f6",
];
