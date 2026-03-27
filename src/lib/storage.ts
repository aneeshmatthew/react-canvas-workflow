import {
  defaultJourney,
  parseJourney,
  serializeJourney,
  type JourneyDocument,
} from "./journeySchema";

export const STORAGE_KEY = "journey-builder:last";

export function downloadJson(filename: string, json: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

export function saveToLocalStorage(doc: JourneyDocument): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializeJourney(doc));
  } catch {
    /* quota or private mode */
  }
}

export function loadFromLocalStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Last saved journey from localStorage, or a default document if missing/invalid. */
export function loadStoredJourneyOrDefault(): JourneyDocument {
  const raw = loadFromLocalStorage();
  if (!raw) return defaultJourney();
  try {
    return parseJourney(JSON.parse(raw));
  } catch {
    return defaultJourney();
  }
}
