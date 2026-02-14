"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface Winner {
  id: number;
  prize_name: string;
  prize_image_url?: string;
  winner_wallet: string;
  winner_name?: string;
  end_time: string;
  prize_type: string;
  prize_amount: number;
}

export default function WinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/raffles?filter=winners")
      .then((res) => res.json())
      .then((data) => {
        setWinners(data.raffles || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Loading winners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-bg text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-lg font-bold">◎</span>
            </div>
            <span className="font-bold text-lg text-white">Solana Raffles</span>
          </Link>

          <div className="hidden md:flex items-center gap-1 bg-[#111117] p-1 rounded-xl border border-white/5">
            <Link href="/" className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg transition-colors">Raffles</Link>
            <Link href="/swap" className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg transition-colors">Swap</Link>
            <Link href="/profile" className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg transition-colors">Profile</Link>
            <Link href="/winners" className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg">Winners</Link>
          </div>

          <WalletMultiButton />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold rounded-full mb-6">
            🏆 Hall of Fame
          </div>
          <h1 className="text-5xl font-black text-white mb-4">Recent Winners</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Congratulations to all our lucky winners! Every raffle is verifiably fair and on-chain.
          </p>
        </div>

        {/* Winners Grid */}
        {winners.length === 0 ? (
          <div className="glass-card p-16 text-center rounded-2xl">
            <div className="w-24 h-24 bg-[#1a1a24] rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
              🏆
            </div>
            <h3 className="text-2xl font-bold mb-2">No Winners Yet</h3>
            <p className="text-zinc-500 mb-6">Be the first to win! Check out our active raffles.</p>
            <Link href="/" className="btn-primary inline-block">
              Browse Raffles
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {winners.map((winner, index) => (
              <div
                key={winner.id}
                className="glass-card rounded-2xl overflow-hidden group hover:border-amber-500/30 transition-all"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  {winner.prize_image_url ? (
                    <img
                      src={winner.prize_image_url}
                      alt={winner.prize_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-900/30 to-yellow-900/30 flex items-center justify-center">
                      <span className="text-6xl">🎁</span>
                    </div>
                  )}

                  {/* Rank Badge */}
                  {index < 3 && (
                    <div className="absolute top-3 left-3 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center font-black text-black shadow-lg">
                      #{index + 1}
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-lg text-white mb-1 truncate">{winner.prize_name}</h3>
                  <p className="text-amber-400 font-bold text-sm mb-4">
                    {winner.prize_type === "sol" ? `◎ ${winner.prize_amount}` : "NFT Prize"}
                  </p>

                  {/* Winner Info */}
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
                      👑
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {winner.winner_name || "Anonymous Winner"}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {winner.winner_wallet?.slice(0, 4)}...{winner.winner_wallet?.slice(-4)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 mt-3 text-center">
                    Won on {new Date(winner.end_time).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
