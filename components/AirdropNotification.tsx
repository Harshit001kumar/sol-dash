"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

export default function AirdropNotification() {
    const { publicKey } = useWallet();
    const [pending, setPending] = useState<any>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!publicKey) return;

        // Check for pending airdrops
        const checkAirdrops = async () => {
            try {
                const res = await fetch(`/api/user/airdrops?wallet=${publicKey.toBase58()}`);
                const data = await res.json();

                if (data.pending && data.pending.length > 0) {
                    // Check if we already showed this one today (simple cookie/localstorage check)
                    const lastSeen = localStorage.getItem("last_airdrop_popup");
                    // For now, always show if there is actually a pending one, because it's important money!
                    // Or maybe show once per session.

                    setPending(data.pending[0]); // Show the first one
                    setVisible(true);
                }
            } catch (e) {
                console.error(e);
            }
        };

        checkAirdrops();
    }, [publicKey]);

    if (!visible || !pending) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#101014] border border-violet-500/30 rounded-3xl max-w-md w-full p-8 relative shadow-2xl shadow-violet-900/20 text-center animate-in fade-in zoom-in duration-300">

                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-violet-600 w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-[#101014]">
                    <span className="text-3xl">🎁</span>
                </div>

                <h2 className="text-2xl font-black mt-6 mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                    Airdrop Available!
                </h2>

                <p className="text-zinc-400 mb-6">
                    You have <strong>{pending.amount} Tokens</strong> waiting for you.
                </p>

                <div className="bg-white/5 rounded-xl p-4 mb-6 text-sm text-zinc-300">
                    To claim your tokens, please go to our Discord server and click the "Claim" button in your DMs or the announcements channel.
                </div>

                <div className="flex gap-4">
                    <a
                        href="https://discord.com/channels/@me"
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-violet-600 hover:bg-violet-500 py-3 rounded-xl font-bold transition-colors"
                    >
                        Go to Discord
                    </a>
                    <button
                        onClick={() => setVisible(false)}
                        className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-semibold transition-colors"
                    >
                        Dismiss
                    </button>
                </div>

            </div>
        </div>
    );
}
