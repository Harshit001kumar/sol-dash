import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const JUPITER_ULTRA_API = "https://api.jup.ag/ultra/v1";
const JUPITER_API_KEY = process.env.JUPITER_API_KEY || "";

// POST /api/swap/execute — submit signed transaction via Ultra API
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { signedTransaction, requestId } = body;

        if (!signedTransaction || !requestId) {
            return NextResponse.json(
                { error: "Missing signedTransaction or requestId" },
                { status: 400 }
            );
        }

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (JUPITER_API_KEY) {
            headers["x-api-key"] = JUPITER_API_KEY;
        }

        const response = await fetch(`${JUPITER_ULTRA_API}/execute`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                signedTransaction,
                requestId,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Jupiter Ultra execute error:", response.status, data);
            return NextResponse.json(
                { error: data.error || data.message || "Failed to execute swap" },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Jupiter Ultra execute error:", error);
        return NextResponse.json(
            { error: "Failed to execute swap" },
            { status: 500 }
        );
    }
}
