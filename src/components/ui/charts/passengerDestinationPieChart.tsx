import React, { useState } from 'react';

interface PieChartData {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({ data, size = 120, className = '' }) => {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  let currentAngle = -Math.PI / 2;
  const radius = size / 2;
  const center = radius;

  // Default color palette
  const COLORS = [
    '#3b82f6', '#22c55e', '#f59e42', '#eab308', '#8b5cf6', '#ef4444', '#14b8a6', '#f472b6', '#64748b', '#fbbf24'
  ];

  return (
    <div className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
        <circle cx={center} cy={center} r={radius - 1} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
        {data.map((slice, i) => {
          if (slice.value <= 0) return null;
          const angle = (slice.value / total) * 2 * Math.PI;
          const endAngle = currentAngle + angle;
          const x1 = center + radius * Math.cos(currentAngle);
          const y1 = center + radius * Math.sin(currentAngle);
          const x2 = center + radius * Math.cos(endAngle);
          const y2 = center + radius * Math.sin(endAngle);
          const largeArcFlag = angle > Math.PI ? 1 : 0;
          const path = [
            `M ${center},${center}`,
            `L ${x1},${y1}`,
            `A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2}`,
            'Z'
          ].join(' ');
          const color = slice.color || COLORS[i % COLORS.length];
          const midAngle = currentAngle + angle / 2;
          const labelX = center + (radius * 0.6) * Math.cos(midAngle);
          const labelY = center + (radius * 0.6) * Math.sin(midAngle);
          const showLabel = angle > 0.35; // Only show label if slice is big enough
          const labelValue = Math.round(slice.value);
          const isHovered = hoveredSlice === i;
          
          currentAngle = endAngle;
          return (
            <g key={slice.label}>
              <path 
                d={path} 
                fill={color} 
                stroke="#fff" 
                strokeWidth={1}
                style={{
                  opacity: isHovered ? 0.8 : 1,
                  cursor: 'pointer',
                  filter: isHovered ? 'brightness(1.1)' : 'none'
                }}
                onMouseEnter={() => setHoveredSlice(i)}
                onMouseLeave={() => setHoveredSlice(null)}
              />
              {showLabel && (
                <text x={labelX} y={labelY} textAnchor="middle" alignmentBaseline="middle" fontSize={size * 0.13} fill="#222">
                  {labelValue}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      
      {/* Tooltip */}
      {hoveredSlice !== null && (
        <div className="absolute top-0 left-full ml-2 bg-black text-white text-xs rounded px-2 py-1 pointer-events-none z-10">
          <div className="font-medium">{data[hoveredSlice].label}</div>
          <div>{data[hoveredSlice].value} passengers</div>
        </div>
      )}
    </div>
  );
};

export default PieChart; 