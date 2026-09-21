import { Injectable, effect, signal } from "@angular/core";

export type Theme = "light" | "dark";

const STORAGE_KEY = "finance-tracker:theme";

function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // storage unavailable, fall through
  }
  return window.matchMedia?.("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

@Injectable({ providedIn: "root" })
export class ThemeService {
  private readonly _theme = signal<Theme>(initialTheme());
  readonly theme = this._theme.asReadonly();

  constructor() {
    effect(() => {
      const value = this._theme();
      document.documentElement.setAttribute("data-theme", value);
      try {
        localStorage.setItem(STORAGE_KEY, value);
      } catch {
        // storage unavailable, ignore
      }
    });
  }

  toggle(): void {
    this._theme.update((t) => (t === "dark" ? "light" : "dark"));
  }
}
