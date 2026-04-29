import { Outlet } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

// Outer shell for the Saved page. Hosts the AI items / outfits tab switcher
// and lets each child route render its own collection-style library.
const tabBase =
  "h-11 rounded-xl border px-5 text-sm font-medium transition-colors border-white/10 bg-background/56 text-foreground hover:border-white/20 hover:bg-background/70";
const tabActive = "border-white/20 bg-white/[0.18] shadow-sm";

const SavedPage = () => {
  return (
    <div className="min-h-full px-4 pb-24 pt-2 md:px-6 lg:px-10 lg:pb-6">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
            Saved
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <NavLink to="items" end className={cn(tabBase)} activeClassName={tabActive}>
              AI items
            </NavLink>
            <NavLink to="outfits" className={cn(tabBase)} activeClassName={tabActive}>
              Outfits
            </NavLink>
          </div>
        </div>

        <Outlet />
      </div>
    </div>
  );
};

export default SavedPage;
