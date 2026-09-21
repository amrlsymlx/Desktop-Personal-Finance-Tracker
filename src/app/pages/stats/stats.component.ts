import { Component, computed, inject } from "@angular/core";
import { DonutChartComponent, ChartItem } from "../../components/donut-chart/donut-chart.component";
import { TransactionService } from "../../services/transaction.service";
import { CategoryService } from "../../services/category.service";
import { formatCurrency } from "../../utils/currency";

@Component({
  selector: "app-stats",
  imports: [DonutChartComponent],
  templateUrl: "./stats.component.html",
  styleUrl: "./stats.component.css",
})
export class StatsComponent {
  categorySvc = inject(CategoryService);

  expenseLabel = computed(() => formatCurrency(this.txs.totalExpense()));

  expenseChartItems = computed<ChartItem[]>(() =>
    this.txs.expenseByCategory().map((c) => {
      const meta = this.categorySvc.categoryMeta("expense", c.category);
      return { label: c.category, icon: meta.icon, value: c.total, percent: c.percent, color: meta.color };
    }),
  );

  trend = computed(() => {
    const points = this.txs.monthlyTrend();
    const max = Math.max(1, ...points.map((p) => Math.max(p.income, p.expense)));
    return points.map((p) => ({
      ...p,
      incomeHeight: (p.income / max) * 100,
      expenseHeight: (p.expense / max) * 100,
    }));
  });

  constructor(public txs: TransactionService) {}
}
