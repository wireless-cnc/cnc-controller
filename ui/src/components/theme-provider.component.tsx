import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ThemeSelectors, ThemeActions } from "../store";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();
  const theme = useSelector(ThemeSelectors.selectThemeMode);

  // Initialize theme on mount
  useEffect(() => {
    // Apply the theme to the document
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [theme]);

  // Listen for OS theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a preference
      const savedTheme = localStorage.getItem("theme-mode");
      if (!savedTheme) {
        if (e.matches) {
          dispatch(ThemeActions.setTheme("dark"));
        } else {
          dispatch(ThemeActions.setTheme("light"));
        }
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    // Legacy browsers
    return () => mediaQuery.removeListener?.(handleChange);
  }, [dispatch]);

  return <>{children}</>;
};
