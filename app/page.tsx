"use client";

import { useEffect, useState, useRef } from "react";

interface Raffle {
  id: number;
  prize_name: string;
  prize_image_url?: string;
  ticket_price: number;
  total_tickets: number;
  end_time: string;
  prize_type: string;
  prize_amount: number;
}

interface Stats {
  totalUsers: number;
  totalRaffles: number;
  completedRaffles: number;
  activeRaffles: number;
  totalRevenue: number;
  totalTickets: number;
}

// Animated Counter Component
function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);

  useEffect(() => {
    const startTime = Date.now();
    const endValue = value;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(easeOut * endValue);

      if (currentValue !== countRef.current) {
        countRef.current = currentValue;
        setCount(currentValue);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{count.toLocaleString()}</>;
}

// Floating Orb Component
function FloatingOrb({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl opacity-30 animate-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

export default function Home() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/raffles")
      .then((res) => res.json())
      .then((data) => {
        setRaffles(data.raffles || []);
        setStats(data.stats || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-violet-500/20 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-violet-500 rounded-full animate-spin" />
            <div className="absolute inset-2 w-12 h-12 border-4 border-transparent border-t-fuchsia-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="text-zinc-600 text-sm tracking-widest uppercase">Loading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050507] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '100px 100px'
          }}
        />

        {/* Floating Orbs */}
        <FloatingOrb className="w-[600px] h-[600px] bg-violet-600 top-[-200px] left-[-100px]" delay={0} />
        <FloatingOrb className="w-[500px] h-[500px] bg-fuchsia-600 bottom-[-100px] right-[-100px]" delay={2} />
        <FloatingOrb className="w-[300px] h-[300px] bg-cyan-600 top-[40%] right-[20%]" delay={4} />

        {/* Animated Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-10">
          <div className="absolute inset-0 border border-violet-500/50 rounded-full animate-spin-slow" />
          <div className="absolute inset-12 border border-fuchsia-500/30 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse' }} />
          <div className="absolute inset-24 border border-cyan-500/20 rounded-full animate-spin-slow" style={{ animationDuration: '40s' }} />
        </div>
      </div>

      {/* Navigation */}
      <nav className={`relative z-20 border-b border-white/5 backdrop-blur-xl ${mounted ? 'animate-slide-up' : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
                <div className="relative w-11 h-11 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-2xl">
                  <span className="text-xl font-bold">◎</span>
                </div>
              </div>
              <div>
                <span className="font-bold text-xl tracking-tight">SOL Raffle</span>
                <span className="hidden sm:inline-block ml-2 text-xs font-medium text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full">BETA</span>
              </div>
            </div>

            <a
              href="/verify"
              className="group relative overflow-hidden bg-gradient-to-r from-violet-600 to-fuchsia-600 p-[1px] rounded-xl"
            >
              <div className="relative bg-[#0a0a0f] hover:bg-transparent px-5 py-2.5 rounded-xl transition-colors duration-300 flex items-center gap-2">
                <svg className="w-4 h-4 text-violet-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="font-semibold text-sm group-hover:text-white transition-colors">Verify Wallet</span>
              </div>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16 ${mounted ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20 px-4 py-2 rounded-full mb-8 animate-pulse-glow">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Live on Solana Mainnet
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
            <span className="gradient-text animate-gradient bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">Win Big</span>
            <br />
            <span className="text-white">with SOL Raffles</span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            The most trusted raffle platform on Solana. Fair, transparent, and fully on-chain.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      {stats && (
        <section className={`relative z-10 max-w-7xl mx-auto px-6 pb-16 ${mounted ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { value: stats.activeRaffles, label: "Live Raffles", color: "violet", icon: "🎯" },
              { value: stats.totalUsers, label: "Total Users", color: "fuchsia", icon: "👥" },
              { value: stats.totalTickets, label: "Tickets Sold", color: "cyan", icon: "🎫" },
              { value: stats.totalRevenue, label: "Volume (SOL)", color: "emerald", icon: "◎", isDecimal: true },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="group relative glass rounded-2xl p-6 card-hover"
                style={{ animationDelay: `${0.5 + i * 0.1}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative">
                  <span className="text-2xl mb-3 block">{stat.icon}</span>
                  <p className="text-4xl font-black tracking-tight mb-1">
                    {stat.isDecimal ? (
                      <>{stats.totalRevenue.toFixed(1)}</>
                    ) : (
                      <AnimatedCounter value={stat.value} />
                    )}
                  </p>
                  <p className="text-zinc-500 text-sm">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active Raffles Section */}
      <section className={`relative z-10 max-w-7xl mx-auto px-6 pb-20 ${mounted ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: '0.6s' }}>
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Active Raffles</h2>
            <p className="text-zinc-500">Enter now for a chance to win</p>
          </div>
          {raffles.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-zinc-400">{raffles.length} live now</span>
            </div>
          )}
        </div>

        {raffles.length === 0 ? (
          <div className="glass rounded-3xl p-16 text-center">
            <div className="w-20 h-20 bg-zinc-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-float">
              <span className="text-4xl">🎰</span>
            </div>
            <h3 className="text-xl font-bold mb-2">No Active Raffles</h3>
            <p className="text-zinc-500 max-w-sm mx-auto">Check back soon for exciting new raffles and prizes!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {raffles.map((raffle, i) => (
              <RaffleCard key={raffle.id} raffle={raffle} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-10">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold">◎</span>
              </div>
              <span className="font-semibold">SOL Raffle</span>
            </div>
            <p className="text-zinc-600 text-sm">© 2024 SOL Raffle. Built on Solana.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function RaffleCard({ raffle, index }: { raffle: Raffle; index: number }) {
  const endTime = new Date(raffle.end_time);
  const timeLeft = endTime.getTime() - Date.now();
  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
  const minutesLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));
  const isUrgent = hoursLeft < 2;

  const prizeDisplay = raffle.prize_type === "sol"
    ? `${raffle.prize_amount} SOL`
    : raffle.prize_type === "nft"
      ? "1 NFT"
      : `${raffle.prize_amount} Tokens`;

  return (
    <div
      className="group relative glass rounded-3xl overflow-hidden card-hover"
      style={{ animationDelay: `${0.7 + index * 0.1}s` }}
    >
      {/* Gradient Border on Hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" style={{ padding: '1px' }} />

      {/* Image Container */}
      <div className="relative h-48 bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden">
        {raffle.prize_image_url ? (
          <img
            src={raffle.prize_image_url}
            alt={raffle.prize_name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl opacity-20 group-hover:scale-125 group-hover:opacity-40 transition-all duration-500">🎁</span>
          </div>
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-transparent" />

        {/* Timer Badge */}
        <div className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md ${isUrgent
          ? "bg-red-500/30 text-red-200 border border-red-500/50"
          : "bg-black/50 text-white border border-white/20"
          }`}>
          {isUrgent && <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />}
          {hoursLeft}h {minutesLeft}m
        </div>

        {/* Prize Badge */}
        <div className="absolute bottom-4 left-4">
          <p className="text-2xl font-black text-white drop-shadow-lg">{prizeDisplay}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-bold text-lg truncate mb-4 group-hover:text-violet-300 transition-colors">
          {raffle.prize_name}
        </h3>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 text-sm">Entry Price</span>
            <span className="font-bold text-emerald-400">◎ {raffle.ticket_price}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-zinc-500 text-sm">Total Entries</span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(raffle.total_tickets / 100 * 100, 100)}%` }}
                />
              </div>
              <span className="font-bold text-sm">{raffle.total_tickets}</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-4 border-t border-white/5">
          <a
            href={`/raffles/${raffle.id}`}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-gradient-to-r hover:from-violet-600 hover:to-fuchsia-600 hover:text-white transition-all text-sm font-semibold group-hover:shadow-lg group-hover:shadow-violet-500/20"
          >
            Buy Tickets
          </a>
        </div>
      </div>
    </div>
  );
}
