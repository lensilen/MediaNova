import { darkColors, lightColors } from "../constants/theme";
import { useThemeStore } from "../store/themeStore";

export function useTheme() {
  const { mode, setMode, toggleMode } = useThemeStore();
  const isDark = mode === "dark";

  return {
    colors: isDark ? darkColors : lightColors,
    isDark,
    mode,
    setMode,
    toggleMode,
  };
}
