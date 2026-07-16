import { useContext } from "react";
import { ManajemenThemeContext } from "./ManajemenThemeContextValue";

export const useManajemenTheme = () => useContext(ManajemenThemeContext);