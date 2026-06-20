const STORAGE_KEY = "nature-tour-discovered";

export function getDiscovered(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markDiscovered(code: string): string[] {
  const current = getDiscovered();
  if (current.includes(code)) return current;
  const updated = [...current, code];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
