"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface SidebarProps {
    items: {
        label: string;
        href: string;
        icon: React.ReactNode;
    }[];
}

export default function Sidebar({ items }: SidebarProps) {
    const pathname = usePathname();
    const { publicKey, disconnect } = useWallet();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0d0d12] border-r border-white/5 flex flex-col z-50">
            {/* Logo */}
            <div className="p-6 border-b border-white/5">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <span className="text-xl">◎</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white">SOL Raffles</h1>
                        <p className="text-xs text-zinc-500">Mainnet Beta</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                                isActive
                                    ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-white/5">
                {publicKey ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-sm">
                                👤
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                    {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                                </p>
                                <p className="text-xs text-emerald-400">Connected</p>
                            </div>
                        </div>
                        <button
                            onClick={() => disconnect()}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium transition-colors"
                        >
                            <span>↩</span>
                            Disconnect
                        </button>
                    </div>
                ) : (
                    <WalletMultiButton className="!w-full !justify-center" />
                )}
            </div>
        </aside>
    );
}
