import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const JUPITER_API_KEY = process.env.JUPITER_API_KEY || "";

// GET /api/swap/tokens?query=SOL — search Jupiter token list
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query") || "";

        if (!query || query.length < 1) {
            return NextResponse.json([]);
        }

        const headers: Record<string, string> = {
            "Accept": "application/json",
        };
        if (JUPITER_API_KEY) {
            headers["x-api-key"] = JUPITER_API_KEY;
        }

        const res = await fetch(
            `https://api.jup.ag/tokens/v2/search?query=${encodeURIComponent(query)}`,
            { headers }
        );

        if (!res.ok) {
            console.error("Jupiter token search error:", res.status);
            return NextResponse.json([]);
        }

        const data = await res.json();

        // Normalize Jupiter's field names to match our frontend TokenInfo interface
        const normalized = Array.isArray(data) ? data.map((token: any) => ({
            address: token.id || token.address || "",
            symbol: token.symbol || "",
            name: token.name || "",
            decimals: token.decimals ?? 6,
            logoURI: token.icon || token.logoURI || "",
            tags: token.tags || [],
            isVerified: token.isVerified || false,
        })) : [];

        return NextResponse.json(normalized);
    } catch (error) {
        console.error("Token search error:", error);
        return NextResponse.json([]);
    }
}
