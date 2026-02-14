"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState, useEffect, use } from "react";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useRouter } from "next/navigation";

// Use fallback logic
const FALLBACK_RPCS = [
    process.env.NEXT_PUBLIC_RPC_ENDPOINT,
    "https://rpc.ankr.com/solana",
    "https://solana-mainnet.g.alchemy.com/v2/demo",
    // "https://api.tatum.io/v3/blockchain/node/solana-mainnet", // Rate limited (5 req/min)
    "https://api.mainnet-beta.solana.com",
].filter(Boolean) as string[];

const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS;

interface Raffle {
    id: number;
    prize_name: string;
    prize_image_url?: string;
    ticket_price: number;
    total_tickets: number;
    end_time: string;
    description?: string;
    prize_type: string;
    prize_amount: number;
}

export default function RafflePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { publicKey, sendTransaction, connected } = useWallet();
    const [raffle, setRaffle] = useState<Raffle | null>(null);
    const [loading, setLoading] = useState(true);
    const [discordId, setDiscordId] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [status, setStatus] = useState<"idle" | "verifying" | "buying" | "success" | "error">("idle");
    const [msg, setMsg] = useState("");
    const [lastTx, setLastTx] = useState("");

    // Fetch Raffle & User Info
    useEffect(() => {
        // 1. Fetch Raffle
        fetch(`/api/raffles`)
            .then(res => res.json())
            .then(data => {
                const found = data.raffles?.find((r: any) => r.id.toString() === resolvedParams.id);
                setRaffle(found || null);
                setLoading(false);
            });

        // 2. Check if wallet is linked to Discord
        if (connected && publicKey) {
            fetch(`/api/verify?wallet=${publicKey.toBase58()}`)
                .then(res => res.json())
                .then(data => {
                    if (data.verified) {
                        setDiscordId(data.discord_id);
                    }
                });
        }
    }, [resolvedParams.id, connected, publicKey]);

    // Helper to find working connection
    const getConnection = async () => {
        for (const rpc of FALLBACK_RPCS) {
            try {
                const connection = new Connection(rpc);
                await connection.getLatestBlockhash("confirmed");
                return connection;
            } catch (e) {
                console.warn(`RPC ${rpc} failed, trying next...`);
            }
        }
        throw new Error("All RPC endpoints are busy/blocked. Please try again later.");
    };

    const handleBuy = async () => {
        if (!connected || !publicKey) return;
        if (!discordId) {
            router.push("/verify");
            return;
        }
        if (!raffle || !TREASURY_ADDRESS) return;

        setStatus("buying");
        setMsg("Finding best network connection...");

        try {
            // Find working RPC
            const connection = await getConnection();
            
            const totalCost = raffle.ticket_price * quantity;

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new PublicKey(TREASURY_ADDRESS),
                    lamports: totalCost * LAMPORTS_PER_SOL,
                })
            );

            const signature = await sendTransaction(transaction, connection);
            setLastTx(signature);
            setMsg("Transaction sent! Confirming...");

            // Wait for confirmation
            try {
                const confirmation = await connection.confirmTransaction(signature, "confirmed");
                if (confirmation.value.err) throw new Error("Transaction failed on-chain");
            } catch (confirmErr: any) {
                console.warn("Confirmation warning:", confirmErr);
                if (confirmErr.toString().includes("30.00 seconds")) {
                    setMsg("Timeout waiting for confirmation. Checking API...");
                } else {
                    throw confirmErr;
                }
            }

            setMsg("Recording tickets...");

            // Call API
            const res = await fetch("/api/tickets/buy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    raffleId: raffle.id,
                    discordId: discordId,
                    quantity: quantity,
                    signature: signature,
                    amount: totalCost,
                    wallet: publicKey.toBase58()
                })
            });

            const data = await res.json();
            if (res.ok) {
                setStatus("success");
                setMsg(`Success! You bought ${quantity} tickets!`);
                setRaffle(prev => prev ? { ...prev, total_tickets: prev.total_tickets + quantity } : null);
            } else {
                throw new Error(data.error);
            }

        } catch (err: any) {
            console.error(err);
            setStatus("error");
            setMsg(err.message || "Purchase failed");
        }
    };

    if (loading) return <div className="min-h-screen bg-[#050507] flex items-center justify-center text-white">Loading...</div>;
    if (!raffle) return <div className="min-h-screen bg-[#050507] flex items-center justify-center text-white">Raffle not found</div>;

    const endTime = new Date(raffle.end_time);
    const timeLeft = endTime.getTime() - Date.now();
    const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));

    return (
        <div className="min-h-screen bg-[#050507] text-white">
            {/* Nav */}
            <nav className="border-b border-white/5 p-4">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <a href="/" className="font-bold text-xl flex items-center gap-2">
                        <span>◎</span> SOL Raffle
                    </a>
                    <WalletMultiButton className="!bg-violet-600 hover:!bg-violet-500 !rounded-lg !py-2 !px-4 !h-auto !text-sm" />
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="glass rounded-3xl overflow-hidden p-8 grid md:grid-cols-2 gap-12">

                    {/* Left: Image & Info */}
                    <div>
                        <div className="aspect-square rounded-2xl bg-zinc-800 overflow-hidden mb-6">
                            {raffle.prize_image_url ? (
                                <img src={raffle.prize_image_url} alt={raffle.prize_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">🎁</div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between p-4 bg-white/5 rounded-xl">
                                <span className="text-zinc-400">Total Tickets Sold</span>
                                <span className="font-bold text-violet-400">{raffle.total_tickets}</span>
                            </div>
                            <div className="flex justify-between p-4 bg-white/5 rounded-xl">
                                <span className="text-zinc-400">Time Remaining</span>
                                <span className="font-bold text-red-400">{hoursLeft} Hours</span>
                            </div>
                            <div className="flex justify-between p-4 bg-white/5 rounded-xl">
                                <span className="text-zinc-400">Ends At</span>
                                <span className="font-bold text-zinc-300 text-sm">
                                    {endTime.toLocaleString(undefined, {
                                        dateStyle: "medium",
                                        timeStyle: "short"
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Purchase */}
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{raffle.prize_name}</h1>
                        <p className="text-xl text-emerald-400 font-bold mb-6">◎ {raffle.ticket_price} SOL <span className="text-sm text-zinc-500 font-normal">/ ticket</span></p>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                            <label className="block text-sm text-zinc-400 mb-3">Select Quantity</label>
                            <div className="flex gap-2 mb-4">
                                {[1, 5, 10].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setQuantity(n)}
                                        className={`flex-1 py-2 rounded-lg font-medium transition-colors ${quantity === n ? 'bg-violet-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                                    >
                                        {n}
                                    </button>
                                ))}
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                    className="w-20 bg-black/20 border border-white/10 rounded-lg px-3 text-center focus:outline-none focus:border-violet-500"
                                />
                            </div>

                            <div className="flex justify-between items-center text-sm mb-6 pb-6 border-b border-white/5">
                                <span className="text-zinc-400">Total Cost</span>
                                <span className="text-xl font-bold text-white">◎ {(raffle.ticket_price * quantity).toFixed(3)}</span>
                            </div>

                            {!connected ? (
                                <div className="text-center p-4 bg-amber-500/10 text-amber-500 rounded-xl text-sm">
                                    Connect wallet to buy tickets
                                </div>
                            ) : !discordId ? (
                                <div className="text-center">
                                    <p className="text-red-400 text-sm mb-3">Discord not linked!</p>
                                    <button onClick={() => router.push('/verify')} className="w-full py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 font-bold transition-colors">
                                        Link Discord First
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleBuy}
                                    disabled={status === 'buying' || status === 'success'}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 font-bold text-lg shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {status === 'buying' ? 'Processing...' : status === 'success' ? 'Joined! 🎉' : 'Buy Tickets'}
                                </button>
                            )}

                            {msg && (
                                <div className={`mt-4 text-center text-sm ${status === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {msg}
                                </div>
                            )}

                            {status === 'error' && lastTx && (
                                <div className="mt-2 text-center">
                                    <a 
                                        href={`https://solscan.io/tx/${lastTx}${process.env.NEXT_PUBLIC_RPC_ENDPOINT?.includes('devnet') ? '?cluster=devnet' : ''}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-violet-400 hover:text-violet-300 underline"
                                    >
                                        Check Transaction on Solscan
                                    </a>
                                </div>
                            )}
                        </div>

                        <p className="text-center text-xs text-zinc-500">
                            Purchasing via treasury: {TREASURY_ADDRESS?.slice(0, 4)}...{TREASURY_ADDRESS?.slice(-4)}
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
