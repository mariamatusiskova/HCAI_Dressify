import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Wait until client mount so we do not render the wrong theme state during SSR hydration.
    setMounted(true);
  }, []);

  if (!mounted) {
    // Keep layout stable while the actual theme is still being resolved on the client.
    return <div className={cn("h-10 w-10 rounded-full border border-border bg-card/70", className)} />;
  }

  const isDark = resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card/75 text-muted-foreground shadow-sm backdrop-blur-xl transition-all hover:bg-primary/14 hover:text-foreground dark:hover:bg-primary/18",
        className,
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};

export default ThemeToggle;
