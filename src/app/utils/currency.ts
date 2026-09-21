export function formatCurrency(value: number): string {
  const sign = value < 0 ? "-" : "";
  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  return `${sign}RM ${formatted}`;
}
