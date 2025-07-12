"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps {
  value?: number
  className?: string
  indicatorClassName?: string
}

const Progress = React.forwardRef<
  HTMLDivElement,
  ProgressProps
>(({ className, value = 0, indicatorClassName, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative h-3 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <div
      className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorClassName)}
      style={{ 
        width: `${value}%`,
        transition: 'width 0.5s ease-in-out'
      }}
    />
  </div>
))
Progress.displayName = "Progress"

export { Progress } 