
import { NextRequest, NextResponse } from "next/server";
import { sendAirdropWebhook } from "@/lib/discord";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { amount, tokenType, recipientCount, signature } = body;

        if (!amount || !recipientCount || !signature) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        await sendAirdropWebhook(amount, tokenType || "SOL", recipientCount, signature);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json({ error: "Failed to send webhook" }, { status: 500 });
    }
}
