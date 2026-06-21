export const STORAGE_KEYS = {
  accessToken: "app.accessToken",
  theme: "app.theme"
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
