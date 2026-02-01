import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) return NextResponse.json({ error: "Wallet required" }, { status: 400 });

    try {
        const db = await getDatabase();

        // First get the user ID for this wallet
        const user = await db.collection("users").findOne({ wallet_address: wallet });

        if (!user) return NextResponse.json({ pending: [] });

        // Find pending airdrops for this user_id
        // The bot stores them in `pending_airdrops` with `user_id` (Discord ID)
        const pending = await db.collection("pending_airdrops").find({
            user_id: user.discord_id,
            claimed: false
        }).toArray();

        return NextResponse.json({ pending });

    } catch (error) {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
