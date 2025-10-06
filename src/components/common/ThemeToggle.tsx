import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

export const ThemeToggle = () => {
  const { theme } = useTheme();

  // Component is disabled since theme is locked to light mode
  return (
    <Button
      id="theme-toggle"
      type="button"
      size="icon"
      variant="ghost"
      className="text-foreground hover:text-foreground"
      disabled
      title="Theme locked to light mode"
    >
      <Sun />
    </Button>
  );
};
