import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const JUPITER_ULTRA_API = "https://api.jup.ag/ultra/v1";
const JUPITER_API_KEY = process.env.JUPITER_API_KEY || "";

// GET /api/swap/quote — returns quote + unsigned transaction via Ultra API
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const inputMint = searchParams.get("inputMint");
        const outputMint = searchParams.get("outputMint");
        const amount = searchParams.get("amount");
        const taker = searchParams.get("taker") || "";

        if (!inputMint || !outputMint || !amount) {
            return NextResponse.json(
                { error: "Missing required params: inputMint, outputMint, amount" },
                { status: 400 }
            );
        }

        const params = new URLSearchParams({
            inputMint,
            outputMint,
            amount,
        });
        if (taker) params.set("taker", taker);

        const headers: Record<string, string> = {
            "Accept": "application/json",
        };
        if (JUPITER_API_KEY) {
            headers["x-api-key"] = JUPITER_API_KEY;
        }

        const response = await fetch(`${JUPITER_ULTRA_API}/order?${params.toString()}`, { headers });
        const data = await response.json();

        if (!response.ok) {
            console.error("Jupiter Ultra order error:", response.status, data);
            return NextResponse.json(
                { error: data.error || data.message || "Failed to fetch quote" },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Jupiter Ultra order error:", error);
        return NextResponse.json(
            { error: "Failed to fetch swap quote" },
            { status: 500 }
        );
    }
}
