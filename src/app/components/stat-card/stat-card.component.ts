import { Component, input } from "@angular/core";

@Component({
  selector: "app-stat-card",
  templateUrl: "./stat-card.component.html",
  styleUrl: "./stat-card.component.css",
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string>();
  icon = input<string>("✨");
  tone = input<"up" | "down" | "neutral">("neutral");
  sub = input<string>("");
  errorValue = input<string>("");
  errorHint = input<string>("");
}
