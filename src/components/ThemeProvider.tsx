import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  return (
    <NextThemesProvider
      // next-themes toggles a "dark" class on the root element.
      // Our CSS tokens in src/index.css read from that class.
      attribute="class"
      // Default to dark because the product branding is still centered around the dark experience.
      defaultTheme="dark"
      enableSystem
      // Avoid a visible color animation flash when the theme changes or hydrates.
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
};

export default ThemeProvider;
