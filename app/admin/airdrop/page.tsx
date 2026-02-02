"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useCallback } from "react";
import { Connection, Transaction, SystemProgram, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    createTransferInstruction,
    getMint
} from "@solana/spl-token";

// List of fallbacks to try
const FALLBACK_RPCS = [
  process.env.NEXT_PUBLIC_RPC_ENDPOINT,
  "https://rpc.ankr.com/solana",
  "https://solana-mainnet.g.alchemy.com/v2/demo",
  // "https://api.tatum.io/v3/blockchain/node/solana-mainnet", // Rate limited
  clusterApiUrl('mainnet-beta'),
  "https://api.mainnet-beta.solana.com",
].filter(Boolean) as string[];

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

export default function AirdropPage() {
    const { publicKey, sendTransaction, connected } = useWallet();
    const [eligibleUsers, setEligibleUsers] = useState<any[]>([]);
    const [status, setStatus] = useState("");
    const [dragActive, setDragActive] = useState(false);

    // Allow user to manual override RPC
    const [customRpc, setCustomRpc] = useState("");

    const [formData, setFormData] = useState({
        amount: "0.1",
        tokenType: "sol", // sol | token
        mintAddress: ""
    });

    // Helper to get connection
    const getConnection = async () => {
        if (customRpc) return new Connection(customRpc);
        for (const rpc of FALLBACK_RPCS) {
            try {
                const connection = new Connection(rpc);
                await connection.getLatestBlockhash();
                return connection;
            } catch (e) { continue; }
        }
        throw new Error("All RPC endpoints failed.");
    };

    // Handle File Processing (same as before)
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
                if (clean.length >= 32 && clean.length <= 44) {
                    validWallets.push({ wallet: clean });
                }
            });
            setEligibleUsers(validWallets);
            setStatus(`Loaded ${validWallets.length} wallets.`);
        };
        reader.readAsText(file);
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFiles(e.dataTransfer.files[0]);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) handleFiles(e.target.files[0]);
    };

    const handleAirdrop = async () => {
        if (!connected || !publicKey) return;
        if (eligibleUsers.length === 0) return alert("No eligible users!");

        setStatus("Finding RPC...");

        try {
            const connection = await getConnection();

            const amount = parseFloat(formData.amount);
            if (isNaN(amount) || amount <= 0) return alert("Invalid amount");

            // Batching (Limit 10 for Token logic due to higher compute unit usage)
            const batch = eligibleUsers.slice(0, 10);
            const transaction = new Transaction();

            if (formData.tokenType === "sol") {
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
                        console.error("Invalid key:", user.wallet);
                    }
                });
            } else {
                // SPL Token Logic
                if (!formData.mintAddress) return alert("Mint Address Required");

                setStatus("Fetching Token Info...");
                const mintPubkey = new PublicKey(formData.mintAddress);
                const mintInfo = await getMint(connection, mintPubkey);
                const decimals = mintInfo.decimals;
                const tokenAmount = Math.floor(amount * Math.pow(10, decimals));

                for (const user of batch) {
                    try {
                        const recipientPubkey = new PublicKey(user.wallet);

                        // Get ATA addresses
                        const recipientATA = await getAssociatedTokenAddress(mintPubkey, recipientPubkey);
                        const senderATA = await getAssociatedTokenAddress(mintPubkey, publicKey);

                        // Check if recipient has ATA, if not create one (Cost: 0.002 SOL, paid by sender)
                        const accountInfo = await connection.getAccountInfo(recipientATA);
                        if (!accountInfo) {
                            transaction.add(
                                createAssociatedTokenAccountInstruction(
                                    publicKey, // Payer
                                    recipientATA,
                                    recipientPubkey,
                                    mintPubkey
                                )
                            );
                        }

                        // Transfer instruction
                        transaction.add(
                            createTransferInstruction(
                                senderATA,
                                recipientATA,
                                publicKey, // Owner
                                tokenAmount
                            )
                        );
                    } catch (e) {
                        console.error("Token setup failed for one user:", e);
                    }
                }
            }

            setStatus(`Requesting signature...`);
            const sig = await sendTransaction(transaction, connection);

            setStatus("Confirming...");
            await connection.confirmTransaction(sig);

            setStatus(`Success! Sent to ${batch.length} users.`);
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

            {/* Custom RPC Input */}
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mb-6">
                <input
                    type="text"
                    placeholder="Enter Custom RPC URL (optional)"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    value={customRpc}
                    onChange={e => setCustomRpc(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    {/* File Upload */}
                    <div
                        className={`p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center group
                        ${dragActive ? "border-violet-500 bg-violet-600/10" : "border-white/10 bg-white/5"}`}
                        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                        onClick={() => document.getElementById('file-upload')?.click()}
                    >
                        <input id="file-upload" type="file" accept=".txt" className="hidden" onChange={handleChange} />
                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">📂</div>
                        <h3 className="font-bold text-lg mb-1">Upload Wallet List</h3>
                        <p className="text-sm text-zinc-500 text-center">Drag & Drop or Click (.txt)</p>
                    </div>

                    {/* Configure Asset */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <h3 className="font-bold mb-4">2. Configure</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-zinc-500">Asset Type</label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 mt-1"
                                    value={formData.tokenType}
                                    onChange={e => setFormData({ ...formData, tokenType: e.target.value })}
                                >
                                    <option value="sol">Native SOL</option>
                                    <option value="token">SPL Token</option>
                                </select>
                            </div>

                            {formData.tokenType === "token" && (
                                <div>
                                    <label className="text-xs text-zinc-500">Token Mint Address</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 mt-1 font-mono text-sm"
                                        value={formData.mintAddress}
                                        onChange={e => setFormData({ ...formData, mintAddress: e.target.value })}
                                    />
                                </div>
                            )}

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

                {/* Preview */}
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 h-fit">
                    <h3 className="font-bold mb-4">Recipients ({eligibleUsers.length})</h3>
                    <div className="bg-black/40 rounded-xl p-4 mb-4 max-h-[300px] overflow-y-auto min-h-[100px]">
                        {eligibleUsers.map((u, i) => (
                            <div key={i} className="flex justify-between text-sm py-1 border-b border-white/5">
                                <span className="text-zinc-500 text-xs w-6">{i + 1}.</span>
                                <span className="font-mono text-zinc-300">{u.wallet.slice(0, 20)}...</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleAirdrop}
                        disabled={!connected || eligibleUsers.length === 0}
                        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 py-4 rounded-xl font-bold disabled:opacity-50"
                    >
                        {status || "🚀 Confirm & Send"}
                    </button>
                </div>
            </div>
        </div>
    );
}
