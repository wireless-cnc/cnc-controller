import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from ".";
import { GRBL_SETTINGS_SLICE } from "./types";
import { settingsCatalog } from "@app/grbl/settingsCatalog";

export type FetchStatus = "idle" | "loading" | "succeeded" | "failed";
export type SaveStatus = "idle" | "saving" | "succeeded" | "failed";

export interface GrblSettingsState {
  current: Record<string, number>;
  draft: Record<string, string>;
  fetchStatus: FetchStatus;
  saveStatus: SaveStatus;
  error?: string;
  pendingSaveAcks: number;
}

const initialState: GrblSettingsState = {
  current: {},
  draft: {},
  fetchStatus: "idle",
  saveStatus: "idle",
  pendingSaveAcks: 0,
};

export const grblSettingsSlice = createSlice({
  name: GRBL_SETTINGS_SLICE,
  initialState,
  reducers: {
    startFetch: (state) => {
      state.fetchStatus = "loading";
      state.error = undefined;
    },
    finishFetch: (state) => {
      state.fetchStatus = "succeeded";
    },
    setFetchError: (state, action: PayloadAction<string>) => {
      state.fetchStatus = "failed";
      state.error = action.payload;
    },
    receiveSetting: (
      state,
      action: PayloadAction<{ id: string; value: number }>
    ) => {
      const { id, value } = action.payload;
      const previous = state.current[id];
      state.current[id] = value;
      const previousDraft = state.draft[id];
      if (previousDraft === undefined || previousDraft === String(previous)) {
        state.draft[id] = String(value);
      }
    },
    setDraftValue: (
      state,
      action: PayloadAction<{ id: string; value: string }>
    ) => {
      state.draft[action.payload.id] = action.payload.value;
    },
    setDraftValues: (state, action: PayloadAction<Record<string, string>>) => {
      Object.entries(action.payload).forEach(([key, value]) => {
        state.draft[key] = value;
      });
    },
    resetDraftToCurrent: (state) => {
      Object.entries(state.current).forEach(([key, value]) => {
        state.draft[key] = String(value);
      });
    },
    beginSave: (state, action: PayloadAction<{ pending: number }>) => {
      state.saveStatus = "saving";
      state.pendingSaveAcks = action.payload.pending;
      state.error = undefined;
    },
    completeSaveAck: (state) => {
      if (state.pendingSaveAcks > 0) {
        state.pendingSaveAcks -= 1;
      }
      if (state.pendingSaveAcks === 0 && state.saveStatus === "saving") {
        state.saveStatus = "succeeded";
      }
    },
    setSaveError: (state, action: PayloadAction<string>) => {
      state.saveStatus = "failed";
      state.error = action.payload;
      state.pendingSaveAcks = 0;
    },
    clearSaveStatus: (state) => {
      state.saveStatus = "idle";
      state.pendingSaveAcks = 0;
    },
    applyDraftToCurrent: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach((id) => {
        const draftValue = state.draft[id];
        if (draftValue === undefined) {
          return;
        }
        const parsed = Number(draftValue);
        if (!Number.isFinite(parsed)) {
          return;
        }
        state.current[id] = parsed;
        state.draft[id] = String(draftValue);
      });
    },
  },
});

const selectSettingsState = (state: RootState) => state[GRBL_SETTINGS_SLICE];

export const parseDraftValue = (value: string | undefined) => {
  if (value === undefined) {
    return { valid: false, parsed: undefined } as const;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: false, parsed: undefined } as const;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return { valid: false, parsed: undefined } as const;
  }
  return { valid: true, parsed } as const;
};

export type GrblSettingsRow = {
  meta: (typeof settingsCatalog)[number];
  current: number | undefined;
  draft: string;
  parsed: number | undefined;
  valid: boolean;
  isDirty: boolean;
};

const selectRows = createSelector(selectSettingsState, (state): GrblSettingsRow[] => {
  return settingsCatalog.map((meta) => {
    const current = state.current[meta.id];
    const draft = state.draft[meta.id] ?? (current !== undefined ? String(current) : "");
    const parsedResult = parseDraftValue(draft);
    const isDirty =
      parsedResult.valid &&
      current !== undefined &&
      parsedResult.parsed !== current;
    return {
      meta,
      current,
      draft,
      parsed: parsedResult.parsed,
      valid: parsedResult.valid,
      isDirty,
    };
  });
});

export const GrblSettingsSelectors = {
  selectSettingsState,
  selectFetchStatus: createSelector(selectSettingsState, (state) => state.fetchStatus),
  selectSaveStatus: createSelector(selectSettingsState, (state) => state.saveStatus),
  selectError: createSelector(selectSettingsState, (state) => state.error),
  selectRows,
  selectHasDirty: createSelector(
    selectRows,
    (rows) => rows.some((row) => row.isDirty)
  ),
  selectHasInvalidDirty: createSelector(
    selectRows,
    (rows) => rows.some((row) => row.isDirty && !row.valid)
  ),
};

export const GrblSettingsActions = grblSettingsSlice.actions;
