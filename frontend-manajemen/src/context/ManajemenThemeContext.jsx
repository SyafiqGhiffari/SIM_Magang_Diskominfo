import { useEffect, useState } from "react";
import { ManajemenThemeContext } from "./ManajemenThemeContextValue";

export const ManajemenThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => localStorage.getItem("admin_theme") === "dark");

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("admin_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("admin_theme", "light");
    }
  }, [isDark]);

  return (
    <ManajemenThemeContext.Provider value={{ isDark, setIsDark }}>
      {children}
    </ManajemenThemeContext.Provider>
  );
};