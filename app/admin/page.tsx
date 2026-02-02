"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [pendingRaffles, setPendingRaffles] = useState<any[]>([]);
    const { publicKey } = useWallet();

    useEffect(() => {
        // Fetch Stats
        fetch("/api/raffles").then(res => res.json()).then(data => setStats(data.stats));

        // Fetch Pending Raffles
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

            {/* Pending Winner Section */}
            {pendingRaffles.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-xl font-bold mb-4 text-amber-400">⚠️ Ended Raffles - Needs Winner</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {pendingRaffles.map(raffle => (
                            <div key={raffle.id} className="bg-white/5 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold">{raffle.prize_name}</h3>
                                    <p className="text-sm text-zinc-500">Ended: {new Date(raffle.end_time).toLocaleDateString()}</p>
                                </div>
                                <button
                                    onClick={() => handlePickWinner(raffle.id)}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-colors"
                                >
                                    🎲 Pick Winner
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
