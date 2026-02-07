"use client";

import { useEffect, useState, useRef } from "react";
import LiveTicker from "@/components/LiveTicker";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

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
      className={`absolute rounded-full blur-[100px] opacity-20 animate-float ${className}`}
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
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-t-4 border-violet-500 rounded-full animate-spin"></div>
                <div className="absolute inset-4 border-t-4 border-fuchsia-500 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
            </div>
          <p className="text-violet-400 text-sm tracking-[0.5em] uppercase animate-pulse">Initializing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen nebula-bg text-white overflow-x-hidden font-sans selection:bg-violet-500/30">
      
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
        <FloatingOrb className="w-[800px] h-[800px] bg-violet-900/40 top-[-20%] left-[-20%]" delay={0} />
        <FloatingOrb className="w-[600px] h-[600px] bg-fuchsia-900/40 bottom-[-10%] right-[-10%]" delay={2} />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 glass-heavy transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer">
                <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
                    <span className="text-xl font-bold text-white">◎</span>
                </div>
                <span className="font-bold text-xl tracking-tight text-white group-hover:text-violet-200 transition-colors">SOL Raffle</span>
            </div>

            <div className="flex items-center gap-6">
                <a href="/profile" className="hidden md:block text-sm font-medium text-zinc-400 hover:text-white transition-colors relative hover:after:content-[''] hover:after:absolute hover:after:-bottom-1 hover:after:left-0 hover:after:w-full hover:after:h-px hover:after:bg-violet-500">
                    Profile
                </a>
                
                {/* Replaced manual verify button with standard wallet button for robustness */}
                <WalletMultiButton className="!bg-gradient-to-r !from-violet-600 !to-fuchsia-600 hover:!from-violet-500 hover:!to-fuchsia-500 !rounded-xl !h-[42px] !font-bold !text-sm !px-6 transition-all" />
            </div>
        </div>
        
        {/* Live Ticker Component */}
        <LiveTicker />
      </nav>

      <main className="relative z-10 pt-40 pb-20 px-6">
        
        {/* Hero Section */}
        <section className={`max-w-7xl mx-auto mb-32 flex flex-col md:flex-row items-center gap-12 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold tracking-wider uppercase mb-8 animate-slide-up" style={{animationDelay: '0.1s'}}>
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#34d399]" />
                    Live on Solana Mainnet
                </div>
                
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 animate-slide-up" style={{animationDelay: '0.2s'}}>
                    WIN BIG <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white animate-gradient">METAVERSE</span>
                </h1>

                <p className="text-lg text-zinc-400 max-w-xl mx-auto md:mx-0 leading-relaxed mb-10 animate-slide-up" style={{animationDelay: '0.3s'}}>
                    The most transparent, on-chain raffle platform. Join thousands of winners securing blue-chip NFTs and SOL prizes daily.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up" style={{animationDelay: '0.4s'}}>
                    <button onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                        Explore Raffles
                    </button>
                    <a href="/winners" className="w-full sm:w-auto px-8 py-4 glass text-white font-bold rounded-xl hover:bg-white/10 transition-colors text-center">
                        View Winners
                    </a>
                </div>
            </div>

            {/* 3D Coin Visual */}
            <div className="flex-1 relative h-[500px] w-full flex items-center justify-center animate-float-slow">
                <div className="relative w-80 h-80 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-[0_0_100px_rgba(124,58,237,0.5)] flex items-center justify-center border-4 border-white/20 backdrop-blur-md">
                    <span className="text-9xl font-black text-white drop-shadow-xl filter">◎</span>
                    <div className="absolute inset-0 rounded-full border border-white/30 animate-spin-slow"></div>
                    <div className="absolute inset-[-20px] rounded-full border border-violet-500/30 animate-spin-slow" style={{animationDirection: 'reverse'}}></div>
                </div>
            </div>
        </section>

        {/* Stats Grid */}
        {stats && (
            <section className={`max-w-7xl mx-auto mb-32 grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up`} style={{animationDelay: '0.5s'}}>
                {[
                  { value: stats.activeRaffles, label: "Live Raffles", color: "text-violet-400" },
                  { value: stats.totalUsers, label: "Total Users", color: "text-fuchsia-400" },
                  { value: stats.totalTickets, label: "Tickets Sold", color: "text-cyan-400" },
                  { value: stats.totalRevenue, label: "SOL Volume", color: "text-emerald-400", isDecimal: true },
                ].map((stat, i) => (
                    <div key={i} className="glass rounded-2xl p-6 text-center hover:bg-white/5 transition-colors group">
                        <p className={`text-4xl font-black ${stat.color} mb-2 group-hover:scale-110 transition-transform`}>
                            {stat.isDecimal ? stats.totalRevenue.toFixed(1) : <AnimatedCounter value={stat.value} />}
                        </p>
                        <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
                    </div>
                ))}
            </section>
        )}

        {/* Raffles Grid */}
        <section className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-gradient-to-b from-violet-500 to-fuchsia-500 rounded-full"></span>
                    Active Raffles
                </h2>
                <div className="hidden md:flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
                    <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
                    <span className="w-12 h-2 rounded-full bg-violet-500"></span>
                </div>
            </div>

            {raffles.length === 0 ? (
                <div className="glass-heavy rounded-3xl p-24 text-center border border-white/5">
                    <div className="w-24 h-24 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">🔭</div>
                    <h3 className="text-2xl font-bold mb-2">No Active Raffles</h3>
                    <p className="text-zinc-500">The metaverse is quiet... for now.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {raffles.map((raffle, i) => (
                        <RaffleCard key={raffle.id} raffle={raffle} index={i} />
                    ))}
                </div>
            )}
        </section>

      </main>

      <footer className="border-t border-white/5 bg-[#020203]">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6 opacity-50 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
                <span className="font-bold text-lg">SOL Raffle</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-white/10">v2.0</span>
            </div>
            <p className="text-sm">Built on Solana</p>
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
  
  // Calculate progress percentage, capped at 100%
  const progress = Math.min((raffle.total_tickets / (raffle.total_tickets + 10)) * 100, 100); 
  // Note: Since we don't have max_tickets in the interface, I'm simulating a progress bar 
  // or we can remove it. Let's make it look like it's filling up based on an arbitrary goal or just total.
  // Actually, let's just show a visual indicator. If total_tickets is high, it looks fuller.
  // For now, let's assume a "target" of 100 tickets produces a full bar for visual effect.
  const visualProgress = Math.min((raffle.total_tickets / 100) * 100, 100);

  return (
    <div
      className="group relative glass-heavy rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(124,58,237,0.3)]"
      style={{ animationDelay: `${0.1 * index}s` }}
    >
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-[2rem] opacity-0 group-hover:opacity-100 blur transition-opacity duration-500 -z-10" />

      {/* Image Area */}
      <div className="relative h-64 overflow-hidden">
        {raffle.prize_image_url ? (
            <img
                src={raffle.prize_image_url}
                alt={raffle.prize_name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
        ) : (
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                <span className="text-6xl grayscale group-hover:grayscale-0 transition-all duration-500">🎁</span>
            </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-transparent opacity-90" />
        
        <div className="absolute top-4 right-4 backdrop-blur-md bg-black/40 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className={`text-xs font-mono font-bold ${isUrgent ? 'text-red-400' : 'text-emerald-400'}`}>
                {hoursLeft}h {minutesLeft}m
            </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 relative">
        <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#050507] border border-white/10 px-4 py-2 rounded-xl shadow-xl">
             <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                {prizeDisplay}
             </span>
        </div>

        <h3 className="text-xl font-bold mb-1 line-clamp-1 group-hover:text-violet-300 transition-colors">{raffle.prize_name}</h3>
        <p className="text-zinc-500 text-sm mb-6">Hosted by Official</p>

        {/* Progress Bar */}
        <div className="mb-6">
            <div className="flex justify-between text-xs font-medium mb-2">
                <span className="text-zinc-400">Tickets Sold</span>
                <span className="text-white">{raffle.total_tickets}</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                    style={{ width: `${visualProgress}%` }}
                />
            </div>
        </div>

        <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
                <span className="text-xs text-zinc-500">Price</span>
                <span className="font-bold text-white">◎ {raffle.ticket_price}</span>
            </div>
            <a href={`/raffles/${raffle.id}`} className="flex-1 bg-white text-black font-bold py-3 rounded-xl text-center hover:bg-violet-500 hover:text-white transition-all transform active:scale-95">
                Join Now
            </a>
        </div>
      </div>
    </div>
  );
}
