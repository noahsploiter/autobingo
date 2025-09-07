import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import GameStats from "@/app/models/GameStats";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// GET /api/stats - Get stats for the current shop
export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    await connectDB();

    const stats = await GameStats.findOne({ shopId: decoded.id });
    if (!stats) {
      // Initialize stats if they don't exist
      const newStats = await GameStats.create({
        shopId: decoded.id,
        totalGames: 0,
        dailyStats: {},
        weeklyStats: {},
      });
      return NextResponse.json(newStats);
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/stats - Update stats
export async function POST(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const data = await request.json();
    await connectDB();

    // Get current stats
    let currentStats = await GameStats.findOne({ shopId: decoded.id });

    // Initialize if not exists
    if (!currentStats) {
      currentStats = await GameStats.create({
        shopId: decoded.id,
        totalGames: 0,
        dailyStats: {},
        weeklyStats: {},
      });
    }

    // Get the keys for daily and weekly stats
    const dateKey = Object.keys(data.dailyStats)[0];
    const weekKey = Object.keys(data.weeklyStats)[0];

    // Calculate profit (total - house cut)
    const dailyProfit =
      data.dailyStats[dateKey].revenue - data.dailyStats[dateKey].houseCut;
    const weeklyProfit =
      data.weeklyStats[weekKey].revenue - data.weeklyStats[weekKey].houseCut;

    // Update stats with new values
    const stats = await GameStats.findOneAndUpdate(
      { shopId: decoded.id },
      {
        $inc: {
          totalGames: 1,
          [`dailyStats.${dateKey}.games`]: 1,
          [`dailyStats.${dateKey}.total`]: data.dailyStats[dateKey].revenue,
          [`dailyStats.${dateKey}.profit`]: dailyProfit,
          [`weeklyStats.${weekKey}.games`]: 1,
          [`weeklyStats.${weekKey}.total`]: data.weeklyStats[weekKey].revenue,
          [`weeklyStats.${weekKey}.profit`]: weeklyProfit,
        },
      },
      { new: true, upsert: true }
    );

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error updating stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
