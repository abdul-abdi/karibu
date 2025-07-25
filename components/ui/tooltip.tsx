"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = React.memo(TooltipPrimitive.Provider)

const Tooltip = React.memo(TooltipPrimitive.Root)

const TooltipTrigger = React.memo(TooltipPrimitive.Trigger)

const TooltipContent = React.memo(
  React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
  >(({ className, sideOffset = 4, ...props }, ref) => {
    // Use a stable ref to prevent infinite updates
    const innerRef = React.useRef<HTMLDivElement>(null);
    
    // Sync the refs once on mount only
    React.useEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(innerRef.current);
        } else {
          ref.current = innerRef.current;
        }
      }
      // This effect is intentionally only run once on mount and ref is handled specially
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array runs only once on mount
    
    return (
      <TooltipPrimitive.Content
        ref={innerRef}
        sideOffset={sideOffset}
        className={cn(
          "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    );
  })
)
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } 