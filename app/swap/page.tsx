"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { VersionedTransaction } from "@solana/web3.js";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

// Default popular tokens (always shown at top)
const POPULAR_TOKENS = [
    { symbol: "SOL", name: "Solana", address: "So11111111111111111111111111111111111111112", decimals: 9, logoURI: "", tags: ["verified"] },
    { symbol: "USDC", name: "USD Coin", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6, logoURI: "", tags: ["verified"] },
    { symbol: "USDT", name: "Tether", address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals: 6, logoURI: "", tags: ["verified"] },
    { symbol: "BONK", name: "Bonk", address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", decimals: 5, logoURI: "", tags: ["verified"] },
    { symbol: "JUP", name: "Jupiter", address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", decimals: 6, logoURI: "", tags: ["verified"] },
    { symbol: "WIF", name: "dogwifhat", address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", decimals: 6, logoURI: "", tags: ["verified"] },
    { symbol: "PYTH", name: "Pyth Network", address: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3", decimals: 6, logoURI: "", tags: ["verified"] },
    { symbol: "RAY", name: "Raydium", address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", decimals: 6, logoURI: "", tags: ["verified"] },
    { symbol: "ORCA", name: "Orca", address: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE", decimals: 6, logoURI: "", tags: ["verified"] },
    { symbol: "RENDER", name: "Render", address: "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof", decimals: 8, logoURI: "", tags: ["verified"] },
];

interface TokenInfo {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    logoURI: string;
    tags?: string[];
}

const SLIPPAGE_OPTIONS = [
    { label: "0.5%", value: 50 },
    { label: "1%", value: 100 },
    { label: "3%", value: 300 },
];

interface OrderData {
    requestId: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    otherAmountThreshold: string;
    swapType: string;
    slippageBps: number;
    priceImpactPct: string;
    routePlan: any[];
    transaction: string;
    error?: string;
    errorMessage?: string;
}

// Color generator for tokens without logos
function tokenColor(symbol: string): string {
    const colors = ["#9945FF", "#14F195", "#2775CA", "#26A17B", "#F2A900", "#E84142", "#627EEA", "#FF6B6B", "#4ECDC4", "#45B7D1"];
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

export default function SwapPage() {
    const { publicKey, signTransaction, connected } = useWallet();

    const [inputToken, setInputToken] = useState<TokenInfo>(POPULAR_TOKENS[0]);
    const [outputToken, setOutputToken] = useState<TokenInfo>(POPULAR_TOKENS[1]);
    const [inputAmount, setInputAmount] = useState("");
    const [order, setOrder] = useState<OrderData | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [swapStatus, setSwapStatus] = useState<"idle" | "loading" | "signing" | "confirming" | "success" | "error">("idle");
    const [swapMsg, setSwapMsg] = useState("");
    const [slippage, setSlippage] = useState(50);
    const [customSlippage, setCustomSlippage] = useState("");
    const [showSlippage, setShowSlippage] = useState(false);

    // Token modal state
    const [tokenModal, setTokenModal] = useState<"input" | "output" | null>(null);
    const [tokenSearch, setTokenSearch] = useState("");
    const [searchResults, setSearchResults] = useState<TokenInfo[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    // Focus search input when modal opens
    useEffect(() => {
        if (tokenModal && searchRef.current) {
            setTimeout(() => searchRef.current?.focus(), 100);
        }
        if (tokenModal) {
            setTokenSearch("");
            setSearchResults([]);
        }
    }, [tokenModal]);

    // Debounced token search
    useEffect(() => {
        if (!tokenSearch || tokenSearch.length < 2) {
            setSearchResults([]);
            return;
        }
        const timeout = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await fetch(`/api/swap/tokens?query=${encodeURIComponent(tokenSearch)}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setSearchResults(data.slice(0, 20));
                }
            } catch (err) {
                console.error("Token search error:", err);
            } finally {
                setSearchLoading(false);
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [tokenSearch]);

    // Debounced order fetch
    const fetchOrder = useCallback(async (amount: string) => {
        if (!amount || parseFloat(amount) <= 0) {
            setOrder(null);
            return;
        }
        setQuoteLoading(true);
        try {
            const rawAmount = Math.floor(parseFloat(amount) * Math.pow(10, inputToken.decimals));
            const takerParam = publicKey ? `&taker=${publicKey.toBase58()}` : "";
            const res = await fetch(
                `/api/swap/quote?inputMint=${inputToken.address}&outputMint=${outputToken.address}&amount=${rawAmount}${takerParam}`
            );
            const data = await res.json();
            if (res.ok && data.outAmount) {
                setOrder(data);
            } else {
                setOrder(null);
            }
        } catch (err) {
            console.error("Quote error:", err);
            setOrder(null);
        } finally {
            setQuoteLoading(false);
        }
    }, [inputToken, outputToken, publicKey]);

    useEffect(() => {
        const timeout = setTimeout(() => fetchOrder(inputAmount), 500);
        return () => clearTimeout(timeout);
    }, [inputAmount, fetchOrder]);

    const outputAmount = order
        ? (parseInt(order.outAmount) / Math.pow(10, outputToken.decimals)).toFixed(Math.min(outputToken.decimals, 6))
        : "";

    const priceImpact = order?.priceImpactPct ? parseFloat(order.priceImpactPct) : 0;

    const exchangeRate = order && inputAmount && parseFloat(inputAmount) > 0
        ? (parseFloat(outputAmount) / parseFloat(inputAmount)).toFixed(4)
        : "";

    const handleFlip = () => {
        const temp = inputToken;
        setInputToken(outputToken);
        setOutputToken(temp);
        setInputAmount(outputAmount || "");
        setOrder(null);
    };

    const selectToken = (token: TokenInfo) => {
        if (tokenModal === "input") {
            if (token.address === outputToken.address) {
                setOutputToken(inputToken);
            }
            setInputToken(token);
        } else if (tokenModal === "output") {
            if (token.address === inputToken.address) {
                setInputToken(outputToken);
            }
            setOutputToken(token);
        }
        setOrder(null);
        setTokenModal(null);
    };

    // Execute swap via Ultra API
    const handleSwap = async () => {
        if (!connected || !publicKey || !signTransaction || !order) return;

        setSwapStatus("loading");
        setSwapMsg("Preparing transaction...");

        try {
            const rawAmount = Math.floor(parseFloat(inputAmount) * Math.pow(10, inputToken.decimals));
            const res = await fetch(
                `/api/swap/quote?inputMint=${inputToken.address}&outputMint=${outputToken.address}&amount=${rawAmount}&taker=${publicKey.toBase58()}`
            );
            const data = await res.json();

            if (data.error || data.errorMessage) {
                throw new Error(data.error || data.errorMessage);
            }
            if (!res.ok || !data.transaction) {
                throw new Error("Failed to get swap transaction. Make sure you have enough balance.");
            }

            const txBase64 = data.transaction;
            const requestId = data.requestId;

            setSwapStatus("signing");
            setSwapMsg("Please approve in your wallet...");

            const transactionBuf = Buffer.from(txBase64, "base64");
            const transaction = VersionedTransaction.deserialize(transactionBuf);
            const signedTransaction = await signTransaction(transaction);

            setSwapStatus("confirming");
            setSwapMsg("Sending transaction to Jupiter...");

            const serialized = Buffer.from(signedTransaction.serialize()).toString("base64");

            const executeRes = await fetch("/api/swap/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ signedTransaction: serialized, requestId }),
            });

            const executeData = await executeRes.json();

            if (!executeRes.ok) throw new Error(executeData.error || "Swap execution failed");
            if (executeData.status === "Failed") throw new Error(executeData.error || "Transaction failed on-chain");

            setSwapStatus("success");
            setSwapMsg(`Swapped ${inputAmount} ${inputToken.symbol} → ${outputAmount} ${outputToken.symbol}`);
            setInputAmount("");
            setOrder(null);
        } catch (err: any) {
            console.error("Swap error:", err);
            setSwapStatus("error");
            setSwapMsg(err.message || "Swap failed. Please try again.");
        }
    };

    // Token avatar component
    const TokenAvatar = ({ token, size = "w-8 h-8" }: { token: TokenInfo; size?: string }) => {
        const color = tokenColor(token.symbol);
        return token.logoURI ? (
            <img src={token.logoURI} alt={token.symbol} className={`${size} rounded-full`} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling && ((e.target as HTMLImageElement).nextElementSibling as HTMLElement).style.removeProperty('display'); }} />
        ) : (
            <span
                className={`${size} rounded-full flex items-center justify-center text-xs font-black shrink-0`}
                style={{ background: `linear-gradient(135deg, ${color}40, ${color}20)`, color }}
            >
                {token.symbol.slice(0, 2)}
            </span>
        );
    };

    // Token button (opens modal)
    const TokenButton = ({ token, side }: { token: TokenInfo; side: "input" | "output" }) => (
        <button
            onClick={() => setTokenModal(side)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-2 rounded-full bg-[#1c1c2e] hover:bg-[#252540] border border-white/5 transition-all shrink-0"
        >
            <TokenAvatar token={token} />
            <span className="font-bold text-white text-base tracking-wide">{token.symbol}</span>
            <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
        </button>
    );

    // Tokens to show in modal (popular + search results)
    const displayedTokens = tokenSearch.length >= 2
        ? searchResults
        : POPULAR_TOKENS;

    const excludeMint = tokenModal === "input" ? outputToken.address : inputToken.address;

    return (
        <div className="min-h-screen text-white" style={{ background: "linear-gradient(180deg, #08080f 0%, #0d0d1a 40%, #0a0a14 100%)" }}>
            {/* Ambient glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03] pointer-events-none" style={{ background: "radial-gradient(circle, #9945FF 0%, transparent 70%)" }} />
            <div className="fixed bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-[0.02] pointer-events-none" style={{ background: "radial-gradient(circle, #14F195 0%, transparent 70%)" }} />

            {/* Desktop Navigation */}
            <nav className="hidden md:block sticky top-0 z-50 border-b border-white/5 bg-[#08080f]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center shadow-lg">
                            <span className="text-lg font-bold">⇄</span>
                        </div>
                        <span className="font-bold text-lg text-white tracking-tight">SOLSWAP</span>
                    </Link>
                    <div className="flex items-center gap-1 bg-[#111119] p-1 rounded-xl border border-white/5">
                        <Link href="/" className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg transition-colors">Raffles</Link>
                        <Link href="/swap" className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg">Swap</Link>
                        <Link href="/profile" className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg transition-colors">Profile</Link>
                        <Link href="/winners" className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg transition-colors">Winners</Link>
                    </div>
                    <WalletMultiButton />
                </div>
            </nav>

            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <span className="text-lg font-bold">⇄</span>
                    </div>
                    <span className="font-black text-lg tracking-tight">SOLSWAP</span>
                </div>
                <button
                    onClick={() => setShowSlippage(!showSlippage)}
                    className="w-10 h-10 rounded-full bg-[#13131f] border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
            </div>

            {/* Main Content */}
            <main className="max-w-md mx-auto px-4 pt-4 md:pt-10 pb-28 md:pb-12">

                {/* Slippage Settings */}
                {showSlippage && (
                    <div className="mb-4 p-5 rounded-2xl border border-white/5 backdrop-blur-sm" style={{ background: "linear-gradient(135deg, #13131f 0%, #111119 100%)" }}>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Slippage Tolerance</p>
                            <button onClick={() => setShowSlippage(false)} className="text-zinc-500 hover:text-white text-lg">✕</button>
                        </div>
                        <div className="flex gap-2">
                            {SLIPPAGE_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => { setSlippage(opt.value); setCustomSlippage(""); }}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                        slippage === opt.value && !customSlippage
                                            ? "text-black shadow-lg shadow-emerald-500/20"
                                            : "bg-[#1c1c2e] text-zinc-400 hover:bg-[#252540] border border-white/5"
                                    }`}
                                    style={slippage === opt.value && !customSlippage ? { background: "linear-gradient(135deg, #9945FF, #14F195)" } : {}}
                                >
                                    {opt.label}
                                </button>
                            ))}
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    placeholder="Custom"
                                    value={customSlippage}
                                    onChange={e => {
                                        setCustomSlippage(e.target.value);
                                        if (e.target.value) setSlippage(Math.round(parseFloat(e.target.value) * 100));
                                    }}
                                    className="w-full py-2.5 bg-[#1c1c2e] border border-white/5 rounded-xl px-3 text-sm text-center text-white focus:outline-none focus:border-[#9945FF] transition-colors"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xs">%</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Swap Card */}
                <div className="rounded-3xl p-[1px] overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(153,69,255,0.15), rgba(20,241,149,0.08), rgba(153,69,255,0.05))" }}>
                    <div className="rounded-3xl p-5" style={{ background: "linear-gradient(135deg, #111119 0%, #0d0d18 50%, #111119 100%)" }}>

                        {/* You Pay */}
                        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #161622 0%, #13131f 100%)" }}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] uppercase tracking-widest text-emerald-400/70 font-bold">You Pay</span>
                                <span className="text-[11px] text-zinc-500">
                                    Balance: <span className="text-zinc-300">—</span>
                                    <button className="ml-1.5 text-emerald-400 font-bold hover:text-emerald-300 transition-colors">MAX</button>
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <TokenButton token={inputToken} side="input" />
                                <input
                                    type="number"
                                    placeholder="0.0"
                                    value={inputAmount}
                                    onChange={e => setInputAmount(e.target.value)}
                                    className="text-right bg-transparent text-3xl md:text-4xl font-black text-white focus:outline-none placeholder-zinc-700/50 w-0 flex-1 min-w-0"
                                />
                            </div>
                        </div>

                        {/* Flip Button */}
                        <div className="flex justify-center -my-[14px] relative z-10">
                            <button
                                onClick={handleFlip}
                                className="w-11 h-11 rounded-xl flex items-center justify-center border-[3px] transition-all duration-300 hover:scale-110 group"
                                style={{ background: "linear-gradient(135deg, #1a1a2e, #13131f)", borderColor: "#0d0d18", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}
                            >
                                <span className="text-emerald-400 group-hover:text-white transition-colors text-lg">⇅</span>
                            </button>
                        </div>

                        {/* You Receive */}
                        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #161622 0%, #13131f 100%)" }}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] uppercase tracking-widest text-emerald-400/70 font-bold">You Receive</span>
                                <span className="text-[11px] text-zinc-500">Balance: <span className="text-zinc-300">—</span></span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <TokenButton token={outputToken} side="output" />
                                <div className="flex-1 min-w-0 text-right">
                                    {quoteLoading ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-5 h-5 border-2 border-[#9945FF] border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : (
                                        <p className={`text-3xl md:text-4xl font-black ${outputAmount ? "text-white" : "text-zinc-700/50"}`}>
                                            {outputAmount || "0.0"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Exchange Rate */}
                        {order && (
                            <div className="flex items-center justify-between mt-4 px-1">
                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                    <span className="text-zinc-600">⇄</span>
                                    <span>1 {inputToken.symbol} ≈ {exchangeRate} {outputToken.symbol}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-400/10">
                                    <span className="text-emerald-400 text-xs">⚡</span>
                                    <span className="text-emerald-400 text-xs font-bold tracking-wide">BEST</span>
                                </div>
                            </div>
                        )}

                        {/* Swap Button */}
                        <div className="mt-5">
                            {!connected ? (
                                <div className="w-full flex justify-center">
                                    <WalletMultiButton />
                                </div>
                            ) : !inputAmount || !order ? (
                                <button
                                    disabled
                                    className="w-full py-4 md:py-5 rounded-2xl text-zinc-500 font-black text-base md:text-lg tracking-widest uppercase cursor-not-allowed transition-all"
                                    style={{ background: "linear-gradient(135deg, #1a1a2e, #13131f)" }}
                                >
                                    {inputAmount ? "FETCHING QUOTE..." : "ENTER AMOUNT"}
                                </button>
                            ) : (
                                <button
                                    onClick={handleSwap}
                                    disabled={swapStatus === "loading" || swapStatus === "signing" || swapStatus === "confirming"}
                                    className="w-full py-4 md:py-5 rounded-2xl text-black font-black text-base md:text-lg tracking-widest uppercase shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99]"
                                    style={{ background: "linear-gradient(135deg, #9945FF 0%, #14F195 100%)" }}
                                >
                                    {swapStatus === "loading" ? "PREPARING..." :
                                     swapStatus === "signing" ? "APPROVE IN WALLET..." :
                                     swapStatus === "confirming" ? "CONFIRMING..." :
                                     swapStatus === "success" ? "SWAPPED! ✓" :
                                     "REVIEW SWAP"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Message */}
                {swapMsg && (
                    <div className={`mt-4 text-center text-sm px-4 py-3 rounded-2xl border ${
                        swapStatus === "error" ? "bg-red-500/5 border-red-500/10 text-red-400" :
                        swapStatus === "success" ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400" :
                        "bg-white/[0.02] border-white/5 text-zinc-400"
                    }`}>
                        {swapMsg}
                    </div>
                )}

                {/* Swap Details */}
                {order && (
                    <div className="mt-5">
                        <div className="flex items-center gap-3 mb-4">
                            <p className="text-[11px] uppercase tracking-widest text-emerald-400/70 font-bold">Swap Details</p>
                            <div className="flex-1 h-[1px] bg-gradient-to-r from-emerald-400/10 to-transparent" />
                        </div>
                        <div className="space-y-3.5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-400">Price Impact</span>
                                <span className={`text-sm font-medium ${priceImpact > 1 ? "text-red-400" : "text-emerald-400"}`}>
                                    {Math.abs(priceImpact) < 0.01 ? "< 0.01%" : `${priceImpact.toFixed(2)}%`}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-zinc-400">Slippage</span>
                                    <button onClick={() => setShowSlippage(!showSlippage)} className="text-zinc-600 hover:text-emerald-400 transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                </div>
                                <span className="text-sm text-zinc-300 font-medium">{order.slippageBps ? order.slippageBps / 100 : slippage / 100}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-400">Swap Type</span>
                                <span className="text-sm text-zinc-300 font-medium capitalize">{order.swapType || "Aggregator"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-400">Route</span>
                                <span className="text-sm text-zinc-300 font-medium">{order.routePlan?.length || 1} hop(s)</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Price Card */}
                {order && (
                    <div className="mt-6 rounded-2xl p-5 border border-white/5" style={{ background: "linear-gradient(135deg, #111119 0%, #0d0d18 100%)" }}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{inputToken.symbol}/{outputToken.symbol}</span>
                            <span className="text-xs text-emerald-400 font-bold">via Jupiter Ultra</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-2xl md:text-3xl font-black text-white">{exchangeRate || "—"}</p>
                            <div className="flex items-end gap-[3px] h-10">
                                {[40, 55, 35, 65, 50, 75, 60, 80, 70, 90, 85].map((h, i) => (
                                    <div key={i} className="w-[5px] rounded-full transition-all" style={{ height: `${h}%`, background: i >= 8 ? "linear-gradient(to top, #9945FF, #14F195)" : "#1c1c2e" }} />
                                ))}
                            </div>
                        </div>
                        <div className="mt-3 h-1 rounded-full overflow-hidden bg-[#1c1c2e]">
                            <div className="h-full rounded-full" style={{ width: "65%", background: "linear-gradient(90deg, #14F195, #9945FF)" }} />
                        </div>
                    </div>
                )}

                <div className="hidden md:block mt-8 text-center">
                    <p className="text-xs text-zinc-600">Powered by Jupiter Ultra • All Solana tokens supported</p>
                </div>
            </main>

            {/* TOKEN SELECTION MODAL */}
            {tokenModal && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setTokenModal(null)} />

                    {/* Modal */}
                    <div className="relative w-full max-w-md mx-auto bg-[#111119] border border-white/10 rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col" style={{ animation: "slideUp 0.3s ease" }}>
                        {/* Header */}
                        <div className="p-5 pb-0">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-black text-lg">Select Token</h2>
                                <button onClick={() => setTokenModal(null)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">✕</button>
                            </div>

                            {/* Search Input */}
                            <div className="relative mb-4">
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input
                                    ref={searchRef}
                                    type="text"
                                    placeholder="Search name, symbol, or paste address..."
                                    value={tokenSearch}
                                    onChange={e => setTokenSearch(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-[#0a0a0f] border border-white/5 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#9945FF] transition-colors"
                                />
                            </div>
                        </div>

                        {/* Token List */}
                        <div className="flex-1 overflow-y-auto px-2 pb-5" style={{ maxHeight: "50vh" }}>
                            {/* Popular label */}
                            {tokenSearch.length < 2 && (
                                <p className="px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Popular Tokens</p>
                            )}

                            {/* Loading */}
                            {searchLoading && tokenSearch.length >= 2 && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-[#9945FF] border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}

                            {/* No results */}
                            {!searchLoading && tokenSearch.length >= 2 && searchResults.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-zinc-500 text-sm">No tokens found</p>
                                    <p className="text-zinc-600 text-xs mt-1">Try a different search term or paste a mint address</p>
                                </div>
                            )}

                            {/* Token items */}
                            {(!searchLoading || tokenSearch.length < 2) && displayedTokens.map(token => (
                                <button
                                    key={token.address}
                                    onClick={() => selectToken(token)}
                                    disabled={token.address === excludeMint}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                                        token.address === excludeMint
                                            ? "opacity-30 cursor-not-allowed"
                                            : "hover:bg-white/5"
                                    }`}
                                >
                                    <TokenAvatar token={token} size="w-10 h-10" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-white text-sm">{token.symbol}</p>
                                            {token.tags?.includes("verified") && (
                                                <span className="text-[9px] bg-emerald-400/10 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">✓</span>
                                            )}
                                        </div>
                                        <p className="text-zinc-600 text-xs truncate">{token.name}</p>
                                    </div>
                                    <p className="text-zinc-600 text-[10px] font-mono truncate max-w-[80px]">{token.address.slice(0, 4)}...{token.address.slice(-4)}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Slide-up animation */}
            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/5" style={{ background: "linear-gradient(180deg, #0d0d18 0%, #08080f 100%)" }}>
                <div className="flex items-center justify-around py-2 pb-safe">
                    <Link href="/swap" className="flex flex-col items-center gap-1 py-2 px-4">
                        <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Swap</span>
                    </Link>
                    <Link href="/profile" className="flex flex-col items-center gap-1 py-2 px-4">
                        <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Wallet</span>
                    </Link>
                    <Link href="/" className="flex flex-col items-center gap-1 py-2 px-4">
                        <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Raffles</span>
                    </Link>
                    <Link href="/winners" className="flex flex-col items-center gap-1 py-2 px-4">
                        <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">More</span>
                    </Link>
                </div>
            </nav>
        </div>
    );
}
