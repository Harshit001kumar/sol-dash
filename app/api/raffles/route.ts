import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const db = await getDatabase();

        // Get active raffles
        const raffles = await db
            .collection("raffles")
            .find({ status: "active" })
            .sort({ end_time: 1 })
            .toArray();

        // Get total stats
        const totalUsers = await db.collection("users").countDocuments();
        const totalRaffles = await db.collection("raffles").countDocuments();
        const completedRaffles = await db
            .collection("raffles")
            .countDocuments({ status: "ended" });

        // Get ticket revenue
        const ticketStats = await db
            .collection("tickets")
            .aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$amount_paid" },
                        totalTickets: { $sum: "$quantity" },
                    },
                },
            ])
            .toArray();

        const stats = {
            totalUsers,
            totalRaffles,
            completedRaffles,
            activeRaffles: raffles.length,
            totalRevenue: ticketStats[0]?.totalRevenue || 0,
            totalTickets: ticketStats[0]?.totalTickets || 0,
        };

        return NextResponse.json({ raffles, stats });
    } catch (error) {
        console.error("Database error:", error);
        return NextResponse.json(
            { error: "Failed to fetch data" },
            { status: 500 }
        );
    }
}
