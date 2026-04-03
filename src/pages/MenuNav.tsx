import { Bookmark, Home, Shirt, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const desktopItem =
  "px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors";
const desktopActive = "text-foreground bg-muted font-medium";
const mobileItem = "flex flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground";
const mobileActive = "text-primary";

const MenuNav = () => {
  return (
    <>
      <nav className="hidden md:flex border-b border-border px-4 py-2 gap-2">
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

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background h-14 grid grid-cols-4">
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
