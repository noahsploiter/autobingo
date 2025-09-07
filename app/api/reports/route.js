import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import GameSession from "@/app/models/GameSession";
import Card from "@/app/models/Card";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const shopId = searchParams.get("shopId");

    // Build query filter
    const filter = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + "T23:59:59.999Z"), // Include full end date
      };
    }

    if (shopId) {
      filter.shopId = shopId;
    }

    // Fetch game sessions with populated cards
    const gameSessions = await GameSession.find(filter)
      .populate({
        path: "cards",
        model: "BingoCard",
      })
      .sort({ createdAt: -1 });

    // Calculate daily reports
    const dailyReports = {};

    gameSessions.forEach((session) => {
      const date = session.createdAt.toISOString().split("T")[0]; // YYYY-MM-DD format

      if (!dailyReports[date]) {
        dailyReports[date] = {
          date,
          totalIncome: 0,
          totalProfit: 0,
          gamesPlayed: 0,
          totalCards: 0,
          houseCut: session.houseCut || 0,
          completedGames: 0,
          winningGames: 0,
        };
      }

      const cardCount =
        session.cardCount || (session.cards ? session.cards.length : 0);
      const sessionIncome = session.betAmount * cardCount;
      const sessionProfit = Math.floor(
        sessionIncome * (session.houseCut / 100)
      );

      dailyReports[date].totalIncome += sessionIncome;
      dailyReports[date].totalProfit += sessionProfit;
      dailyReports[date].gamesPlayed += 1;
      dailyReports[date].totalCards += cardCount;

      if (session.status === "completed") {
        dailyReports[date].completedGames += 1;
        if (session.winnerCardId) {
          dailyReports[date].winningGames += 1;
        }
      }
    });

    // Convert to array and sort by date
    const reportsArray = Object.values(dailyReports).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    // Calculate summary statistics
    const summary = {
      totalIncome: reportsArray.reduce((sum, day) => sum + day.totalIncome, 0),
      totalProfit: reportsArray.reduce((sum, day) => sum + day.totalProfit, 0),
      totalGames: reportsArray.reduce((sum, day) => sum + day.gamesPlayed, 0),
      totalCards: reportsArray.reduce((sum, day) => sum + day.totalCards, 0),
      completedGames: reportsArray.reduce(
        (sum, day) => sum + day.completedGames,
        0
      ),
      winningGames: reportsArray.reduce(
        (sum, day) => sum + day.winningGames,
        0
      ),
      averageDailyIncome:
        reportsArray.length > 0
          ? Math.round(
              reportsArray.reduce((sum, day) => sum + day.totalIncome, 0) /
                reportsArray.length
            )
          : 0,
      averageDailyProfit:
        reportsArray.length > 0
          ? Math.round(
              reportsArray.reduce((sum, day) => sum + day.totalProfit, 0) /
                reportsArray.length
            )
          : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        dailyReports: reportsArray,
        summary,
        totalDays: reportsArray.length,
      },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch reports",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// POST endpoint to create a game session (called when starting a game)
export async function POST(req) {
  try {
    await dbConnect();
    const { betAmount, houseCut, cardCount, gamePattern, shopId } =
      await req.json();

    // Import Shop model
    const Shop = (await import("@/app/models/Shop")).default;

    // Check shop balance and deduct the bet amount
    const totalBetAmount = betAmount * cardCount;
    const shop = await Shop.findById(shopId);

    if (!shop) {
      return NextResponse.json(
        {
          success: false,
          error: "Shop not found",
        },
        { status: 404 }
      );
    }

    if (shop.balance < totalBetAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient balance. Required: ETB ${totalBetAmount.toLocaleString()}, Available: ETB ${shop.balance.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    // Deduct balance from shop
    await Shop.findByIdAndUpdate(shopId, {
      $inc: { balance: -totalBetAmount },
    });

    // Create game session
    const gameSession = await GameSession.create({
      betAmount,
      houseCut,
      cardCount,
      gamePattern,
      shopId,
      status: "active",
    });

    return NextResponse.json({
      success: true,
      gameSessionId: gameSession._id,
      message: "Game session created successfully",
      newBalance: shop.balance - totalBetAmount,
    });
  } catch (error) {
    console.error("Error creating game session:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create game session",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
