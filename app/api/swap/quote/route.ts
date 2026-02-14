import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const JUPITER_API = "https://api.jup.ag/swap/v1";
const PLATFORM_FEE_BPS = 50; // 0.5% fee

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const inputMint = searchParams.get("inputMint");
        const outputMint = searchParams.get("outputMint");
        const amount = searchParams.get("amount");
        const slippageBps = searchParams.get("slippageBps") || "50";

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
            slippageBps,
            platformFeeBps: PLATFORM_FEE_BPS.toString(),
        });

        const response = await fetch(`${JUPITER_API}/quote?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || "Failed to fetch quote" },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Jupiter quote error:", error);
        return NextResponse.json(
            { error: "Failed to fetch swap quote" },
            { status: 500 }
        );
    }
}
