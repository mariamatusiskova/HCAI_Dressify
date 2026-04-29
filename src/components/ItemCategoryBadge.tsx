import { Sparkles, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ItemSource } from "@/lib/clothingCategory";

interface ItemCategoryBadgeProps {
  source?: ItemSource;
  className?: string;
}

const ItemCategoryBadge = ({ source = "ai", className }: ItemCategoryBadgeProps) => {
  const accessibleLabel = source === "wardrobe" ? "User photo item" : "AI generated item";

  if (source === "ai") {
    return (
      <div
        className={cn(
          "absolute bottom-3 right-3 flex items-end justify-end text-white",
          className,
        )}
      >
        <div className="relative h-7 w-7">
          <Sparkles
            className="absolute bottom-0 right-0 h-4 w-4 fill-current text-black/45 blur-[0.2px]"
            strokeWidth={2.8}
          />
          <Sparkles className="absolute bottom-0 right-0 h-4 w-4 fill-current text-white/95 drop-shadow-[0_2px_6px_rgba(0,0,0,0.38)]" strokeWidth={2.2} />
        </div>
        <span className="sr-only">{accessibleLabel}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "absolute bottom-2.5 right-2.5 flex items-end justify-end text-white/95",
        className,
      )}
    >
      <div className="relative h-4 w-4">
        <UserRound
          className="absolute bottom-0 right-0 h-4 w-4 text-black/45 blur-[0.15px]"
          strokeWidth={2.8}
        />
        <UserRound
          className="absolute bottom-0 right-0 h-4 w-4 text-white/95 drop-shadow-[0_2px_6px_rgba(0,0,0,0.34)]"
          strokeWidth={2.2}
        />
      </div>
      <span className="sr-only">{accessibleLabel}</span>
    </div>
  );
};

export default ItemCategoryBadge;
