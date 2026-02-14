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
        return NextResponse.json(data);
    } catch (error) {
        console.error("Token search error:", error);
        return NextResponse.json([]);
    }
}
