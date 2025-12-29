export type PanelId = "connectivity" | "machineState" | "jog";

type PanelStateMap = Record<PanelId, boolean>;

type PartialPanelStateMap = Partial<Record<PanelId, boolean>>;

const STORAGE_KEY = "cnc-controller:panel-state";

const DEFAULT_STATE: PanelStateMap = {
  connectivity: false,
  machineState: false,
  jog: false,
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

const readFromStorage = (): PanelStateMap => {
  const storage = getBrowserStorage();
  if (!storage) {
    return { ...DEFAULT_STATE };
  }

  try {
    const rawValue = storage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return { ...DEFAULT_STATE };
    }

    const parsedValue = JSON.parse(rawValue) as PartialPanelStateMap | null;
    if (!parsedValue) {
      return { ...DEFAULT_STATE };
    }

    const nextState: PanelStateMap = { ...DEFAULT_STATE };
    (Object.keys(parsedValue) as PanelId[]).forEach((key) => {
      const value = parsedValue[key];
      if (typeof value === "boolean") {
        nextState[key] = value;
      }
    });

    return nextState;
  } catch {
    return { ...DEFAULT_STATE };
  }
};

let stateCache: PanelStateMap = readFromStorage();

const persistState = (next: PanelStateMap) => {
  stateCache = next;
  const storage = getBrowserStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(stateCache));
  } catch {
    // Swallow write errors to avoid breaking the UI when storage is unavailable.
  }
};

export const panelStateStorage = {
  getPanelState(panelId: PanelId, fallback = DEFAULT_STATE[panelId]): boolean {
    return stateCache[panelId] ?? fallback;
  },
  setPanelState(panelId: PanelId, collapsed: boolean) {
    persistState({ ...stateCache, [panelId]: collapsed });
  },
  getSnapshot(): PanelStateMap {
    return { ...stateCache };
  },
  reset(panelState: PanelStateMap = DEFAULT_STATE) {
    persistState({ ...panelState });
  },
};
