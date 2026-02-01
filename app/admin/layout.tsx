"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { publicKey, connected } = useWallet();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Wait for wallet to initialize
        const checkAuth = setTimeout(() => {
            if (!connected) {
                setLoading(false);
                return;
            }

            if (publicKey?.toBase58() === ADMIN_WALLET) {
                setIsAuthorized(true);
            }
            setLoading(false);
        }, 1000); // Small delay to allow wallet adapter to load

        return () => clearTimeout(checkAuth);
    }, [connected, publicKey]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050507] flex items-center justify-center text-white">
                <div className="animate-spin w-8 h-8 border-2 border-violet-500 rounded-full border-t-transparent"></div>
            </div>
        );
    }

    if (!connected) {
        return (
            <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center text-white gap-4">
                <h1 className="text-2xl font-bold">Admin Access Only</h1>
                <p className="text-zinc-500">Please connect the authorized admin wallet.</p>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center text-white gap-4">
                <h1 className="text-red-500 text-2xl font-bold">Unauthorized</h1>
                <p className="text-zinc-500">Your wallet is not authorized to view this page.</p>
                <button
                    onClick={() => router.push("/")}
                    className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20"
                >
                    Go Home
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050507] text-white">
            <nav className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                            Admin Panel
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="/admin" className="text-sm hover:text-white text-zinc-400 transition-colors">Dashboard</a>
                        <a href="/admin/raffles/create" className="text-sm hover:text-white text-zinc-400 transition-colors">Create Raffle</a>
                        <a href="/" className="text-sm hover:text-white text-zinc-400 transition-colors">Exit</a>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    );
}
