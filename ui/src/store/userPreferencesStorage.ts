const STORAGE_KEY = "cnc-controller:user-preferences";

interface UserPreferences {
  spindleRpm: number;
  jogStep: number;
  jogFeed: number;
  jogKeyboardControl: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  spindleRpm: 6000,
  jogStep: 1,
  jogFeed: 100,
  jogKeyboardControl: false,
};

const getBrowserStorage = () => {
  if (typeof window === "undefined") {
    return undefined;
  }
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

const readFromStorage = (): UserPreferences => {
  const storage = getBrowserStorage();
  if (!storage) {
    return { ...DEFAULT_PREFERENCES };
  }

  try {
    const rawValue = storage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return { ...DEFAULT_PREFERENCES };
    }

    const parsed = JSON.parse(rawValue) as Partial<UserPreferences> | null;
    if (!parsed) {
      return { ...DEFAULT_PREFERENCES };
    }

    const nextState: UserPreferences = { ...DEFAULT_PREFERENCES };
    if (typeof parsed.spindleRpm === "number" && Number.isFinite(parsed.spindleRpm)) {
      nextState.spindleRpm = parsed.spindleRpm;
    }
    if (typeof parsed.jogStep === "number" && Number.isFinite(parsed.jogStep)) {
      nextState.jogStep = parsed.jogStep;
    }
    if (typeof parsed.jogFeed === "number" && Number.isFinite(parsed.jogFeed)) {
      nextState.jogFeed = parsed.jogFeed;
    }
    if (typeof parsed.jogKeyboardControl === "boolean") {
      nextState.jogKeyboardControl = parsed.jogKeyboardControl;
    }

    return nextState;
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
};

let preferencesCache: UserPreferences = readFromStorage();

const persistState = (next: UserPreferences) => {
  preferencesCache = next;
  const storage = getBrowserStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(preferencesCache));
  } catch {
    // Ignore storage errors to keep UI responsive when storage is unavailable.
  }
};

export const userPreferencesStorage = {
  getSpindleRpm(fallback = DEFAULT_PREFERENCES.spindleRpm): number {
    const value = preferencesCache.spindleRpm;
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    return fallback;
  },
  setSpindleRpm(rpm: number) {
    const normalized = Number.isFinite(rpm) ? rpm : DEFAULT_PREFERENCES.spindleRpm;
    persistState({ ...preferencesCache, spindleRpm: normalized });
  },
  getJogStep(fallback = DEFAULT_PREFERENCES.jogStep): number {
    const value = preferencesCache.jogStep;
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    return fallback;
  },
  setJogStep(step: number) {
    const normalized = Number.isFinite(step) ? step : DEFAULT_PREFERENCES.jogStep;
    persistState({ ...preferencesCache, jogStep: normalized });
  },
  getJogFeed(fallback = DEFAULT_PREFERENCES.jogFeed): number {
    const value = preferencesCache.jogFeed;
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    return fallback;
  },
  setJogFeed(feed: number) {
    const normalized = Number.isFinite(feed) ? feed : DEFAULT_PREFERENCES.jogFeed;
    persistState({ ...preferencesCache, jogFeed: normalized });
  },
  getJogKeyboardControl(
    fallback = DEFAULT_PREFERENCES.jogKeyboardControl
  ): boolean {
    const value = preferencesCache.jogKeyboardControl;
    if (typeof value === "boolean") {
      return value;
    }
    return fallback;
  },
  setJogKeyboardControl(enabled: boolean) {
    persistState({ ...preferencesCache, jogKeyboardControl: Boolean(enabled) });
  },
  getSnapshot(): UserPreferences {
    return { ...preferencesCache };
  },
  reset(next: UserPreferences = DEFAULT_PREFERENCES) {
    persistState({ ...next });
  },
};
