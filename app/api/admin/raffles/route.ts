import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { sendRaffleCreatedWebhook } from "@/lib/discord";

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

export const dynamic = "force-dynamic";

// Helper to get next ID
async function getNextSequence(db: any, name: string) {
    const result = await db.collection("counters").findOneAndUpdate(
        { _id: name },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: "after" }
    );
    return result ? result.seq : 1;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            wallet,
            prize_name,
            prize_image_url,
            ticket_price,
            end_time,
            prize_type,
            prize_amount
        } = body;

        // Security Check
        if (!wallet || wallet !== ADMIN_WALLET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!prize_name || !ticket_price || !end_time) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const db = await getDatabase();

        // Get next ID
        const id = await getNextSequence(db, "raffles");

        const newRaffle = {
            id: id,
            prize_name,
            prize_image_url,
            ticket_price: parseFloat(ticket_price),
            total_tickets: 0,
            end_time: new Date(end_time), // Ensure it's stored as Date object
            prize_type: prize_type || "sol",
            prize_amount: parseFloat(prize_amount) || 0,
            status: "active",
            created_at: new Date(),
            winner_id: null
        };

        await db.collection("raffles").insertOne(newRaffle);

        // Send Discord Notification
        await sendRaffleCreatedWebhook(newRaffle);

        return NextResponse.json({ success: true, raffle: newRaffle });

    } catch (error) {
        console.error("Create raffle error:", error);
        return NextResponse.json({ error: "Failed to create raffle" }, { status: 500 });
    }
}
