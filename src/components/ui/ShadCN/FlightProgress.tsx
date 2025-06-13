import * as React from "react";
import { cn } from "@/lib/gamemechanics/tailwindUtils";

interface FlightProgressProps {
  currentProgress: number; // 0-100%
  flightTime: number; // hours
  originTurnTime: number; // hours - turn time at origin
  destinationTurnTime: number; // hours - turn time at destination
  totalTime: number; // hours
  currentPhase: 'origin-turn' | 'outbound' | 'destination-turn' | 'return';
  className?: string;
}

const FlightProgress = React.forwardRef<
  HTMLDivElement,
  FlightProgressProps
>(({ currentProgress, flightTime, originTurnTime, destinationTurnTime, totalTime, currentPhase, className }, ref) => {
  // Calculate phase boundaries as percentages for 4-phase cycle
  const originTurnEnd = (originTurnTime / totalTime) * 100;
  const outboundEnd = originTurnEnd + (flightTime / totalTime) * 100;
  const destinationTurnEnd = outboundEnd + (destinationTurnTime / totalTime) * 100;
  // Return phase goes from destinationTurnEnd to 100%
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full pt-8 pb-2", // Added padding top for tooltip, removed height constraint
        className
      )}
    >
      {/* Progress percentage tooltip */}
      <div
        className="absolute -top-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg transition-all duration-300 z-30"
        style={{ 
          left: `${Math.min(currentProgress, 100)}%`, 
          transform: 'translateX(-50%)'
        }}
      >
        {currentProgress.toFixed(1)}%
      </div>
      
      {/* Main progress bar container */}
      <div className="relative h-4 w-full rounded-full bg-secondary overflow-hidden">
        {/* Background segments */}
        <div className="absolute inset-0 flex">
          {/* Origin turn segment */}
          <div 
            className="bg-yellow-100 border-r border-white"
            style={{ width: `${originTurnEnd}%` }}
          />
          {/* Outbound segment */}
          <div 
            className="bg-blue-100 border-r border-white"
            style={{ width: `${outboundEnd - originTurnEnd}%` }}
          />
          {/* Destination turn segment */}
          <div 
            className="bg-orange-100 border-r border-white"
            style={{ width: `${destinationTurnEnd - outboundEnd}%` }}
          />
          {/* Return segment */}
          <div 
            className="bg-green-100"
            style={{ width: `${100 - destinationTurnEnd}%` }}
          />
        </div>
        
        {/* Progress indicator */}
        <div
          className={cn(
            "h-full transition-all duration-300",
            currentPhase === 'origin-turn' ? 'bg-yellow-500' :
            currentPhase === 'outbound' ? 'bg-blue-500' :
            currentPhase === 'destination-turn' ? 'bg-orange-500' : 'bg-green-500'
          )}
          style={{ width: `${Math.min(currentProgress, 100)}%` }}
        />
      </div>
      
      {/* Current progress marker - vertical line extending outside */}
      <div
        className="absolute w-1 bg-gray-800 shadow-lg transition-all duration-300 z-20"
        style={{ 
          left: `${Math.min(currentProgress, 100)}%`, 
          transform: 'translateX(-50%)',
          top: '0px',
          height: 'calc(100% - 8px)' // Full height minus padding
        }}
      />
      
      {/* Current progress marker - circle indicator */}
      <div
        className="absolute w-3 h-3 bg-white border-2 border-gray-800 rounded-full shadow-lg transition-all duration-300 z-30"
        style={{ 
          left: `${Math.min(currentProgress, 100)}%`, 
          transform: 'translate(-50%, -50%)',
          top: '50%'
        }}
      />
    </div>
  );
});
FlightProgress.displayName = "FlightProgress";

export { FlightProgress }; 