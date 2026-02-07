"use client";

import { useEffect, useState } from "react";

const EVENTS = [
    "🚀 User...8x92 just won 50 SOL!",
    "💎 User...3a11 bought 100 Tickets",
    "🔥 New Raffle: Bored Ape #1234 just started!",
    "💰 User...9c44 claimed 1000 USDC Airdrop",
    "🎟️ User...2b77 bought 5 Tickets",
    "🏆 User...1d00 won the DeGods Raffle!",
];

export default function LiveTicker() {
    return (
        <div className="w-full bg-[#050507] border-b border-white/5 overflow-hidden py-2 relative z-20">
            <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-transparent to-[#050507] z-10 pointer-events-none" />
            
            <div className="flex animate-marquee whitespace-nowrap">
                {[...EVENTS, ...EVENTS, ...EVENTS].map((event, i) => (
                    <div key={i} className="flex items-center gap-2 mx-8 text-sm font-medium text-zinc-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{event}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
