import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  className?: string;
}

const STORAGE_KEY = "dressify-language";
const LANGUAGES = ["EN", "SK"] as const;
type LanguageCode = (typeof LANGUAGES)[number];

const LanguageToggle = ({ className }: LanguageToggleProps) => {
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>("EN");

  useEffect(() => {
    setMounted(true);

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "EN" || stored === "SK") {
      setLanguage(stored);
      document.documentElement.lang = stored.toLowerCase();
      return;
    }

    document.documentElement.lang = "en";
  }, []);

  const handleToggle = () => {
    const nextLanguage: LanguageCode = language === "EN" ? "SK" : "EN";
    setLanguage(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    document.documentElement.lang = nextLanguage.toLowerCase();
  };

  if (!mounted) {
    return <div className={cn("h-10 w-[78px] rounded-full border border-border bg-card/70", className)} />;
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border border-border/70 bg-card/75 px-3 text-sm text-muted-foreground shadow-sm backdrop-blur-xl transition-all hover:bg-primary/12 hover:text-foreground dark:hover:bg-primary/16",
        className,
      )}
      aria-label={`Switch language. Current language: ${language}`}
      title={`Switch language. Current language: ${language}`}
    >
      <Languages className="h-4 w-4" />
      <span className="min-w-[1.75rem] text-center font-medium tracking-wide">{language}</span>
    </button>
  );
};

export default LanguageToggle;
