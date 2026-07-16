import { createContext } from "react";

export const ManajemenThemeContext = createContext({ isDark: false, setIsDark: () => {} });