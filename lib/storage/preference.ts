export type CanvasPanelPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  lastProjectId: string | null;
  editorOpen: boolean;
  inspectorOpen: boolean;
  sidebarOpen: boolean;
  editorWidth: number;
  showMinimap: boolean;
  minimapPosition: CanvasPanelPosition;
  showControls: boolean;
  controlsPosition: CanvasPanelPosition;
}

const PREF_KEY = "live_dbdiagram_prefs";

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "dark",
  lastProjectId: null,
  editorOpen: true,
  inspectorOpen: true,
  sidebarOpen: true,
  editorWidth: 420,
  showMinimap: true,
  minimapPosition: "bottom-left",
  showControls: true,
  controlsPosition: "bottom-right",
};

export function getPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: Partial<UserPreferences>): void {
  if (typeof window === "undefined") return;
  try {
    const current = getPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(PREF_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Gagal menyimpan preferensi lokal:", err);
  }
}
