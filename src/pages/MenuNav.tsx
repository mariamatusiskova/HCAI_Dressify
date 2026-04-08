import { Bookmark, Home, Shirt, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const desktopItem =
  "group relative px-3 py-2 text-sm font-medium text-foreground/48 transition-colors duration-200 hover:text-foreground/82";
const desktopActive =
  "text-foreground after:absolute after:left-1/2 after:bottom-[2px] after:h-px after:w-7 after:-translate-x-1/2 after:rounded-full after:bg-primary before:absolute before:left-1/2 before:bottom-[-4px] before:h-3 before:w-10 before:-translate-x-1/2 before:rounded-full before:bg-primary/35 before:blur-md";
const mobileItem = "flex flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground";
const mobileActive = "text-primary";

const MenuNav = () => {
  return (
    <>
      <nav className="hidden md:flex items-center gap-1 lg:gap-3">
        <NavLink to="/" className={desktopItem} activeClassName={desktopActive}>
          Home
        </NavLink>
        <NavLink to="/wardrobe" className={desktopItem} activeClassName={desktopActive}>
          Wardrobe
        </NavLink>
        <NavLink to="/saved" className={desktopItem} activeClassName={desktopActive}>
          Saved
        </NavLink>
        <NavLink to="/profile" className={desktopItem} activeClassName={desktopActive}>
          Profile
        </NavLink>
      </nav>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/70 bg-background/80 backdrop-blur-xl h-14 grid grid-cols-4">
        <NavLink to="/" className={mobileItem} activeClassName={mobileActive}>
          <Home className="h-4 w-4" />
          Home
        </NavLink>
        <NavLink to="/wardrobe" className={mobileItem} activeClassName={mobileActive}>
          <Shirt className="h-4 w-4" />
          Wardrobe
        </NavLink>
        <NavLink to="/saved" className={mobileItem} activeClassName={mobileActive}>
          <Bookmark className="h-4 w-4" />
          Saved
        </NavLink>
        <NavLink to="/profile" className={mobileItem} activeClassName={mobileActive}>
          <User className="h-4 w-4" />
          Profile
        </NavLink>
      </nav>
    </>
  );
};

export default MenuNav;
