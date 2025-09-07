import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import GameSession from "@/app/models/GameSession";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");

    // Build query filter
    const filter = {};
    if (shopId) {
      filter.shopId = shopId;
    }

    // Count total game sessions
    const gameCount = await GameSession.countDocuments(filter);

    return NextResponse.json({
      success: true,
      gameCount,
    });
  } catch (error) {
    console.error("Error fetching game count:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch game count",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
