"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateRaffle() {
    const { publicKey } = useWallet();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        prize_name: "",
        prize_image_url: "",
        ticket_price: "",
        end_time: "",
        prize_type: "sol",
        prize_amount: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/admin/raffles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    wallet: publicKey?.toBase58()
                })
            });

            if (res.ok) {
                router.push("/admin");
            } else {
                alert("Failed to create raffle");
            }
        } catch (err) {
            console.error(err);
            alert("Error creating raffle");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Create New Raffle</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Prize Name */}
                <div>
                    <label className="block text-sm text-zinc-400 mb-2">Prize Name</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500"
                        placeholder="e.g. 10 SOL Jackpot"
                        value={formData.prize_name}
                        onChange={e => setFormData({ ...formData, prize_name: e.target.value })}
                    />
                </div>

                {/* Image URL */}
                <div>
                    <label className="block text-sm text-zinc-400 mb-2">Image URL</label>
                    <input
                        type="url"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500"
                        placeholder="https://..."
                        value={formData.prize_image_url}
                        onChange={e => setFormData({ ...formData, prize_image_url: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* Ticket Price */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Ticket Price (SOL)</label>
                        <input
                            type="number"
                            step="0.001"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500"
                            placeholder="0.1"
                            value={formData.ticket_price}
                            onChange={e => setFormData({ ...formData, ticket_price: e.target.value })}
                        />
                    </div>

                    {/* End Time */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">End Date & Time</label>
                        <input
                            type="datetime-local"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500 [color-scheme:dark]"
                            value={formData.end_time}
                            onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* Prize Type */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Prize Type</label>
                        <select
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500"
                            value={formData.prize_type}
                            onChange={e => setFormData({ ...formData, prize_type: e.target.value })}
                        >
                            <option value="sol" className="bg-zinc-900">SOL</option>
                            <option value="nft" className="bg-zinc-900">NFT</option>
                            <option value="token" className="bg-zinc-900">Token</option>
                        </select>
                    </div>

                    {/* Prize Amount */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Prize Amount</label>
                        <input
                            type="number"
                            step="0.001"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500"
                            placeholder="10"
                            value={formData.prize_amount}
                            onChange={e => setFormData({ ...formData, prize_amount: e.target.value })}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-violet-600 hover:bg-violet-500 py-4 rounded-xl font-bold text-lg transition-colors disabled:opacity-50"
                >
                    {loading ? "Creating..." : "Launch Raffle 🚀"}
                </button>
            </form>
        </div>
    );
}
