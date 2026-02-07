"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import AdminChart from "@/components/AdminChart";
import Link from "next/link"; // Changed to Next.js Link for better performance

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [pendingRaffles, setPendingRaffles] = useState<any[]>([]);
    const { publicKey } = useWallet();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch Stats
        fetch("/api/raffles")
            .then(res => res.json())
            .then(data => {
                setStats(data.stats);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });

        // Fetch Pending Raffles
        // Note: API now filters out raffles with 0 tickets
        fetch("/api/admin/raffles?filter=pending_winner")
            .then(res => res.json())
            .then(data => {
                if (data.raffles) setPendingRaffles(data.raffles);
            });
    }, []);

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
                // Remove from list
                setPendingRaffles(prev => prev.filter(r => r.id !== raffleId));
            } else {
                alert("Error: " + data.error);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to pick winner");
        }
    };

    // Mock Data for the chart (since we don't have historical API yet)
    // Generate a nice curve
    const chartData = [12, 19, 15, 25, 32, 30, 45, 55, 48, 60, 75, 90]; 
    const chartLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    if (loading) {
        return <div className="animate-pulse flex gap-4"><div className="w-full h-32 bg-white/5 rounded-xl"></div></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white mb-2">Dashboard</h1>
                    <p className="text-zinc-400">Welcome back, Admin. Here is what's happening today.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-emerald-400 text-sm font-bold">System Operational</span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group relative glass-heavy p-6 rounded-2xl overflow-hidden hover:bg-white/5 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">💰</span>
                    </div>
                    <p className="text-zinc-500 text-sm font-medium mb-1">Total Revenue</p>
                    <p className="text-4xl font-black text-white tracking-tight">
                        ◎ {stats?.totalRevenue?.toFixed(1) || "0.0"}
                    </p>
                    <div className="mt-4 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 w-[70%]"></div>
                    </div>
                </div>

                <div className="group relative glass-heavy p-6 rounded-2xl overflow-hidden hover:bg-white/5 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">🎯</span>
                    </div>
                    <p className="text-zinc-500 text-sm font-medium mb-1">Active Raffles</p>
                    <p className="text-4xl font-black text-white tracking-tight">
                        {stats?.activeRaffles || 0}
                    </p>
                    <div className="mt-4 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 w-[45%]"></div>
                    </div>
                </div>

                <div className="group relative glass-heavy p-6 rounded-2xl overflow-hidden hover:bg-white/5 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">👥</span>
                    </div>
                    <p className="text-zinc-500 text-sm font-medium mb-1">Total Users</p>
                    <p className="text-4xl font-black text-white tracking-tight">
                        {stats?.totalUsers || 0}
                    </p>
                    <div className="mt-4 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                         <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 w-[85%]"></div>
                    </div>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="glass-heavy p-8 rounded-3xl border border-white/5">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-white">Revenue Analytics</h3>
                    <select className="bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-sm text-zinc-400 focus:outline-none focus:border-violet-500">
                        <option>Last 12 Months</option>
                        <option>Last 30 Days</option>
                        <option>Last 7 Days</option>
                    </select>
                </div>
                <div className="h-64 w-full">
                     <AdminChart data={chartData} labels={chartLabels} color="#8b5cf6" height={250} />
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Pending Actions */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                        Pending Actions
                    </h2>
                    
                    {pendingRaffles.length === 0 ? (
                        <div className="glass-heavy p-8 rounded-2xl text-center border-dashed border-2 border-white/5">
                            <p className="text-zinc-500">No auctions pending winners.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingRaffles.map(raffle => (
                                <div key={raffle.id} className="glass-heavy p-4 rounded-xl flex items-center justify-between hover:border-amber-500/30 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-xl">
                                            🏆
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">{raffle.prize_name}</h3>
                                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                                                <span>Ended: {new Date(raffle.end_time).toLocaleDateString()}</span>
                                                <span className="text-emerald-400/70">Tickets: {raffle.total_tickets}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handlePickWinner(raffle.id)}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-sm transition-all shadow-lg shadow-amber-500/20"
                                    >
                                        Pick Winner
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Links */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                         <span className="w-1.5 h-6 bg-violet-500 rounded-full"></span>
                        Quick Actions
                    </h2>
                    
                    <div className="grid grid-cols-1 gap-3">
                         <Link
                            href="/admin/raffles/create"
                            className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-violet-600/10 to-transparent border border-violet-500/20 hover:border-violet-500/50 hover:from-violet-600/20 transition-all"
                        >
                            <div className="w-12 h-12 rounded-lg bg-violet-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-lg shadow-violet-600/20">
                                ➕
                            </div>
                            <div>
                                <h3 className="font-bold text-white group-hover:text-violet-300 transition-colors">Create New Raffle</h3>
                                <p className="text-zinc-500 text-xs">Launch a new SOL or NFT raffle</p>
                            </div>
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-violet-400">
                                →
                            </div>
                        </Link>

                        <Link
                            href="/admin/airdrop"
                            className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-cyan-600/10 to-transparent border border-cyan-500/20 hover:border-cyan-500/50 hover:from-cyan-600/20 transition-all"
                        >
                            <div className="w-12 h-12 rounded-lg bg-cyan-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-lg shadow-cyan-600/20">
                                ✈️
                            </div>
                            <div>
                                <h3 className="font-bold text-white group-hover:text-cyan-300 transition-colors">Launch Airdrop</h3>
                                <p className="text-zinc-500 text-xs">Distribute tokens to users</p>
                            </div>
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400">
                                →
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
