import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./pages/dashboard/dashboard.component").then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: "transactions",
    loadComponent: () =>
      import("./pages/transactions/transactions.component").then(
        (m) => m.TransactionsComponent,
      ),
  },
  {
    path: "stats",
    loadComponent: () =>
      import("./pages/stats/stats.component").then((m) => m.StatsComponent),
  },
  {
    path: "categories",
    loadComponent: () =>
      import("./pages/categories/categories.component").then(
        (m) => m.CategoriesComponent,
      ),
  },
  { path: "**", redirectTo: "" },
];
