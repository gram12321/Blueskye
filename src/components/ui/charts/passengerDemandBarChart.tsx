import React from 'react';

interface BarChartData {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  title?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ data, height = 200, title }) => {
  const rawMaxValue = Math.max(...data.map(d => d.value), 1);
  
  // Calculate a proper max value by rounding up to the nearest appropriate increment
  const calculateMaxValue = (max: number): number => {
    if (max <= 10) return Math.ceil(max);
    if (max <= 100) return Math.ceil(max / 10) * 10;
    if (max <= 1000) return Math.ceil(max / 100) * 100;
    if (max <= 10000) return Math.ceil(max / 1000) * 1000;
    return Math.ceil(max / 10000) * 10000;
  };
  
  const maxValue = calculateMaxValue(rawMaxValue);
  const titleHeight = title ? 24 : 0;
  const labelHeight = 40;
  const maxLabelHeight = 16;
  const actualChartHeight = height - titleHeight - labelHeight - maxLabelHeight;
  
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-medium mb-2 text-center" style={{ height: titleHeight }}>
          {title}
        </h3>
      )}
      
      <div className="relative" style={{ height: actualChartHeight + labelHeight }}>
        {/* Chart area */}
        <div 
          className="flex justify-around items-end px-4" 
          style={{ height: actualChartHeight }}
        >
          {data.map((item, index) => {
            const barHeightPx = maxValue > 0 ? (item.value / maxValue) * actualChartHeight : 0;
            return (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="w-12 bg-opacity-90 rounded-t-md transition-all duration-500 ease-in-out flex items-end justify-center text-white font-bold text-xs"
                  style={{
                    height: Math.max(barHeightPx, item.value > 0 ? 8 : 0),
                    backgroundColor: item.color,
                  }}
                >
                  {item.value > 0 && barHeightPx > 20 && (
                    <span className="mb-1">{item.value}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Labels area */}
        <div 
          className="flex justify-around px-4" 
          style={{ height: labelHeight }}
        >
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center justify-start pt-2">
              <span className="text-xs font-medium">{item.label}</span>
              <span className="text-xs text-muted-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground text-center" style={{ height: maxLabelHeight }}>
        Max: {maxValue.toLocaleString()}
      </div>
    </div>
  );
};

export default BarChart; 