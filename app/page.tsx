"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import LiveTicker from "@/components/LiveTicker";

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

type Filter = "all" | "featured" | "ending" | "mine";

export default function Home() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/raffles")
      .then((res) => res.json())
      .then((data) => {
        setRaffles(data.raffles || []);
        setStats(data.stats || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Featured raffle is the one ending soonest with highest tickets
  const featuredRaffle = raffles.length > 0 
    ? raffles.reduce((prev, curr) => (curr.total_tickets > prev.total_tickets ? curr : prev))
    : null;

  // Filter raffles
  const filteredRaffles = raffles.filter(r => {
    if (filter === "ending") {
      const timeLeft = new Date(r.end_time).getTime() - Date.now();
      return timeLeft < 24 * 60 * 60 * 1000; // Ending in 24h
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center relative">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Loading raffles...</p>
        </div>
        
        {/* BEGIN AADS AD UNIT 2433002 */}
        <div style={{ position: "absolute", zIndex: 99999 }}>
          <input autoComplete="off" type="checkbox" id="aadsstickymnkjqbv3" hidden />
          <div style={{ paddingTop: 0, paddingBottom: "auto" }}>
            <div style={{ width: "100%", height: "auto", position: "fixed", textAlign: "center", fontSize: 0, bottom: 0, left: 0, right: 0, margin: "auto", zIndex: 99998 }}>
              <label htmlFor="aadsstickymnkjqbv3" style={{ top: "50%", transform: "translateY(-50%)", right: "24px", position: "absolute", borderRadius: "4px", background: "rgba(248, 248, 249, 0.70)", padding: "4px", zIndex: 99999, cursor: "pointer" }}>
                <svg fill="#000000" height="16px" width="16px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490 490">
                  <polygon points="456.851,0 245,212.564 33.149,0 0.708,32.337 212.669,245.004 0.708,457.678 33.149,490 245,277.443 456.851,490 489.292,457.678 277.331,245.004 489.292,32.337 " />
                </svg>
              </label>
              <div id="frame" style={{ width: "100%", margin: "auto", position: "relative", zIndex: 99998 }}>
                <div style={{ width: "70%", margin: "auto", textAlign: "left", position: "absolute", left: 0, right: 0, top: "-24px" }}>
                  <a 
                    style={{ display: "inline-block", fontSize: "13px", color: "#263238", padding: "4px 10px", background: "#F8F8F9", textDecoration: "none", borderRadius: "4px 4px 0 0" }}
                    id="frame-link"
                    target="_blank"
                    href="https://aads.com/campaigns/new?source_id=2433002&source_type=ad_unit&partner=2433002"
                  >
                    Advertise here
                  </a>
                </div>
                <iframe 
                  data-aa="2433002" 
                  src="//acceptable.a-ads.com/2433002/?size=Adaptive" 
                  style={{ border: 0, padding: 0, width: "70%", height: "auto", overflow: "hidden", margin: "auto" }}
                ></iframe>
              </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
              #aadsstickymnkjqbv3:checked + div {
                display: none;
              }
            ` }} />
          </div>
        </div>
        {/* END AADS AD UNIT 2433002 */}
      </div>
    );
  }

  return (
    <div className="min-h-screen app-bg text-white">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-lg font-bold">◎</span>
            </div>
            <span className="font-bold text-lg text-white">Solana Raffles</span>
          </Link>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-1 bg-[#111117] p-1 rounded-xl border border-white/5">
            <Link href="/" className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg">Raffles</Link>
            <Link href="/swap" className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg transition-colors">Swap</Link>
            <Link href="/profile" className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg transition-colors">Profile</Link>
            <Link href="/winners" className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg transition-colors">Winners</Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 md:gap-4">
            {stats && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#111117] rounded-lg border border-white/5">
                <span className="text-emerald-400 font-bold text-sm">◎ {stats.totalRevenue.toFixed(1)}</span>
              </div>
            )}
            <WalletMultiButton />
            <button 
              className="md:hidden p-2 text-zinc-400 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-[#0a0a0f] border-b border-white/5 flex flex-col p-4 gap-2 shadow-2xl">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-white bg-white/10 rounded-xl">Raffles</Link>
            <Link href="/swap" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-zinc-400 hover:text-white rounded-xl">Swap</Link>
            <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-zinc-400 hover:text-white rounded-xl">Profile</Link>
            <Link href="/winners" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-zinc-400 hover:text-white rounded-xl">Winners</Link>
          </div>
        )}

        {/* Live Ticker */}
        <LiveTicker />
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Featured Raffle Hero */}
        {featuredRaffle && (
          <section className="mb-12 rounded-3xl overflow-hidden bg-gradient-to-r from-[#111117] to-[#0d0d12] border border-white/5">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left: Image */}
              <div className="relative h-80 md:h-auto">
                {featuredRaffle.prize_image_url ? (
                  <img
                    src={featuredRaffle.prize_image_url}
                    alt={featuredRaffle.prize_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-900/30 to-teal-900/30 flex items-center justify-center">
                    <span className="text-8xl">🎁</span>
                  </div>
                )}
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-red-500 rounded-full text-xs font-bold text-white">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE NOW
                </div>
              </div>

              {/* Right: Details */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-3">FEATURED RAFFLE</p>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                  {featuredRaffle.prize_name}
                </h2>
                <p className="text-zinc-400 text-sm mb-8 line-clamp-2">
                  Get your entry now for a chance to win this amazing prize. Limited tickets available!
                </p>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-zinc-500 text-xs mb-1">TICKET PRICE</p>
                    <p className="text-2xl font-black text-emerald-400">◎ {featuredRaffle.ticket_price}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-zinc-500 text-xs mb-1">TIME REMAINING</p>
                    <CountdownTimer endTime={featuredRaffle.end_time} />
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-8">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-400">PROGRESS</span>
                    <span className="text-white font-bold">{featuredRaffle.total_tickets} / 1000 SOLD</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${Math.min((featuredRaffle.total_tickets / 1000) * 100, 100)}%` }} />
                  </div>
                </div>

                <Link
                  href={`/raffles/${featuredRaffle.id}`}
                  className="btn-primary text-center text-lg"
                >
                  Buy Tickets Now
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Stats Section */}
        {stats && (
          <section className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-6 text-center group hover:border-emerald-500/30 transition-all">
              <div className="text-3xl font-black text-emerald-400 mb-1 group-hover:scale-110 transition-transform">
                {stats.activeRaffles}
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Live Raffles</div>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center group hover:border-cyan-500/30 transition-all">
              <div className="text-3xl font-black text-cyan-400 mb-1 group-hover:scale-110 transition-transform">
                {stats.totalUsers}
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Total Users</div>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center group hover:border-violet-500/30 transition-all">
              <div className="text-3xl font-black text-violet-400 mb-1 group-hover:scale-110 transition-transform">
                {stats.totalTickets}
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Tickets Sold</div>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center group hover:border-amber-500/30 transition-all">
              <div className="text-3xl font-black text-amber-400 mb-1 group-hover:scale-110 transition-transform">
                ◎{stats.totalRevenue.toFixed(1)}
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">SOL Volume</div>
            </div>
          </section>
        )}

        {/* Filter Pills */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <div className="pill-group flex-wrap md:flex-nowrap justify-start">
            <button 
              className={`pill ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              🎯 All Raffles
            </button>
            <button 
              className={`pill ${filter === "featured" ? "active" : ""}`}
              onClick={() => setFilter("featured")}
            >
              ⭐ Featured
            </button>
            <button 
              className={`pill ${filter === "ending" ? "active" : ""}`}
              onClick={() => setFilter("ending")}
            >
              🔥 Ending Soon
            </button>
            <button 
              className={`pill ${filter === "mine" ? "active" : ""}`}
              onClick={() => setFilter("mine")}
            >
              🎟️ My Entries
            </button>
          </div>

          <div className="flex-1" />

          <div className="relative">
            <input
              type="text"
              placeholder="Search collections, tokens, or prizes..."
              className="w-80 px-4 py-2.5 bg-[#111117] border border-white/5 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
          </div>
        </div>

        {/* Raffle Grid */}
        {filteredRaffles.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <div className="w-20 h-20 bg-[#1a1a24] rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
              🔭
            </div>
            <h3 className="text-xl font-bold mb-2">No Raffles Found</h3>
            <p className="text-zinc-500">Check back soon for new opportunities!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredRaffles.map((raffle) => (
              <RaffleCard key={raffle.id} raffle={raffle} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-500 text-sm">Solana Raffles © 2025</p>
          <div className="flex items-center gap-6 text-sm text-zinc-400">
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Discord</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>

      {/* BEGIN AADS AD UNIT 2433002 */}
      <div style={{ position: "absolute", zIndex: 99999 }}>
        <input autoComplete="off" type="checkbox" id="aadsstickymnkjqbv3" hidden />
        <div style={{ paddingTop: 0, paddingBottom: "auto" }}>
          <div style={{ width: "100%", height: "auto", position: "fixed", textAlign: "center", fontSize: 0, bottom: 0, left: 0, right: 0, margin: "auto", zIndex: 99998 }}>
            <label htmlFor="aadsstickymnkjqbv3" style={{ top: "50%", transform: "translateY(-50%)", right: "24px", position: "absolute", borderRadius: "4px", background: "rgba(248, 248, 249, 0.70)", padding: "4px", zIndex: 99999, cursor: "pointer" }}>
              <svg fill="#000000" height="16px" width="16px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490 490">
                <polygon points="456.851,0 245,212.564 33.149,0 0.708,32.337 212.669,245.004 0.708,457.678 33.149,490 245,277.443 456.851,490 489.292,457.678 277.331,245.004 489.292,32.337 " />
              </svg>
            </label>
            <div id="frame" style={{ width: "100%", margin: "auto", position: "relative", zIndex: 99998 }}>
              <div style={{ width: "70%", margin: "auto", textAlign: "left", position: "absolute", left: 0, right: 0, top: "-24px" }}>
                <a 
                  style={{ display: "inline-block", fontSize: "13px", color: "#263238", padding: "4px 10px", background: "#F8F8F9", textDecoration: "none", borderRadius: "4px 4px 0 0" }}
                  id="frame-link"
                  target="_blank"
                  href="https://aads.com/campaigns/new?source_id=2433002&source_type=ad_unit&partner=2433002"
                >
                  Advertise here
                </a>
              </div>
              <iframe 
                data-aa="2433002" 
                src="//acceptable.a-ads.com/2433002/?size=Adaptive" 
                style={{ border: 0, padding: 0, width: "70%", height: "auto", overflow: "hidden", margin: "auto" }}
              ></iframe>
            </div>
          </div>
          <style dangerouslySetInnerHTML={{ __html: `
            #aadsstickymnkjqbv3:checked + div {
              display: none;
            }
          ` }} />
        </div>
      </div>
      {/* END AADS AD UNIT 2433002 */}
    </div>
  );
}

function RaffleCard({ raffle }: { raffle: Raffle }) {
  const endTime = new Date(raffle.end_time);
  const timeLeft = endTime.getTime() - Date.now();
  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
  const minutesLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));
  const isUrgent = hoursLeft < 2;

  const prizeDisplay = raffle.prize_type === "sol"
    ? `◎ ${raffle.prize_amount}`
    : raffle.prize_type === "nft"
      ? "NFT"
      : `${raffle.prize_amount} Tokens`;

  return (
    <Link href={`/raffles/${raffle.id}`} className="group">
      <div className="glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          {raffle.prize_image_url ? (
            <img
              src={raffle.prize_image_url}
              alt={raffle.prize_name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1a1a24] to-[#111117] flex items-center justify-center">
              <span className="text-5xl grayscale group-hover:grayscale-0 transition-all">🎁</span>
            </div>
          )}

          {/* Countdown Badge */}
          <div className="countdown-badge">
            <span className={`dot ${isUrgent ? "!bg-red-500" : ""}`} />
            <span className={isUrgent ? "text-red-400" : ""}>{hoursLeft}h {minutesLeft}m</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                {raffle.prize_name}
              </h3>
              <p className="text-xs text-zinc-500">Official Raffle</p>
            </div>
            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20">
              {prizeDisplay}
            </span>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-500">Tickets Sold</span>
              <span className="text-zinc-400">{raffle.total_tickets}/500</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${Math.min((raffle.total_tickets / 500) * 100, 100)}%` }} 
              />
            </div>
          </div>

          {/* CTA */}
          <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
            Buy Ticket <span>→</span>
          </button>
        </div>
      </div>
    </Link>
  );
}

function CountdownTimer({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("ENDED");
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return <p className="text-2xl font-black text-white font-mono">{timeLeft}</p>;
}
