import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const db = await getDatabase();
        const messages = await db.collection("chat_messages")
            .find({})
            .sort({ timestamp: -1 }) // Newest first
            .limit(50)
            .toArray();

        return NextResponse.json({ messages: messages.reverse() }); // Return oldest first for chat flow
    } catch (error) {
        return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { wallet, message } = body;

        if (!wallet || !message) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        const db = await getDatabase();

        // Get sender info for "rich" chat message
        const user = await db.collection("users").findOne({ wallet_address: wallet });

        const chatMsg = {
            wallet_address: wallet,
            username: user?.custom_username || "User " + wallet.slice(0, 4),
            avatar_url: user?.custom_avatar_url,
            message: message.slice(0, 200), // Limit length
            timestamp: new Date()
        };

        await db.collection("chat_messages").insertOne(chatMsg);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Post failed" }, { status: 500 });
    }
}
