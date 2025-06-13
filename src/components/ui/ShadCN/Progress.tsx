import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/gamemechanics/tailwindUtils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

// Multi-phase progress bar for flight tracking
interface FlightProgressProps {
  currentProgress: number; // 0-100%
  flightTime: number; // hours
  turnTime: number; // hours
  totalTime: number; // hours
  currentPhase: 'outbound' | 'turnaround' | 'return';
  className?: string;
}

const FlightProgress = React.forwardRef<
  HTMLDivElement,
  FlightProgressProps
>(({ currentProgress, flightTime, turnTime, totalTime, currentPhase, className }, ref) => {
  // Calculate phase boundaries as percentages
  const outboundEnd = (flightTime / totalTime) * 100;
  const turnEnd = outboundEnd + (turnTime / totalTime) * 100;
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
    >
      {/* Background segments */}
      <div className="absolute inset-0 flex">
        {/* Outbound segment */}
        <div 
          className="bg-blue-100 border-r border-white"
          style={{ width: `${outboundEnd}%` }}
        />
        {/* Turn segment */}
        <div 
          className="bg-orange-100 border-r border-white"
          style={{ width: `${turnEnd - outboundEnd}%` }}
        />
        {/* Return segment */}
        <div 
          className="bg-green-100"
          style={{ width: `${100 - turnEnd}%` }}
        />
      </div>
      
      {/* Progress indicator */}
      <div
        className={cn(
          "h-full transition-all duration-300",
          currentPhase === 'outbound' ? 'bg-blue-500' :
          currentPhase === 'turnaround' ? 'bg-orange-500' : 'bg-green-500'
        )}
        style={{ width: `${Math.min(currentProgress, 100)}%` }}
      />
      
      {/* Phase labels */}
      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-difference">
        <span>
          {currentPhase === 'outbound' ? 'Outbound' :
           currentPhase === 'turnaround' ? 'Turnaround' : 'Return'}
        </span>
      </div>
    </div>
  );
});
FlightProgress.displayName = "FlightProgress";

export { Progress, FlightProgress } 