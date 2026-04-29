import { Outlet } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

// Outer shell for the Saved page. Hosts the AI items / outfits tab switcher
// and lets each child route render its own collection-style library.
// inline-flex + items-center keeps the label vertically centered inside the
// fixed h-11 box; without it the anchor renders as inline text and the label
// sticks to the top of the button, leaving a hollow strip beneath.
const tabBase =
  "inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium leading-none transition-colors border-white/10 bg-background/56 text-foreground hover:border-white/20 hover:bg-background/70";
const tabActive = "border-white/20 bg-white/[0.18] shadow-sm";

const SavedPage = () => {
  return (
    <div className="min-h-full px-4 pb-24 pt-2 md:px-6 lg:px-10 lg:pb-6">
      {/* space-y-4 (was 6) keeps the tabs visually attached to the board below */}
      {/* instead of leaving a hollow strip under the SAVED header. */}
      <div className="mx-auto max-w-[1500px] space-y-4">
        <div className="space-y-2">
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
