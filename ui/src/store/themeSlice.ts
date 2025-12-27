import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./index";

export const THEME_SLICE = "theme";

export type Theme = "light" | "dark";

interface ThemeState {
  mode: Theme;
}

const getInitialTheme = (): Theme => {
  // Check for saved preference
  const savedTheme = localStorage.getItem("theme-mode") as Theme | null;
  if (savedTheme) {
    return savedTheme;
  }

  // Check OS preference
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
};

const initialState: ThemeState = {
  mode: getInitialTheme(),
};

export const themeSlice = createSlice({
  name: THEME_SLICE,
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.mode = action.payload;
      localStorage.setItem("theme-mode", action.payload);
    },
    toggleTheme: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
      localStorage.setItem("theme-mode", state.mode);
    },
    initializeThemeFromOS: (state) => {
      // Detect OS preference at runtime
      const isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      state.mode = isDark ? "dark" : "light";
    },
  },
});

export const ThemeSelectors = {
  selectThemeMode: (state: RootState) => state[THEME_SLICE].mode,
};
