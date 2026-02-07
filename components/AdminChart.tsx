"use client";

import { useMemo } from "react";

interface ChartProps {
    data: number[];
    labels?: string[];
    color?: string;
    height?: number;
}

export default function AdminChart({ data, labels, color = "#8b5cf6", height = 200 }: ChartProps) {
    const points = useMemo(() => {
        if (!data || data.length === 0) return "";
        
        const max = Math.max(...data, 1);
        const min = Math.min(...data);
        const range = max - min || 1;
        
        const width = 100; // using percentages/viewBox
        const step = width / (data.length - 1);
        
        return data.map((val, i) => {
            const x = i * step;
            // Invert Y because SVG 0 is top
            const normalizedY = ((val - min) / range); 
            // Add padding (10% top/bottom)
            const y = 90 - (normalizedY * 80); 
            return `${x},${y}`;
        }).join(" ");
    }, [data]);

    // Create a fill path for the gradient area under the line
    const fillPath = `0,100 ${points} 100,100`;

    return (
        <div className="w-full relative select-none" style={{ height: `${height}px` }}>
            <svg 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none" 
                className="w-full h-full overflow-visible"
            >
                {/* Defs for Gradients */}
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Grid Lines (Optional) */}
                <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2" />

                {/* Area Fill */}
                <polygon 
                    points={fillPath} 
                    fill={`url(#gradient-${color})`} 
                />

                {/* Line */}
                <polyline 
                    points={points} 
                    fill="none" 
                    stroke={color} 
                    strokeWidth="2" 
                    vectorEffect="non-scaling-stroke"
                    filter="url(#glow)"
                />
                
                {/* Data Points */}
                {data.map((_, i) => {
                     // Re-calculate these for circles (inefficient but fine for small n)
                     const parts = points.split(" ");
                     const [cx, cy] = parts[i].split(",");
                     return (
                         <circle 
                            key={i} 
                            cx={cx} 
                            cy={cy} 
                            r="1.5" 
                            fill="#fff"
                            className="opacity-0 hover:opacity-100 transition-opacity"
                         />
                     );
                })}


            </svg>
            
            {/* Labels (X-Axis) */}
            {labels && (
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-zinc-500 font-mono mt-2 transform translate-y-full">
                    {labels.map((label, i) => (
                        <span key={i}>{label}</span>
                    ))}
                </div>
            )}
        </div>
    );
}
