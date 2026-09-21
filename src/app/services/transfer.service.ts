import { Injectable, effect, signal } from "@angular/core";
import { Transfer } from "../models/transfer.model";

const STORAGE_KEY = "finance-tracker:transfers";

function loadFromStorage(): Transfer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Transfer[]) : [];
  } catch {
    return [];
  }
}

function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

@Injectable({ providedIn: "root" })
export class TransferService {
  private readonly _transfers = signal<Transfer[]>(loadFromStorage());
  readonly transfers = this._transfers.asReadonly();

  constructor() {
    effect(() => {
      const value = this._transfers();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        // storage unavailable, ignore
      }
    });
  }

  add(input: Omit<Transfer, "id" | "createdAt">): void {
    const transfer: Transfer = { ...input, id: uid(), createdAt: Date.now() };
    this._transfers.update((list) => [...list, transfer]);
  }
}
