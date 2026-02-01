"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect, useRef } from "react";

interface Message {
    _id: string;
    username: string;
    message: string;
    wallet_address: string;
    avatar_url?: string;
    timestamp: string;
}

export default function ChatWidget() {
    const { publicKey, connected } = useWallet();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Poll for messages
    useEffect(() => {
        let interval: NodeJS.Timeout;
        const fetchMessages = async () => {
            try {
                const res = await fetch("/api/chat");
                const data = await res.json();
                if (data.messages) {
                    setMessages(prev => {
                        if (data.messages.length > prev.length && !isOpen) {
                            setUnreadCount(c => c + (data.messages.length - prev.length));
                        }
                        return data.messages;
                    });
                }
            } catch (e) {
                console.error("Chat poll error", e);
            }
        };

        fetchMessages();
        interval = setInterval(fetchMessages, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setUnreadCount(0);
        }
    }, [messages, isOpen]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !connected || !publicKey) return;

        const tempMsg = inputValue;
        setInputValue(""); // Optimistic clear

        try {
            await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wallet: publicKey.toBase58(),
                    message: tempMsg
                })
            });
            // Will attempt to fetch immediately in next poll, or we could manually trigger re-fetch
        } catch (err) {
            console.error("Failed to send", err);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">

            {/* Chat Window */}
            <div
                className={`pointer-events-auto w-80 sm:w-96 bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 origin-bottom-right ${isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-10 pointer-events-none h-0"
                    }`}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-white">Live Chat</span>
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Messages */}
                <div className="h-80 overflow-y-auto p-4 space-y-3 bg-black/40 scrollbar-thin scrollbar-thumb-white/10">
                    {messages.map((msg, i) => {
                        const isMe = publicKey?.toBase58() === msg.wallet_address;
                        return (
                            <div key={i} className={`flex items-start gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs overflow-hidden shrink-0 ${isMe ? "bg-violet-500" : "bg-zinc-700"}`}>
                                    {msg.avatar_url ? (
                                        <img src={msg.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        msg.username[0].toUpperCase()
                                    )}
                                </div>
                                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed break-words ${isMe ? "bg-violet-600/50 text-white rounded-tr-none" : "bg-white/10 text-zinc-200 rounded-tl-none"
                                    }`}>
                                    <p className="font-bold text-[10px] opacity-50 mb-0.5">{msg.username}</p>
                                    {msg.message}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-white/10 bg-black/20">
                    {!connected ? (
                        <div className="text-center text-xs text-zinc-500 py-2">
                            Connect wallet to chat
                        </div>
                    ) : (
                        <form onSubmit={handleSend} className="flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-violet-500/50 transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim()}
                                className="bg-violet-600 hover:bg-violet-500 text-white p-2 rounded-xl disabled:opacity-50 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto w-14 h-14 rounded-full shadow-lg shadow-violet-600/30 flex items-center justify-center transition-all duration-300 hover:scale-110 group ${isOpen ? "bg-zinc-800 rotate-90" : "bg-gradient-to-r from-violet-600 to-fuchsia-600"
                    }`}
            >
                {isOpen ? (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <div className="relative">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 h-4 min-w-[16px] flex items-center justify-center rounded-full border border-[#050507]">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>
                )}
            </button>

        </div>
    );
}
