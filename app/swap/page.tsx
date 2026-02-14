"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, VersionedTransaction } from "@solana/web3.js";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// Popular Solana tokens
const TOKENS = [
    { symbol: "SOL", name: "Solana", mint: "So11111111111111111111111111111111111111112", decimals: 9, logo: "◎", color: "#9945FF" },
    { symbol: "USDC", name: "USD Coin", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6, logo: "$", color: "#2775CA" },
    { symbol: "USDT", name: "Tether", mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals: 6, logo: "₮", color: "#26A17B" },
    { symbol: "BONK", name: "Bonk", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", decimals: 5, logo: "🐕", color: "#F2A900" },
];

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com";

// Slippage options in basis points
const SLIPPAGE_OPTIONS = [
    { label: "0.5%", value: 50 },
    { label: "1%", value: 100 },
    { label: "3%", value: 300 },
];

interface QuoteData {
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    priceImpactPct: string;
    routePlan: any[];
    otherAmountThreshold: string;
}

export default function SwapPage() {
    const { publicKey, signTransaction, connected } = useWallet();

    const [inputToken, setInputToken] = useState(TOKENS[0]); // SOL
    const [outputToken, setOutputToken] = useState(TOKENS[1]); // USDC
    const [inputAmount, setInputAmount] = useState("");
    const [quote, setQuote] = useState<QuoteData | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [swapStatus, setSwapStatus] = useState<"idle" | "loading" | "signing" | "confirming" | "success" | "error">("idle");
    const [swapMsg, setSwapMsg] = useState("");
    const [slippage, setSlippage] = useState(50); // 0.5% default
    const [customSlippage, setCustomSlippage] = useState("");
    const [showSlippage, setShowSlippage] = useState(false);
    const [showInputTokens, setShowInputTokens] = useState(false);
    const [showOutputTokens, setShowOutputTokens] = useState(false);

    // Debounced quote fetch
    const fetchQuote = useCallback(async (amount: string) => {
        if (!amount || parseFloat(amount) <= 0) {
            setQuote(null);
            return;
        }

        setQuoteLoading(true);
        try {
            const rawAmount = Math.floor(parseFloat(amount) * Math.pow(10, inputToken.decimals));
            const res = await fetch(
                `/api/swap/quote?inputMint=${inputToken.mint}&outputMint=${outputToken.mint}&amount=${rawAmount}&slippageBps=${slippage}`
            );
            const data = await res.json();

            if (res.ok && data.outAmount) {
                setQuote(data);
            } else {
                setQuote(null);
            }
        } catch (err) {
            console.error("Quote error:", err);
            setQuote(null);
        } finally {
            setQuoteLoading(false);
        }
    }, [inputToken, outputToken, slippage]);

    // Fetch quote when input changes (debounced)
    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchQuote(inputAmount);
        }, 500);
        return () => clearTimeout(timeout);
    }, [inputAmount, fetchQuote]);

    // Format output amount
    const outputAmount = quote
        ? (parseInt(quote.outAmount) / Math.pow(10, outputToken.decimals)).toFixed(outputToken.decimals > 6 ? 4 : 2)
        : "";

    // Price impact
    const priceImpact = quote ? parseFloat(quote.priceImpactPct) : 0;

    // Exchange rate
    const exchangeRate = quote && inputAmount
        ? (parseFloat(outputAmount) / parseFloat(inputAmount)).toFixed(4)
        : "";

    // Flip tokens
    const handleFlip = () => {
        const temp = inputToken;
        setInputToken(outputToken);
        setOutputToken(temp);
        setInputAmount(outputAmount || "");
        setQuote(null);
    };

    // Execute swap
    const handleSwap = async () => {
        if (!connected || !publicKey || !signTransaction || !quote) return;

        setSwapStatus("loading");
        setSwapMsg("Preparing transaction...");

        try {
            // Get serialized transaction from Jupiter
            const res = await fetch("/api/swap/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    quoteResponse: quote,
                    userPublicKey: publicKey.toBase58(),
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to get swap transaction");

            // Deserialize and sign
            setSwapStatus("signing");
            setSwapMsg("Please approve in your wallet...");

            const swapTransaction = data.swapTransaction;
            const transactionBuf = Buffer.from(swapTransaction, "base64");
            const transaction = VersionedTransaction.deserialize(transactionBuf);
            const signedTransaction = await signTransaction(transaction);

            // Send transaction
            setSwapStatus("confirming");
            setSwapMsg("Sending transaction...");

            const connection = new Connection(RPC_ENDPOINT, "confirmed");
            const rawTransaction = signedTransaction.serialize();
            const txid = await connection.sendRawTransaction(rawTransaction, {
                skipPreflight: true,
                maxRetries: 2,
            });

            setSwapMsg("Confirming transaction...");

            // Wait for confirmation
            const confirmation = await connection.confirmTransaction(txid, "confirmed");
            if (confirmation.value.err) throw new Error("Transaction failed on-chain");

            setSwapStatus("success");
            setSwapMsg(`Swapped ${inputAmount} ${inputToken.symbol} → ${outputAmount} ${outputToken.symbol}`);
            setInputAmount("");
            setQuote(null);

        } catch (err: any) {
            console.error("Swap error:", err);
            setSwapStatus("error");
            setSwapMsg(err.message || "Swap failed. Please try again.");
        }
    };

    // Token selector dropdown
    const TokenSelector = ({
        selected,
        onSelect,
        show,
        setShow,
        exclude,
    }: {
        selected: typeof TOKENS[0];
        onSelect: (t: typeof TOKENS[0]) => void;
        show: boolean;
        setShow: (v: boolean) => void;
        exclude: string;
    }) => (
        <div className="relative">
            <button
                onClick={() => setShow(!show)}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/15 rounded-xl transition-colors border border-white/5"
            >
                <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: selected.color + "30", color: selected.color }}
                >
                    {selected.logo}
                </span>
                <span className="font-bold text-white">{selected.symbol}</span>
                <span className="text-zinc-500 text-xs">▼</span>
            </button>

            {show && (
                <div className="absolute top-full mt-2 left-0 w-56 bg-[#111117] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                    {TOKENS.filter(t => t.mint !== exclude).map(token => (
                        <button
                            key={token.mint}
                            onClick={() => {
                                onSelect(token);
                                setShow(false);
                                setQuote(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                        >
                            <span
                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                                style={{ background: token.color + "30", color: token.color }}
                            >
                                {token.logo}
                            </span>
                            <div>
                                <p className="font-bold text-white text-sm">{token.symbol}</p>
                                <p className="text-zinc-500 text-xs">{token.name}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

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
                        <Link href="/swap" className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg">Swap</Link>
                        <Link href="/winners" className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg transition-colors">Winners</Link>
                    </div>

                    <WalletMultiButton />
                </div>
            </nav>

            <main className="max-w-lg mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black mb-2">Swap Tokens</h1>
                    <p className="text-zinc-500 text-sm">Swap any Solana token at the best rate</p>
                </div>

                {/* Swap Card */}
                <div className="glass-card rounded-3xl p-6 border border-white/5">
                    {/* Slippage Toggle */}
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-sm text-zinc-400">Swap</span>
                        <button
                            onClick={() => setShowSlippage(!showSlippage)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-zinc-400 transition-colors"
                        >
                            ⚙️ {slippage / 100}% slippage
                        </button>
                    </div>

                    {/* Slippage Options */}
                    {showSlippage && (
                        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-xs text-zinc-400 mb-3">Max Slippage</p>
                            <div className="flex gap-2">
                                {SLIPPAGE_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setSlippage(opt.value); setCustomSlippage(""); }}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            slippage === opt.value && !customSlippage
                                                ? "bg-emerald-500 text-black"
                                                : "bg-white/5 text-zinc-400 hover:bg-white/10"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                                <input
                                    type="number"
                                    placeholder="Custom"
                                    value={customSlippage}
                                    onChange={e => {
                                        setCustomSlippage(e.target.value);
                                        if (e.target.value) setSlippage(Math.round(parseFloat(e.target.value) * 100));
                                    }}
                                    className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-center text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* You Pay */}
                    <div className="bg-[#0a0a0f] rounded-2xl p-4 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-zinc-500">You Pay</span>
                            <span className="text-xs text-zinc-500">Balance: —</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                placeholder="0.00"
                                value={inputAmount}
                                onChange={e => setInputAmount(e.target.value)}
                                className="flex-1 bg-transparent text-2xl font-bold text-white focus:outline-none placeholder-zinc-700 min-w-0"
                            />
                            <TokenSelector
                                selected={inputToken}
                                onSelect={setInputToken}
                                show={showInputTokens}
                                setShow={(v) => { setShowInputTokens(v); setShowOutputTokens(false); }}
                                exclude={outputToken.mint}
                            />
                        </div>
                    </div>

                    {/* Flip Button */}
                    <div className="flex justify-center -my-3 relative z-10">
                        <button
                            onClick={handleFlip}
                            className="w-10 h-10 bg-[#1a1a24] border-4 border-[#0d0d12] rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all hover:rotate-180 duration-300"
                        >
                            ↕
                        </button>
                    </div>

                    {/* You Receive */}
                    <div className="bg-[#0a0a0f] rounded-2xl p-4 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-zinc-500">You Receive</span>
                            {quote && (
                                <span className="text-xs text-emerald-400">Best price via Jupiter</span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                {quoteLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-zinc-500 text-sm">Fetching quote...</span>
                                    </div>
                                ) : (
                                    <p className={`text-2xl font-bold ${outputAmount ? "text-white" : "text-zinc-700"}`}>
                                        {outputAmount || "0.00"}
                                    </p>
                                )}
                            </div>
                            <TokenSelector
                                selected={outputToken}
                                onSelect={setOutputToken}
                                show={showOutputTokens}
                                setShow={(v) => { setShowOutputTokens(v); setShowInputTokens(false); }}
                                exclude={inputToken.mint}
                            />
                        </div>
                    </div>

                    {/* Quote Details */}
                    {quote && (
                        <div className="mt-4 p-4 bg-white/[0.02] rounded-xl space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Rate</span>
                                <span className="text-zinc-300">1 {inputToken.symbol} ≈ {exchangeRate} {outputToken.symbol}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Price Impact</span>
                                <span className={priceImpact > 1 ? "text-red-400" : "text-emerald-400"}>
                                    {priceImpact.toFixed(4)}%
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Platform Fee</span>
                                <span className="text-zinc-400">0.5%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Route</span>
                                <span className="text-zinc-400">{quote.routePlan?.length || 1} hop(s)</span>
                            </div>
                        </div>
                    )}

                    {/* Swap Button */}
                    <div className="mt-6">
                        {!connected ? (
                            <div className="w-full py-4 rounded-xl bg-white/5 text-center text-zinc-400 font-bold">
                                Connect Wallet to Swap
                            </div>
                        ) : !inputAmount || !quote ? (
                            <button
                                disabled
                                className="w-full py-4 rounded-xl bg-white/5 text-zinc-500 font-bold cursor-not-allowed"
                            >
                                {inputAmount ? "Fetching quote..." : "Enter an amount"}
                            </button>
                        ) : (
                            <button
                                onClick={handleSwap}
                                disabled={swapStatus === "loading" || swapStatus === "signing" || swapStatus === "confirming"}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-lg shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {swapStatus === "loading" ? "Preparing..." :
                                 swapStatus === "signing" ? "Approve in wallet..." :
                                 swapStatus === "confirming" ? "Confirming..." :
                                 swapStatus === "success" ? "Swapped! ✓" :
                                 `Swap ${inputToken.symbol} → ${outputToken.symbol}`}
                            </button>
                        )}
                    </div>

                    {/* Status Message */}
                    {swapMsg && (
                        <div className={`mt-4 text-center text-sm px-4 py-3 rounded-xl ${
                            swapStatus === "error" ? "bg-red-500/10 text-red-400" :
                            swapStatus === "success" ? "bg-emerald-500/10 text-emerald-400" :
                            "bg-white/5 text-zinc-400"
                        }`}>
                            {swapMsg}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-zinc-600">
                        Powered by Jupiter aggregator • 0.5% platform fee
                    </p>
                </div>
            </main>
        </div>
    );
}
