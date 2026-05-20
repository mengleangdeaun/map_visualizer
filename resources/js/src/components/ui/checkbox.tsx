import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        `
        peer relative flex size-4 shrink-0 items-center justify-center
        rounded-[4px] border border-input
        outline-none

        transition-[border-color,box-shadow,transform,background-color]
        duration-150 ease-out

        hover:border-primary/60
        active:scale-95

        focus-visible:ring-2
        focus-visible:ring-ring/30

        disabled:cursor-not-allowed
        disabled:opacity-50

        data-[state=checked]:bg-primary
        data-[state=checked]:border-primary
        data-[state=checked]:text-primary-foreground
        `,
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className="
          flex items-center justify-center
          transition-transform duration-150 ease-out
          data-[state=checked]:scale-100
          data-[state=unchecked]:scale-75
        "
      >
        <CheckIcon className="size-3.5 stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }