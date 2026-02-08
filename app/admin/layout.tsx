"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

const adminNavItems = [
    { label: "Dashboard", href: "/admin", icon: "📊" },
    { label: "Create Raffle", href: "/admin/raffles/create", icon: "➕" },
    { label: "Airdrop", href: "/admin/airdrop", icon: "✈️" },
    { label: "Settings", href: "/admin/settings", icon: "⚙️" },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { publicKey, connected } = useWallet();
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = setTimeout(() => {
            if (!connected) {
                setLoading(false);
                return;
            }

            if (publicKey?.toBase58() === ADMIN_WALLET) {
                setIsAuthorized(true);
            }
            setLoading(false);
        }, 1000);

        return () => clearTimeout(checkAuth);
    }, [connected, publicKey]);

    if (loading) {
        return (
            <div className="min-h-screen app-bg flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-500 text-sm">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (!connected) {
        return (
            <div className="min-h-screen app-bg flex flex-col items-center justify-center text-white gap-6">
                <div className="w-20 h-20 rounded-2xl bg-[#111117] border border-white/10 flex items-center justify-center text-4xl">
                    🔐
                </div>
                <h1 className="text-2xl font-bold">Admin Access Only</h1>
                <p className="text-zinc-500">Please connect the authorized admin wallet.</p>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen app-bg flex flex-col items-center justify-center text-white gap-6">
                <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-4xl">
                    ⛔
                </div>
                <h1 className="text-2xl font-bold text-red-400">Unauthorized</h1>
                <p className="text-zinc-500">Your wallet is not authorized to view this page.</p>
                <button
                    onClick={() => router.push("/")}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors"
                >
                    Go Home
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen app-bg text-white">
            {/* Sidebar */}
            <Sidebar items={adminNavItems} />

            {/* Main Content */}
            <div className="ml-64">
                {/* Top Bar */}
                <header className="sticky top-0 z-40 h-16 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl flex items-center justify-between px-8">
                    <div className="flex items-center gap-4">
                        <nav className="flex items-center gap-2 text-sm text-zinc-400">
                            <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
                            <span>/</span>
                            <span className="text-white">
                                {pathname === "/admin" ? "Dashboard" : 
                                 pathname.includes("create") ? "Create Raffle" :
                                 pathname.includes("airdrop") ? "Airdrop" : "Page"}
                            </span>
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-zinc-500">
                            {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500" />
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
