"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminChart from "@/components/AdminChart";

interface ChartData {
    labels: string[];
    values: number[];
    summary: {
        total: number;
        average: number;
        period: string;
    };
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [pendingRaffles, setPendingRaffles] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [chartPeriod, setChartPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
    const [loading, setLoading] = useState(true);
    const { publicKey } = useWallet();

    useEffect(() => {
        // Fetch Stats
        fetch("/api/raffles")
            .then(res => res.json())
            .then(data => {
                setStats(data.stats);
                setLoading(false);
            })
            .catch(() => setLoading(false));

        // Fetch Pending Raffles
        fetch("/api/admin/raffles?filter=pending_winner")
            .then(res => res.json())
            .then(data => {
                if (data.raffles) setPendingRaffles(data.raffles);
            });
    }, []);

    // Fetch chart data when period changes
    useEffect(() => {
        fetch(`/api/stats/history?period=${chartPeriod}`)
            .then(res => res.json())
            .then(data => {
                if (data.labels && data.values) {
                    setChartData(data);
                }
            })
            .catch(console.error);
    }, [chartPeriod]);

    const handlePickWinner = async (raffleId: number) => {
        if (!confirm("Are you sure you want to pick a winner? This cannot be undone.")) return;

        try {
            const res = await fetch(`/api/admin/raffles/${raffleId}/winner`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet: publicKey?.toBase58() })
            });
            const data = await res.json();

            if (res.ok) {
                alert(`Winner Picked: ${data.winner.name} (${data.winner.wallet.slice(0, 4)}...${data.winner.wallet.slice(-4)})`);
                setPendingRaffles(prev => prev.filter(r => r.id !== raffleId));
            } else {
                alert("Error: " + data.error);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to pick winner");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white mb-1">Overview</h1>
                    <p className="text-zinc-500 text-sm">
                        Welcome back, portfolio up <span className="text-emerald-400">+{((stats?.totalRevenue || 0) * 0.054).toFixed(1)}%</span> today.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg bg-[#111117] border border-white/5 hover:bg-white/5 transition-colors">
                        🔔
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Balance Card */}
                <div className="glass-card p-6 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-zinc-400 text-sm">Total Revenue (SOL)</span>
                        <span className="text-zinc-600">ⓘ</span>
                    </div>
                    <p className="text-5xl font-black text-white mb-4 tracking-tight">
                        ◎{stats?.totalRevenue?.toFixed(2) || "0.00"}
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg">
                            📈 +5.4%
                        </span>
                        <span className="text-zinc-500 text-sm">+◎{((stats?.totalRevenue || 0) * 0.054).toFixed(2)} (24h)</span>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/5">
                        <Link href="/admin/raffles/create" className="flex items-center justify-center w-10 h-10 bg-emerald-500 rounded-xl hover:bg-emerald-400 transition-colors">
                            <span className="text-black">↗</span>
                        </Link>
                        <Link href="/admin/airdrop" className="flex items-center justify-center w-10 h-10 bg-[#1a1a24] border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
                            <span>↓</span>
                        </Link>
                    </div>
                </div>

                {/* Performance Chart */}
                <div className="glass-card p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-white font-semibold">Performance</h3>
                        <div className="flex items-center gap-1 bg-[#111117] p-1 rounded-lg border border-white/5">
                            {(["daily", "weekly", "monthly"] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setChartPeriod(p)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                        chartPeriod === p 
                                            ? "bg-emerald-500 text-black" 
                                            : "text-zinc-400 hover:text-white"
                                    }`}
                                >
                                    {p === "daily" ? "1H" : p === "weekly" ? "1W" : "1M"}
                                </button>
                            ))}
                        </div>
                    </div>
                    <AdminChart 
                        data={chartData?.values || []} 
                        labels={chartData?.labels || []} 
                        color="#10b981" 
                        height={180}
                        loading={!chartData}
                    />
                </div>
            </div>

            {/* Activity Table / Pending Raffles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Actions */}
                <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <h3 className="font-bold text-white">⚠️ Pending Actions</h3>
                        <span className="px-2 py-1 text-xs font-bold bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                            {pendingRaffles.length}
                        </span>
                    </div>
                    
                    {pendingRaffles.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-zinc-500">No raffles pending winner selection.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {pendingRaffles.map(raffle => (
                                <div key={raffle.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                            🏆
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{raffle.prize_name}</p>
                                            <p className="text-xs text-zinc-500">
                                                {raffle.total_tickets} tickets • Ended {new Date(raffle.end_time).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handlePickWinner(raffle.id)}
                                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold rounded-lg transition-colors"
                                    >
                                        Pick Winner
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                    <h3 className="font-bold text-white px-1">Quick Actions</h3>
                    
                    <Link
                        href="/admin/raffles/create"
                        className="group flex items-center gap-4 p-4 glass-card rounded-xl hover:border-emerald-500/30 transition-all"
                    >
                        <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
                            +
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-white group-hover:text-emerald-400 transition-colors">Create New Raffle</p>
                            <p className="text-xs text-zinc-500">Launch a new SOL or NFT raffle</p>
                        </div>
                        <span className="text-zinc-600 group-hover:text-emerald-400 transition-colors">→</span>
                    </Link>

                    <Link
                        href="/admin/airdrop"
                        className="group flex items-center gap-4 p-4 glass-card rounded-xl hover:border-cyan-500/30 transition-all"
                    >
                        <div className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/20">
                            ✈
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-white group-hover:text-cyan-400 transition-colors">Launch Airdrop</p>
                            <p className="text-xs text-zinc-500">Distribute tokens to users</p>
                        </div>
                        <span className="text-zinc-600 group-hover:text-cyan-400 transition-colors">→</span>
                    </Link>

                    <Link
                        href="/"
                        className="group flex items-center gap-4 p-4 glass-card rounded-xl hover:border-violet-500/30 transition-all"
                    >
                        <div className="w-12 h-12 rounded-xl bg-violet-500 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-lg shadow-violet-500/20">
                            🌐
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-white group-hover:text-violet-400 transition-colors">View Public Site</p>
                            <p className="text-xs text-zinc-500">See what users see</p>
                        </div>
                        <span className="text-zinc-600 group-hover:text-violet-400 transition-colors">→</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
