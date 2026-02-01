"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { Connection, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";

const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com"; // Use process.env in prod
const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

export default function AirdropPage() {
    const { publicKey, sendTransaction, connected } = useWallet();
    const [roles, setRoles] = useState<any[]>([]);
    const [selectedRole, setSelectedRole] = useState("");
    const [eligibleUsers, setEligibleUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    const [formData, setFormData] = useState({
        amount: "0.01",
        tokenType: "sol", // sol | token
        mintAddress: ""
    });

    // Fetch Roles on Load
    useEffect(() => {
        fetch("/api/admin/discord/roles")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setRoles(data);
            })
            .catch(err => console.error(err));
    }, []);

    // Fetch Eligible Users when Role Changes
    useEffect(() => {
        if (!selectedRole) return;
        setLoading(true);
        fetch("/api/admin/discord/members", {
            method: "POST",
            body: JSON.stringify({ roleId: selectedRole })
        })
            .then(res => res.json())
            .then(data => {
                if (data.users) setEligibleUsers(data.users);
            })
            .finally(() => setLoading(false));
    }, [selectedRole]);

    const handleAirdrop = async () => {
        if (!connected || !publicKey) return;
        if (eligibleUsers.length === 0) return alert("No eligible users!");

        setStatus("Preparing Transaction...");

        try {
            const connection = new Connection(RPC_ENDPOINT);
            const transaction = new Transaction();

            const amount = parseFloat(formData.amount);
            if (isNaN(amount) || amount <= 0) return alert("Invalid amount");

            // Batch limit: Solana tx size is limited. 
            // For simple SOL transfers, we can fit ~20 per tx.
            // For MVP, lets just take the first 20 or loop (advanced).
            // Sending to first 20 for now to prevent failures.
            const batch = eligibleUsers.slice(0, 15);

            batch.forEach(user => {
                transaction.add(
                    SystemProgram.transfer({
                        fromPubkey: publicKey,
                        toPubkey: new PublicKey(user.wallet),
                        lamports: amount * 1_000_000_000 // Convert SOL to Lamports
                    })
                );
            });

            setStatus(`Requesting signature for ${batch.length} transfers...`);

            const sig = await sendTransaction(transaction, connection);

            setStatus("Confirming...");
            await connection.confirmTransaction(sig);

            setStatus(`Success! Sent to ${batch.length} users. Sig: ${sig.slice(0, 8)}...`);
        } catch (err) {
            console.error(err);
            setStatus("Failed: " + (err as Error).message);
        }
    };

    if (publicKey?.toBase58() !== ADMIN_WALLET) {
        return <div className="p-10 text-center">Unauthorized</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Role-Based Airdrop</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">

                    {/* 1. Select Role */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <h3 className="font-bold mb-4">1. Select Target Role</h3>
                        <select
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3"
                            onChange={e => setSelectedRole(e.target.value)}
                            value={selectedRole}
                        >
                            <option value="">-- Choose a Role --</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id} style={{ color: role.color ? `#${role.color.toString(16)}` : 'white' }}>
                                    {role.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 2. Configure Asset */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <h3 className="font-bold mb-4">2. Configure Airdrop</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-zinc-500">Asset Type</label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 mt-1"
                                    value={formData.tokenType}
                                    onChange={e => setFormData({ ...formData, tokenType: e.target.value })}
                                >
                                    <option value="sol">Native SOL</option>
                                    {/* SPL Token implementation requires more complex tx building (get ATA etc), sticking to SOL for MVP */}
                                    <option value="token" disabled>SPL Token (Coming Soon)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500">Amount Per User</label>
                                <input
                                    type="number"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 mt-1"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                </div>

                {/* 3. Preview */}
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 h-fit">
                    <h3 className="font-bold mb-4">Eligible Recipients</h3>

                    {loading ? (
                        <div className="text-center py-10 animate-pulse text-zinc-500">Scanning Database...</div>
                    ) : (
                        <>
                            <div className="bg-black/40 rounded-xl p-4 mb-4 max-h-[300px] overflow-y-auto">
                                {eligibleUsers.length > 0 ? (
                                    eligibleUsers.map((u, i) => (
                                        <div key={i} className="flex justify-between text-sm py-1 border-b border-white/5 last:border-0">
                                            <span className="text-zinc-400">{u.username.slice(0, 10)}</span>
                                            <span className="font-mono text-zinc-600">{u.wallet.slice(0, 4)}...{u.wallet.slice(-4)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-zinc-500 text-center">Select a role to see users.</p>
                                )}
                            </div>

                            <div className="flex justify-between text-sm mb-6">
                                <span className="text-zinc-400">Total Recipients:</span>
                                <span className="font-bold text-white">{eligibleUsers.length}</span>
                            </div>

                            <div className="flex justify-between text-sm mb-6">
                                <span className="text-zinc-400">Total Cost:</span>
                                <span className="font-bold text-emerald-400">
                                    {(eligibleUsers.length * parseFloat(formData.amount || "0")).toFixed(4)} SOL
                                </span>
                            </div>

                            <button
                                onClick={handleAirdrop}
                                disabled={!connected || eligibleUsers.length === 0}
                                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {status || "🚀 Confirm & Send"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
