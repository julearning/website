/**
 * User preference persistence for degree/branch/semester.
 *
 * Saved to localStorage under "julearning-preferences".
 * The SearchHero reads these on mount as initial values.
 * User can change selections freely after that — preferences are
 * only re-applied on page refresh.
 */

export interface UserPreferences {
  degree: string | null;
  branch: string | null;
  semester: number | null;
}

const STORAGE_KEY = "julearning-preferences";

export function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") {
    return { degree: null, branch: null, semester: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { degree: null, branch: null, semester: null };
    const parsed = JSON.parse(raw);
    return {
      degree: typeof parsed.degree === "string" ? parsed.degree : null,
      branch: typeof parsed.branch === "string" ? parsed.branch : null,
      semester: typeof parsed.semester === "number" ? parsed.semester : null,
    };
  } catch {
    return { degree: null, branch: null, semester: null };
  }
}

export function savePreferences(prefs: UserPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage may be full or unavailable
  }
}

export function clearPreferences(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

export function hasPreferences(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!(parsed.degree || parsed.branch || parsed.semester != null);
  } catch {
    return false;
  }
}
