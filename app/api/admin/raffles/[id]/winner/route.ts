import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { sendRaffleEndedWebhook } from "@/lib/discord";

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;
export const dynamic = "force-dynamic";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Fix for Next.js 15 params
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { wallet } = body;

        // Security Check
        if (!wallet || wallet !== ADMIN_WALLET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = await getDatabase();

        // 1. Get the raffle
        const raffleId = parseInt(id);
        if (isNaN(raffleId)) {
            return NextResponse.json({ error: "Invalid Raffle ID" }, { status: 400 });
        }

        // Robust query: Check for both number and string ID (handles legacy data)
        const raffle = await db.collection("raffles").findOne({ 
            id: { $in: [raffleId, id] } 
        });

        if (!raffle) {
            console.error(`Raffle not found: ${id}`);
            return NextResponse.json({ error: "Raffle not found" }, { status: 404 });
        }

        console.log(`Picking winner for Raffle: ${raffleId} (Found: ${raffle.id})`);

        if (raffle.winner_id || raffle.winner_wallet) {
            console.warn("Winner already picked for:", raffleId);
            return NextResponse.json({ error: "Winner already picked" }, { status: 400 });
        }

        // 2. Get all tickets for this raffle (Robust match)
        const tickets = await db.collection("tickets").find({ 
            raffle_id: { $in: [raffleId, id] } 
        }).toArray();

        console.log(`Found ${tickets.length} tickets for raffle ${raffleId}`);

        if (tickets.length === 0) {
            return NextResponse.json({ error: "No tickets sold" }, { status: 400 });
        }

        // 3. Weighted Random Selection
        // Calculate total tickets (accessing quantity field)
        const totalTickets = tickets.reduce((sum: number, t: any) => sum + t.quantity, 0);

        // Generate random number between 0 and totalTickets
        const randomPoint = Math.random() * totalTickets;

        let currentSum = 0;
        let winningTicket = null;

        for (const ticket of tickets) {
            currentSum += ticket.quantity;
            if (randomPoint <= currentSum) {
                winningTicket = ticket;
                break;
            }
        }

        if (!winningTicket) {
            // Fallback (should theoretically not happen if math is right)
            winningTicket = tickets[tickets.length - 1];
        }

        // 4. Get Winner User Details
        // We might not have full user details in ticket, so fetch from users collection if needed
        // But ticket usually has wallet_address
        const winnerWallet = winningTicket.wallet_address;
        const winnerDiscordId = winningTicket.user_discord_id; // Might be useful

        // Fetch user for name
        const winnerUser = await db.collection("users").findOne({ wallet_address: winnerWallet });
        const winnerName = winnerUser?.custom_username || "Unknown User";

        // 5. Update Raffle
        await db.collection("raffles").updateOne(
            { id: raffleId },
            {
                $set: {
                    winner_id: winnerDiscordId, // Store Discord ID if available
                    winner_wallet: winnerWallet,
                    status: "ended" // Ensure it's ended
                }
            }
        );

        // 6. Send Webhook
        await sendRaffleEndedWebhook(raffle, winnerWallet, winnerName);

        return NextResponse.json({
            success: true,
            winner: {
                wallet: winnerWallet,
                name: winnerName
            }
        });

    } catch (error: any) {
        console.error("Pick winner error:", error, error.stack);
        return NextResponse.json({ error: "Failed to pick winner: " + error.message }, { status: 500 });
    }
}
