"use client";

import { useEffect, useState } from "react";

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetch("/api/raffles").then(res => res.json()).then(data => setStats(data.stats));
    }, []);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-zinc-500 text-sm mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-emerald-400">
                        ◎ {stats?.totalRevenue?.toFixed(1) || "0.0"}
                    </p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-zinc-500 text-sm mb-1">Active Raffles</p>
                    <p className="text-3xl font-bold text-violet-400">
                        {stats?.activeRaffles || 0}
                    </p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-zinc-500 text-sm mb-1">Total Users</p>
                    <p className="text-3xl font-bold text-fuchsia-400">
                        {stats?.totalUsers || 0}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Quick Actions</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                    href="/admin/raffles/create"
                    className="flex items-center gap-4 p-6 rounded-xl bg-gradient-to-br from-violet-600/20 to-violet-600/10 border border-violet-500/20 hover:border-violet-500/50 transition-all group"
                >
                    <div className="w-12 h-12 rounded-lg bg-violet-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        +
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Create New Raffle</h3>
                        <p className="text-zinc-500 text-sm">Launch a new SOL or NFT raffle</p>
                    </div>
                </a>
            </div>
        </div>
    );
}
