"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { publicKey, connected } = useWallet();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const [profile, setProfile] = useState({
        username: "",
        avatar: "",
        totalSpent: 0,
        totalTickets: 0,
        tickets: []
    });

    // Edit Form State
    const [formData, setFormData] = useState({
        username: "",
        avatar: ""
    });

    const [msg, setMsg] = useState("");

    const fetchProfile = () => {
        if (!publicKey) return;
        setLoading(true);
        fetch(`/api/user/profile?wallet=${publicKey.toBase58()}`)
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setProfile(data.user);
                    setFormData({
                        username: data.user.username || "",
                        avatar: data.user.avatar || ""
                    });
                }
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (connected && publicKey) {
            fetchProfile();
        } else if (!connected) {
            setLoading(false);
        }
    }, [connected, publicKey]);

    const handleUpdate = async () => {
        if (!publicKey) return;
        setMsg("Updating...");

        try {
            const res = await fetch("/api/user/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet: publicKey.toBase58(),
                    username: formData.username,
                    avatar: formData.avatar
                })
            });

            if (res.ok) {
                setMsg("Profile updated!");
                setIsEditing(false);
                fetchProfile(); // Refresh
            } else {
                const d = await res.json();
                setMsg("Error: " + d.error);
            }
        } catch (e) {
            setMsg("Failed to update");
        }
    };

    if (!connected) {
        return (
            <div className="min-h-screen bg-[#050507] flex items-center justify-center text-white">
                Connect Wallet to view profile
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050507] flex items-center justify-center text-white">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050507] text-white pt-24 px-6 md:px-0">
            <div className="max-w-4xl mx-auto">

                {/* Header Card */}
                <div className="glass rounded-3xl p-8 mb-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-transparent pointer-events-none" />

                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                        {/* Avatar */}
                        <div className="w-32 h-32 rounded-full border-4 border-white/10 overflow-hidden bg-zinc-800 shadow-2xl">
                            {profile.avatar ? (
                                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl text-zinc-600">
                                    {profile.username ? profile.username[0].toUpperCase() : "?"}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            {isEditing ? (
                                <div className="space-y-4 max-w-sm">
                                    <div>
                                        <label className="text-xs text-zinc-500 uppercase font-bold">Username</label>
                                        <input
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 mt-1"
                                            value={formData.username}
                                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                                            placeholder="Enter username"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500 uppercase font-bold">Avatar URL</label>
                                        <input
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 mt-1"
                                            value={formData.avatar}
                                            onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                                            placeholder="https://imgur.com/..."
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button onClick={handleUpdate} className="flex-1 bg-violet-600 hover:bg-violet-500 py-2 rounded-lg font-bold text-sm">Save</button>
                                        <button onClick={() => setIsEditing(false)} className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-2 rounded-lg font-bold text-sm">Cancel</button>
                                    </div>
                                    {msg && <p className="text-xs text-cyan-400">{msg}</p>}
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-4xl font-black mb-2">{profile.username || "Anonymous User"}</h1>
                                    <p className="font-mono text-zinc-500 text-sm mb-4 bg-black/30 inline-block px-3 py-1 rounded-lg">
                                        {publicKey.toBase58()}
                                    </p>
                                    <div className="flex gap-2 justify-center md:justify-start">
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold transition-colors"
                                        >
                                            Edit Profile
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* KPI Stats */}
                        <div className="flex gap-6 text-center">
                            <div>
                                <p className="text-3xl font-black text-emerald-400">◎ {profile.totalSpent.toFixed(2)}</p>
                                <p className="text-xs text-zinc-500 uppercase tracking-wider">Total Spent</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-fuchsia-400">{profile.totalTickets}</p>
                                <p className="text-xs text-zinc-500 uppercase tracking-wider">Tickets</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <h2 className="text-2xl font-bold mb-6 px-2">Ticket History</h2>

                {profile.tickets.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 dashed">
                        <p className="text-zinc-500">No tickets found.</p>
                        <a href="/" className="text-violet-400 hover:text-violet-300 text-sm font-bold mt-2 inline-block">Buy your first ticket &rarr;</a>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {profile.tickets.map((ticket: any, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400 font-bold">
                                        🎟️
                                    </div>
                                    <div>
                                        <p className="font-bold">Raffle #{ticket.raffle_id}</p>
                                        <p className="text-xs text-zinc-500">{new Date(ticket.purchased_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-white">{ticket.quantity} Tickets</p>
                                    <p className="text-xs text-emerald-400">◎ {ticket.amount_paid}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
