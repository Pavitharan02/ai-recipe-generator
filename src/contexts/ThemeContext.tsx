import { createContext, useContext, useEffect } from "react";

type ThemeProviderProps = {
  children: React.ReactNode;
};

type ThemeProviderState = {
  theme: "light";
};

const initialState: ThemeProviderState = {
  theme: "light",
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

// Script to ensure light mode is always applied
const themeScript = `
  (function() {
    document.documentElement.classList.remove("dark", "light");
  })()
`;

export function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  useEffect(() => {
    // Always apply light theme
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    // Don't add any class for light mode - it's the default
  }, []);

  const value = {
    theme: "light" as const,
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: themeScript,
        }}
      />
      <ThemeProviderContext.Provider {...props} value={value}>
        {children}
      </ThemeProviderContext.Provider>
    </>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
