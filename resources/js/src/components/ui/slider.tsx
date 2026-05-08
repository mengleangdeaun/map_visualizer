import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number[]
  onValueChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    const percentage = ((value[0] - min) / (max - min)) * 100

    return (
      <div className={cn("relative flex w-full touch-none select-none items-center group py-4", className)}>
        {/* Track Background */}
        <div className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
          {/* Progress Fill */}
          <div 
            className="absolute h-full bg-primary transition-all duration-150 ease-out" 
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Custom Thumb */}
        <div 
          className="absolute h-5 w-5 rounded-full border-2 border-primary bg-background shadow-lg transition-all duration-150 ease-out pointer-events-none ring-offset-background group-hover:scale-110"
          style={{ 
            left: `calc(${percentage}% - 10px)`,
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        />

        {/* Hidden Native Input for Events */}
        <input
          type="range"
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => onValueChange([parseInt(e.target.value)])}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          {...props}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
