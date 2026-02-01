"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState, useEffect } from "react";
import bs58 from "bs58";

export default function VerifyPage() {
    const { publicKey, signMessage, connected } = useWallet();
    const [discordId, setDiscordId] = useState("");
    const [status, setStatus] = useState<"idle" | "signing" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleVerify = async () => {
        if (!publicKey || !signMessage) {
            setStatus("error");
            setMessage("Please connect your wallet first");
            return;
        }

        if (!discordId) {
            setStatus("error");
            setMessage("Please enter your Discord User ID");
            return;
        }

        setStatus("signing");
        setMessage("Waiting for signature...");

        try {
            const verificationMessage = `SOL Raffle Wallet Verification\n\nDiscord ID: ${discordId}\nWallet: ${publicKey.toBase58()}\nTimestamp: ${Date.now()}`;

            const messageBytes = new TextEncoder().encode(verificationMessage);
            const signature = await signMessage(messageBytes);
            const signatureBase58 = bs58.encode(signature);

            const response = await fetch("/api/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet: publicKey.toBase58(),
                    signature: signatureBase58,
                    message: verificationMessage,
                    discordId: discordId,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus("success");
                setMessage("Wallet verified and linked to your Discord!");
            } else {
                setStatus("error");
                setMessage(data.error || "Verification failed");
            }
        } catch (err: any) {
            setStatus("error");
            setMessage(err.message || "Failed to sign message");
        }
    };

    return (
        <div className="min-h-screen bg-[#050507] text-white overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
                        backgroundSize: '100px 100px'
                    }}
                />
                <div className="absolute w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[150px] top-[-100px] left-[-100px] animate-float" />
                <div className="absolute w-[400px] h-[400px] bg-cyan-600/15 rounded-full blur-[120px] bottom-[-50px] right-[-50px] animate-float-slow" />

                {/* Floating Particles */}
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-violet-400/50 rounded-full animate-float" style={{ animationDelay: '0s' }} />
                <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-fuchsia-400/50 rounded-full animate-float" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-cyan-400/50 rounded-full animate-float" style={{ animationDelay: '2s' }} />
            </div>

            {/* Navigation */}
            <nav className={`relative z-20 border-b border-white/5 backdrop-blur-xl ${mounted ? 'animate-slide-up' : 'opacity-0'}`}>
                <div className="max-w-6xl mx-auto px-6 py-5">
                    <div className="flex items-center justify-between">
                        <a href="/" className="flex items-center gap-4 group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
                                <div className="relative w-11 h-11 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center">
                                    <span className="text-xl font-bold">◎</span>
                                </div>
                            </div>
                            <span className="font-bold text-xl tracking-tight">SOL Raffle</span>
                        </a>

                        <a
                            href="/"
                            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
                        >
                            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span className="text-sm font-medium">Dashboard</span>
                        </a>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 max-w-lg mx-auto px-6 py-20">

                {/* Header */}
                <div className={`text-center mb-12 ${mounted ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
                    <div className="inline-flex items-center justify-center w-20 h-20 mb-8 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl opacity-20 animate-pulse-glow" />
                        <div className="relative w-20 h-20 glass rounded-3xl flex items-center justify-center">
                            <svg className="w-10 h-10 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-3">
                        <span className="gradient-text">Verify Wallet</span>
                    </h1>
                    <p className="text-zinc-500 text-lg">
                        Link your Solana wallet to Discord
                    </p>
                </div>

                {/* Verification Card */}
                <div className={`glass rounded-3xl p-8 ${mounted ? 'animate-scale-in' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>

                    {/* Step 1 */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center text-sm font-bold shadow-lg shadow-violet-500/25">
                                1
                            </div>
                            <span className="font-semibold">Connect Wallet</span>
                            {connected && (
                                <span className="ml-auto text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">Connected</span>
                            )}
                        </div>
                        <WalletMultiButton className="!w-full !bg-gradient-to-r !from-violet-600 !to-fuchsia-600 hover:!from-violet-500 hover:!to-fuchsia-500 !rounded-xl !py-4 !font-semibold !text-sm !h-auto !transition-all !duration-300 !shadow-lg !shadow-violet-500/20" />
                        {connected && publicKey && (
                            <div className="flex items-center gap-2 mt-3 text-sm text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="font-mono text-xs truncate">
                                    {publicKey.toBase58()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Step 2 */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center text-sm font-bold shadow-lg shadow-violet-500/25">
                                2
                            </div>
                            <span className="font-semibold">Discord User ID</span>
                        </div>
                        <input
                            type="text"
                            placeholder="123456789012345678"
                            value={discordId}
                            onChange={(e) => setDiscordId(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 py-4 text-white placeholder-zinc-600 focus:outline-none transition-all font-mono text-sm focus:ring-2 focus:ring-violet-500/20"
                        />
                        <p className="text-zinc-600 text-xs mt-3 leading-relaxed">
                            💡 Enable Developer Mode in Discord settings, then right-click your username and select "Copy User ID"
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center text-sm font-bold shadow-lg shadow-violet-500/25">
                                3
                            </div>
                            <span className="font-semibold">Sign & Verify</span>
                        </div>
                        <button
                            onClick={handleVerify}
                            disabled={!connected || !discordId || status === "signing"}
                            className="relative w-full overflow-hidden bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-4 px-6 font-bold transition-all duration-300 shadow-lg shadow-violet-500/25 disabled:shadow-none group"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {status === "signing" ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Waiting for signature...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Verify Wallet
                                    </>
                                )}
                            </span>
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100" />
                        </button>
                    </div>

                    {/* Status Message */}
                    {message && (
                        <div
                            className={`mt-6 p-4 rounded-xl text-sm animate-scale-in ${status === "success"
                                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                    : status === "error"
                                        ? "bg-red-500/10 border border-red-500/20 text-red-400"
                                        : "bg-violet-500/10 border border-violet-500/20 text-violet-400"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {status === "success" && (
                                    <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                                {status === "error" && (
                                    <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                )}
                                <span>{message}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Cards */}
                <div className={`mt-8 grid grid-cols-2 gap-4 ${mounted ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: '0.6s' }}>
                    <div className="glass rounded-2xl p-5 group hover:border-cyan-500/30 transition-colors card-hover">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-2xl">🔒</span>
                        </div>
                        <p className="font-semibold text-sm mb-1">100% Secure</p>
                        <p className="text-zinc-600 text-xs leading-relaxed">We never ask for your private key</p>
                    </div>
                    <div className="glass rounded-2xl p-5 group hover:border-emerald-500/30 transition-colors card-hover">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <p className="font-semibold text-sm mb-1">Zero Fees</p>
                        <p className="text-zinc-600 text-xs leading-relaxed">Just sign a message, no SOL needed</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
