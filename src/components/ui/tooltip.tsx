import * as React from "react"
import { cn } from "@/lib/utils"

// Safe tooltip shim to avoid runtime issues with Radix in some environments
// Renders children without interactive tooltip behavior

type ProviderProps = { children: React.ReactNode; delayDuration?: number }
const TooltipProvider: React.FC<ProviderProps> = ({ children }) => <>{children}</>

const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>

const TooltipTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { asChild?: boolean }
>(({ children, ...props }, ref) => (
  <span ref={ref as any} {...props}>
    {children}
  </span>
))
TooltipTrigger.displayName = "TooltipTrigger"

type TooltipContentProps = React.HTMLAttributes<HTMLDivElement> & {
  side?: string
  align?: string
  sideOffset?: number
  alignOffset?: number
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("sr-only", className)} {...props} />
  )
)
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
