"use client";

import { useEffect, useMemo, useState } from "react";

interface ChartProps {
    data?: number[];
    labels?: string[];
    color?: string;
    height?: number;
    loading?: boolean;
}

export default function AdminChart({ 
    data = [], 
    labels = [], 
    color = "#10b981", 
    height = 200,
    loading = false 
}: ChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const { points, fillPath, max } = useMemo(() => {
        if (!data || data.length === 0) {
            return { points: "", fillPath: "", max: 0 };
        }
        
        const maxVal = Math.max(...data, 1);
        const width = 100;
        const step = width / (data.length - 1 || 1);
        
        const pts = data.map((val, i) => {
            const x = i * step;
            const normalizedY = val / maxVal;
            const y = 90 - (normalizedY * 80);
            return `${x},${y}`;
        }).join(" ");

        const fill = `0,100 ${pts} 100,100`;

        return { points: pts, fillPath: fill, max: maxVal };
    }, [data]);

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center" style={{ height: `${height}px` }}>
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="w-full flex items-center justify-center text-zinc-500" style={{ height: `${height}px` }}>
                No data available
            </div>
        );
    }

    return (
        <div className="w-full relative select-none" style={{ height: `${height}px` }}>
            <svg 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none" 
                className="w-full h-full overflow-visible"
            >
                {/* Defs for Gradients */}
                <defs>
                    <linearGradient id={`chart-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                    <filter id="chart-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />

                {/* Area Fill */}
                <polygon 
                    points={fillPath} 
                    fill={`url(#chart-gradient-${color})`} 
                />

                {/* Line */}
                <polyline 
                    points={points} 
                    fill="none" 
                    stroke={color} 
                    strokeWidth="2" 
                    vectorEffect="non-scaling-stroke"
                    filter="url(#chart-glow)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                
                {/* Data Points */}
                {data.map((val, i) => {
                    const x = (i / (data.length - 1 || 1)) * 100;
                    const y = 90 - ((val / max) * 80);
                    const isHovered = hoveredIndex === i;
                    
                    return (
                        <g key={i}>
                            {/* Hover area */}
                            <rect
                                x={x - 5}
                                y={0}
                                width={10}
                                height={100}
                                fill="transparent"
                                onMouseEnter={() => setHoveredIndex(i)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                style={{ cursor: "crosshair" }}
                            />
                            {/* Point */}
                            <circle 
                                cx={x} 
                                cy={y} 
                                r={isHovered ? 2.5 : 1.5} 
                                fill={color}
                                className="transition-all duration-150"
                                style={{ 
                                    opacity: isHovered ? 1 : 0.5,
                                    filter: isHovered ? `drop-shadow(0 0 4px ${color})` : "none"
                                }}
                            />
                        </g>
                    );
                })}
            </svg>
            
            {/* Tooltip */}
            {hoveredIndex !== null && (
                <div 
                    className="absolute top-2 right-2 px-3 py-2 bg-[#111117] border border-white/10 rounded-lg text-sm"
                    style={{ pointerEvents: "none" }}
                >
                    <p className="text-zinc-400 text-xs">{labels[hoveredIndex] || `Point ${hoveredIndex + 1}`}</p>
                    <p className="text-white font-bold">◎ {data[hoveredIndex].toFixed(2)}</p>
                </div>
            )}
            
            {/* Labels (X-Axis) */}
            {labels.length > 0 && (
                <div className="flex justify-between text-[10px] text-zinc-600 font-mono mt-2 px-1">
                    {labels.map((label, i) => (
                        <span key={i} className={hoveredIndex === i ? "text-white" : ""}>{label}</span>
                    ))}
                </div>
            )}
        </div>
    );
}
