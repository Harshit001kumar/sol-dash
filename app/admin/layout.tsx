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
        <div className="min-h-screen nebula-bg text-white selection:bg-violet-500/30">
            {/* Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]" />
            </div>

            <nav className="glass-heavy sticky top-0 z-50 animate-slide-up">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <span className="font-bold text-white">⚙️</span>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                            Admin Panel
                        </span>
                    </div>

                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 backdrop-blur-md">
                        <NavLink href="/admin" label="Overview" active />
                        <NavLink href="/admin/raffles/create" label="Create" />
                        <NavLink href="/admin/airdrop" label="Airdrop" />
                        <NavLink href="/" label="Exit" warning />
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 animate-fade-in" style={{animationDelay: '0.1s'}}>
                {children}
            </main>
        </div>
    );
}

function NavLink({ href, label, active, warning }: { href: string; label: string; active?: boolean; warning?: boolean }) {
    return (
        <a
            href={href}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                active
                    ? "bg-white/10 text-white shadow-lg shadow-white/5"
                    : warning 
                        ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
        >
            {label}
        </a>
    );
}
