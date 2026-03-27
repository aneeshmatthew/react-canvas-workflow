export const PALETTE_PANEL = {
  min: 140,
  max: 400,
  default: 200,
  storageKey: "journey-builder:palette-width",
} as const;

export const INSPECTOR_PANEL = {
  min: 200,
  max: 480,
  default: 260,
  storageKey: "journey-builder:inspector-width",
} as const;

export function clampWidth(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function loadPanelWidth(
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n)) return fallback;
    return clampWidth(n, min, max);
  } catch {
    return fallback;
  }
}

export function savePanelWidth(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* ignore */
  }
}
