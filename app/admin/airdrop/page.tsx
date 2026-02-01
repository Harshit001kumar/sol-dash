"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useCallback } from "react";
import { Connection, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";

const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com"; // Use process.env in prod
const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

export default function AirdropPage() {
    const { publicKey, sendTransaction, connected } = useWallet();
    const [eligibleUsers, setEligibleUsers] = useState<any[]>([]);
    const [status, setStatus] = useState("");
    const [dragActive, setDragActive] = useState(false);

    const [formData, setFormData] = useState({
        amount: "0.01",
        tokenType: "sol", // sol | token
    });

    // Handle Drag Events
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    // Handle Drop
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files[0]);
        }
    }, []);

    // Handle File Input
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files[0]);
        }
    };

    const handleFiles = (file: File) => {
        if (file.type !== "text/plain" && !file.name.endsWith('.txt')) {
            alert("Please upload a .txt file");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split(/\r?\n/);

            const validWallets: any[] = [];

            lines.forEach(line => {
                const clean = line.trim();
                // Basic Solana address validation (length check 32-44 chars)
                if (clean.length >= 32 && clean.length <= 44) {
                    validWallets.push({
                        wallet: clean,
                        username: "Imported User"
                    });
                }
            });

            setEligibleUsers(validWallets);
            setStatus(`Loaded ${validWallets.length} wallets from file.`);
        };
        reader.readAsText(file);
    };

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
            // For MVP, taking the first 15 to be safe.
            const batch = eligibleUsers.slice(0, 15);

            batch.forEach(user => {
                try {
                    transaction.add(
                        SystemProgram.transfer({
                            fromPubkey: publicKey,
                            toPubkey: new PublicKey(user.wallet),
                            lamports: Math.floor(amount * 1_000_000_000)
                        })
                    );
                } catch (e) {
                    console.error("Invalid key in batch:", user.wallet);
                }
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
            <h1 className="text-3xl font-bold mb-8">Multi-Sender Airdrop</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">

                    {/* 1. File Upload */}
                    <div
                        className={`p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center group
                        ${dragActive
                                ? "border-violet-500 bg-violet-600/10"
                                : "border-white/10 bg-white/5 hover:border-violet-500/50 hover:bg-white/10"
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-upload')?.click()}
                    >
                        <input
                            id="file-upload"
                            type="file"
                            accept=".txt"
                            className="hidden"
                            onChange={handleChange}
                        />

                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-lg mb-1">Upload Wallet List</h3>
                        <p className="text-sm text-zinc-500 mb-2">Drag & Drop or Click to Upload</p>
                        <span className="text-xs font-mono bg-black/40 px-2 py-1 rounded text-zinc-400">.txt files only</span>
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
                    <h3 className="font-bold mb-4">Recipients List</h3>

                    <div className="bg-black/40 rounded-xl p-4 mb-4 max-h-[300px] overflow-y-auto min-h-[100px]">
                        {eligibleUsers.length > 0 ? (
                            eligibleUsers.map((u, i) => (
                                <div key={i} className="flex justify-between text-sm py-1 border-b border-white/5 last:border-0">
                                    <span className="text-zinc-500 text-xs w-6">{i + 1}.</span>
                                    <span className="font-mono text-zinc-300">{u.wallet}</span>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                                <p>List is empty</p>
                            </div>
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
                </div>
            </div>
        </div>
    );
}
