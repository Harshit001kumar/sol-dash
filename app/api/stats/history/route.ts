import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

/**
 * GET /api/stats/history
 * Returns historical ticket purchase data aggregated by time period.
 * Used for revenue charts in the admin dashboard.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "monthly"; // daily, weekly, monthly

        const db = await getDatabase();
        const now = new Date();

        let groupFormat: any;
        let dateRange: Date;
        let labels: string[] = [];

        if (period === "daily") {
            // Last 7 days
            dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            groupFormat = {
                year: { $year: "$purchased_at" },
                month: { $month: "$purchased_at" },
                day: { $dayOfMonth: "$purchased_at" }
            };
            // Generate labels
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                labels.push(d.toLocaleDateString("en-US", { weekday: "short" }));
            }
        } else if (period === "weekly") {
            // Last 4 weeks
            dateRange = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
            groupFormat = {
                year: { $year: "$purchased_at" },
                week: { $isoWeek: "$purchased_at" }
            };
            labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
        } else {
            // Monthly - Last 12 months
            dateRange = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            groupFormat = {
                year: { $year: "$purchased_at" },
                month: { $month: "$purchased_at" }
            };
            labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        }

        // Aggregate ticket sales
        const pipeline = [
            {
                $match: {
                    purchased_at: { $gte: dateRange }
                }
            },
            {
                $group: {
                    _id: groupFormat,
                    totalRevenue: { $sum: "$amount_paid" },
                    totalTickets: { $sum: "$quantity" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 }
            }
        ];

        const results = await db.collection("tickets").aggregate(pipeline).toArray();

        // Transform results into chart-friendly format
        let values: number[] = [];
        
        if (period === "monthly") {
            // Initialize all 12 months with 0
            values = new Array(12).fill(0);
            for (const r of results) {
                if (r._id && r._id.month) {
                    values[r._id.month - 1] = r.totalRevenue || 0;
                }
            }
        } else if (period === "daily") {
            // Last 7 days
            values = new Array(7).fill(0);
            for (const r of results) {
                // Find which day index this belongs to
                const resultDate = new Date(r._id.year, r._id.month - 1, r._id.day);
                const dayDiff = Math.floor((now.getTime() - resultDate.getTime()) / (24 * 60 * 60 * 1000));
                if (dayDiff >= 0 && dayDiff < 7) {
                    values[6 - dayDiff] = r.totalRevenue || 0;
                }
            }
        } else {
            // Weekly
            values = new Array(4).fill(0);
            for (let i = 0; i < results.length && i < 4; i++) {
                values[i] = results[i]?.totalRevenue || 0;
            }
        }

        // Calculate summary stats
        const totalRevenue = values.reduce((a, b) => a + b, 0);
        const avgRevenue = values.length > 0 ? totalRevenue / values.length : 0;

        return NextResponse.json({
            labels,
            values,
            summary: {
                total: totalRevenue,
                average: avgRevenue,
                period
            }
        });

    } catch (error) {
        console.error("Stats history error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
