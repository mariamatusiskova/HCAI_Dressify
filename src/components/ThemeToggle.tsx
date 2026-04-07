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
    return <div className={cn("h-10 w-[90px] rounded-full border border-border bg-card/70", className)} />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/75 p-1 shadow-sm backdrop-blur-xl",
        className,
      )}
      aria-label="Theme switcher"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={cn(
          // The active pill borrows the global primary token, so changing --primary updates the selected state here too.
          "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-all",
          !isDark && "bg-primary text-primary-foreground shadow-sm",
        )}
        aria-label="Switch to light mode"
        aria-pressed={!isDark}
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-all",
          isDark && "bg-primary text-primary-foreground shadow-sm",
        )}
        aria-label="Switch to dark mode"
        aria-pressed={isDark}
      >
        <Moon className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ThemeToggle;
