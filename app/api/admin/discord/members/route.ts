import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.NEXT_PUBLIC_GUILD_ID;

export async function POST(request: NextRequest) {
    try {
        const { roleId } = await request.json();

        if (!roleId || !BOT_TOKEN || !GUILD_ID) {
            return NextResponse.json({ error: "Missing config or roleId" }, { status: 400 });
        }

        // 1. Fetch all members of the guild (This requires Privileged Intents on the bot!)
        // Pagination is required for large servers (limit 1000).
        // For MVP, we'll try fetching first 1000.
        const response = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000`, {
            headers: {
                Authorization: `Bot ${BOT_TOKEN}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch members");
        }

        const members = await response.json();

        // 2. Filter by Role
        const roleMembers = members.filter((m: any) => m.roles.includes(roleId));
        const discordIds = roleMembers.map((m: any) => m.user.id); // String IDs

        // 3. Match with Database Wallets
        const db = await getDatabase();
        // converting string discordIds to numbers because our DB uses Int64 for discord_id
        const discordIdsInt = discordIds.map((id: string) => parseInt(id)).filter((id: number) => !isNaN(id));

        const users = await db.collection("users").find({
            discord_id: { $in: discordIdsInt }
        }).toArray();

        return NextResponse.json({
            count: users.length,
            users: users.map(u => ({
                discordId: u.discord_id,
                wallet: u.wallet_address,
                username: u.custom_username || "User"
            }))
        });

    } catch (error) {
        console.error("Fetch members error:", error);
        return NextResponse.json({ error: "Failed to fetch eligible users" }, { status: 500 });
    }
}
