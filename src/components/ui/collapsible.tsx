import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

// Root component that manages open/close state
const Collapsible = CollapsiblePrimitive.Root;

// The clickable element that toggles open/close.
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

// The part that appears/disappears.
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
