import { useState, useEffect } from "react";


type UseThemeToggle = [boolean, () => void];

const useThemeToggle = (): UseThemeToggle => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Always return false for light mode
    return false;
  });

  useEffect(() => {
    // Always apply light mode
    document.documentElement.classList.remove("dark");
    localStorage.setItem("color-theme", "light");
  }, [isDarkMode]);

  const toggleTheme = (): any => {
    // Do nothing - theme is locked to light mode
    return;
  };

  return [isDarkMode, toggleTheme];
};

export default useThemeToggle;
