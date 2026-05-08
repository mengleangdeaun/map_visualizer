import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number[]
  onValueChange: (value: number[]) => void
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    return (
      <div className="relative flex w-full touch-none select-none items-center">
        <input
          type="range"
          ref={ref}
          className={cn(
            "relative h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/20",
            "accent-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className
          )}
          value={value[0]}
          onChange={(e) => onValueChange([parseInt(e.target.value)])}
          {...props}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
