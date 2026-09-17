import * as React from "react"
import { cn } from "cn"

/** A pulsing placeholder shaped like the real content that's still loading — not a Radix
 * primitive (Radix has no visual Skeleton, only behavioral ones like Tabs/Dialog), just a
 * plain div following the same shadcn-style convention as the rest of this folder. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800", className)}
      {...props}
    />
  )
}

export { Skeleton }
