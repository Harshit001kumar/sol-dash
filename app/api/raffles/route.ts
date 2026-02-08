import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const db = await getDatabase();
        const { searchParams } = new URL(request.url);
        const filter = searchParams.get("filter");

        // Handle winners filter
        if (filter === "winners") {
            const winners = await db
                .collection("raffles")
                .find({ winner_wallet: { $ne: null } })
                .sort({ end_time: -1 })
                .limit(20)
                .toArray();
            return NextResponse.json({ raffles: winners });
        }

        const now = new Date();

        // 1. Lazy Expiration Check: Find active raffles that have expired
        const expiredRaffles = await db.collection("raffles").find({
            status: "active",
            end_time: { $lte: now }
        }).toArray();

        // 2. Mark them as ended
        if (expiredRaffles.length > 0) {
            await db.collection("raffles").updateMany(
                { _id: { $in: expiredRaffles.map((r: any) => r._id) } },
                { $set: { status: "ended" } }
            );
        }

        // 3. Fetch ONLY active raffles (now that expirations are handled)
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

