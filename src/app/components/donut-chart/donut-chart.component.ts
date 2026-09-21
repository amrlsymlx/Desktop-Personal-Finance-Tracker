import { Component, computed, input } from "@angular/core";

export interface ChartItem {
  label: string;
  icon: string;
  value: number;
  percent: number;
  color: string;
}

interface Segment extends ChartItem {
  dashArray: string;
  dashOffset: number;
}

const RADIUS = 60;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

@Component({
  selector: "app-donut-chart",
  templateUrl: "./donut-chart.component.html",
  styleUrl: "./donut-chart.component.css",
})
export class DonutChartComponent {
  items = input<ChartItem[]>([]);
  centerLabel = input<string>("Total");
  centerValue = input<string>("");

  readonly circumference = CIRCUMFERENCE;
  readonly radius = RADIUS;

  readonly segments = computed<Segment[]>(() => {
    let offset = 0;
    return this.items().map((item) => {
      const length = (item.percent / 100) * CIRCUMFERENCE;
      const segment: Segment = {
        ...item,
        dashArray: `${length} ${CIRCUMFERENCE - length}`,
        dashOffset: -offset,
      };
      offset += length;
      return segment;
    });
  });
}
