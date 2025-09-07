import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import GameSession from "@/app/models/GameSession";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build query filter
    const filter = {};
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + "T23:59:59.999Z"),
      };
    }

    // Fetch game sessions with shop information
    const gameSessions = await GameSession.find(filter)
      .populate("shopId", "name username")
      .sort({ createdAt: -1 });

    // Calculate profits by shop
    const shopProfits = {};
    let totalProfit = 0;

    gameSessions.forEach((session) => {
      if (session.shopId) {
        const shopId = session.shopId._id.toString();
        const shopName = session.shopId.name;

        if (!shopProfits[shopId]) {
          shopProfits[shopId] = {
            shopId,
            shopName,
            totalIncome: 0,
            totalProfit: 0,
            gamesPlayed: 0,
          };
        }

        const cardCount = session.cardCount || 0;
        const sessionIncome = session.betAmount * cardCount;
        const sessionProfit = Math.floor(
          sessionIncome * (session.houseCut / 100)
        );

        shopProfits[shopId].totalIncome += sessionIncome;
        shopProfits[shopId].totalProfit += sessionProfit;
        shopProfits[shopId].gamesPlayed += 1;

        totalProfit += sessionProfit;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        shopProfits: Object.values(shopProfits),
        totalProfit,
        totalShops: Object.keys(shopProfits).length,
      },
    });
  } catch (error) {
    console.error("Error fetching shop profits:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch shop profits",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
