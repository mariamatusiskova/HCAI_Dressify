import { Outlet } from "react-router-dom";
import { NavLink } from "@/components/NavLink";

const tabBase = "px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60";
const tabActive = "bg-muted text-foreground font-medium";

const SavedPage = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-sm font-display font-medium text-muted-foreground uppercase tracking-wider">Saved</h2>
      <div className="flex gap-2">
        <NavLink to="items" end className={tabBase} activeClassName={tabActive}>
          Items
        </NavLink>
        <NavLink to="outfits" className={tabBase} activeClassName={tabActive}>
          Outfits
        </NavLink>
      </div>
      <Outlet />
    </div>
  );
};

export default SavedPage;
