import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const DISMISSED_KEY = "dressify-system-walkthrough-dismissed";

interface WalkthroughStep {
  title: string;
  body: string;
}

const baseSteps: WalkthroughStep[] = [
  {
    title: "Welcome to Dressify",
    body: "This app helps you upload a photo, generate AI clothing items, and compose complete outfits on the board.",
  },
  {
    title: "Main creation flow",
    body: "Start on Home: upload a photo, use Create look to generate items, then place and adjust them on the board.",
  },
  {
    title: "What gets saved where",
    body: "Generated items can be saved, wardrobe items are reusable, and full board layouts can be saved as outfits.",
  },
  {
    title: "Sync behavior",
    body: "If signed in, outfits and wardrobe sync with Supabase. If not, the app still works in local-only mode.",
  },
];

function getRouteSpecificStep(pathname: string): WalkthroughStep {
  if (pathname.startsWith("/wardrobe")) {
    return {
      title: "You are in Wardrobe",
      body: "Add your own clothing photos here, reuse them on the board, and keep a personal item library.",
    };
  }

  if (pathname.startsWith("/saved")) {
    return {
      title: "You are in Saved",
      body: "Use Items for generated + wardrobe content and Outfits for complete saved looks you can reload.",
    };
  }

  if (pathname.startsWith("/profile")) {
    return {
      title: "You are in Profile",
      body: "Sign in or manage account access here to enable cloud sync across devices.",
    };
  }

  return {
    title: "You are in Home",
    body: "Home is the studio workspace: photo upload, generation panel, canvas editor, and quick outfit saving.",
  };
}

const SystemWalkthrough = () => {
  const location = useLocation();
  const [stepIndex, setStepIndex] = useState(0);
  const [dismissed, setDismissed] = useState(() => window.localStorage.getItem(DISMISSED_KEY) === "true");
  const steps = useMemo(
    () => [baseSteps[0], getRouteSpecificStep(location.pathname), ...baseSteps.slice(1)],
    [location.pathname],
  );

  if (dismissed) {
    return null;
  }

  const activeStep = steps[stepIndex];

  const handleSkip = () => {
    window.localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  const handleNext = () => {
    if (stepIndex >= steps.length - 1) {
      handleSkip();
      return;
    }

    setStepIndex((current) => current + 1);
  };

  return (
    <aside className="fixed bottom-20 right-4 z-50 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-border/70 bg-background/95 p-4 shadow-xl backdrop-blur md:bottom-6 md:right-6">
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Tutorial {stepIndex + 1}/{steps.length}
          </p>
          <h2 className="text-base font-semibold">{activeStep.title}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{activeStep.body}</p>
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={handleSkip}>
            Skip
          </Button>
          <Button type="button" onClick={handleNext}>
            Next
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default SystemWalkthrough;
