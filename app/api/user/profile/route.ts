import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) return NextResponse.json({ error: "Wallet required" }, { status: 400 });

    try {
        const db = await getDatabase();

        // Get User Info
        const user = await db.collection("users").findOne({ wallet_address: wallet });

        // Get Stats
        const tickets = await db.collection("tickets").find({
            // We need to support searching by wallet or verified discord ID
            // If user is verified, we search by discord_id. If not, maybe just wallet if we stored it?
            // Currently tickets store `user_discord_id`.
            // So checking tickets requires the user to be verified.
            user_discord_id: user?.discord_id
        }).toArray();

        const stats = {
            username: user?.custom_username || null,
            avatar: user?.custom_avatar_url || null,
            discordId: user?.discord_id || null,
            totalTickets: tickets.length,
            totalSpent: tickets.reduce((acc, t) => acc + t.amount_paid, 0),
            tickets: tickets.slice(0, 10) // Last 10 tickets
        };

        return NextResponse.json({ user: stats });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { wallet, username, avatar } = body;

        if (!wallet) return NextResponse.json({ error: "Wallet required" }, { status: 400 });

        const db = await getDatabase();

        // Check availability if username is changing
        if (username) {
            const existing = await db.collection("users").findOne({
                custom_username: username,
                wallet_address: { $ne: wallet }
            });
            if (existing) {
                return NextResponse.json({ error: "Username taken" }, { status: 409 });
            }
        }

        await db.collection("users").updateOne(
            { wallet_address: wallet },
            {
                $set: {
                    custom_username: username,
                    custom_avatar_url: avatar
                }
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
