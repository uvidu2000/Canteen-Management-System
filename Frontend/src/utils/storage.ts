import type { StorageKey } from "@/constants/storage";

export function getStorageItem<TValue extends string = string>(key: StorageKey): TValue | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(key) as TValue | null;
}

export function setStorageItem<TValue extends string>(key: StorageKey, value: TValue): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, value);
}

export function removeStorageItem(key: StorageKey): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}
