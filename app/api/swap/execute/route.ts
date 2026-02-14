import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const JUPITER_API = "https://api.jup.ag/swap/v1";
const FEE_ACCOUNT = process.env.NEXT_PUBLIC_TREASURY_ADDRESS;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { quoteResponse, userPublicKey } = body;

        if (!quoteResponse || !userPublicKey) {
            return NextResponse.json(
                { error: "Missing quoteResponse or userPublicKey" },
                { status: 400 }
            );
        }

        const response = await fetch(`${JUPITER_API}/swap`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                quoteResponse,
                userPublicKey,
                feeAccount: FEE_ACCOUNT,
                dynamicComputeUnitLimit: true,
                prioritizationFeeLamports: "auto",
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || "Failed to create swap transaction" },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Jupiter swap error:", error);
        return NextResponse.json(
            { error: "Failed to create swap transaction" },
            { status: 500 }
        );
    }
}
