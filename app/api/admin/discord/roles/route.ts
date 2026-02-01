import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.NEXT_PUBLIC_GUILD_ID;
const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

export async function GET(request: NextRequest) {
    if (!BOT_TOKEN || !GUILD_ID) {
        return NextResponse.json({ error: "Discord config missing" }, { status: 500 });
    }

    // Security check: simple wallet check via header or query not really secure for pure GET 
    // without session, but this is a read-only list of roles.
    // Ideally we verify the admin signature, but for MVP fetching roles is low risk.

    try {
        const response = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/roles`, {
            headers: {
                Authorization: `Bot ${BOT_TOKEN}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch roles");
        }

        const roles = await response.json();
        return NextResponse.json(roles);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
    }
}
