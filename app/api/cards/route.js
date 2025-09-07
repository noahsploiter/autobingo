import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Card from "@/app/models/Card";
import GameSession from "@/app/models/GameSession";

export async function POST(req) {
  try {
    await dbConnect();
    const { cards, betAmount, houseCut, gamePattern, shopId } =
      await req.json();

    // Create a new game session
    const gameSession = await GameSession.create({
      betAmount,
      houseCut,
      cardCount: cards.length,
      gamePattern: gamePattern || "singleLine",
      shopId,
      status: "pending",
    });

    // Save cards with B/I/N/G/O columns
    const savedCards = await Promise.all(
      cards.map(async (numbers, index) => {
        // numbers is expected to be an object with B,I,N,G,O arrays (N has 4 entries)
        const card = await Card.create({
          gameSessionId: gameSession._id,
          numbers,
          cardNumber: index + 1,
        });
        return card;
      })
    );

    // Update game session with card references
    await GameSession.findByIdAndUpdate(gameSession._id, {
      cards: savedCards.map((card) => card._id),
    });

    return NextResponse.json({
      success: true,
      gameSessionId: gameSession._id,
      message: `Successfully saved ${savedCards.length} cards`,
    });
  } catch (error) {
    console.error("Error saving cards:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save cards",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const gameSessionId = searchParams.get("gameSessionId");

    let effectiveSessionId = gameSessionId;
    if (!effectiveSessionId) {
      // Default to latest game session
      const latest = await (await import("@/app/models/GameSession")).default
        .findOne()
        .sort({ createdAt: -1 })
        .lean();
      if (latest) {
        effectiveSessionId = String(latest._id);
      }
    }

    const query = effectiveSessionId
      ? { gameSessionId: effectiveSessionId }
      : {};

    const cards = await Card.find(query).sort({ cardNumber: 1 }).lean();

    return NextResponse.json({
      success: true,
      cards: cards,
    });
  } catch (error) {
    console.error("Error fetching cards:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cards" },
      { status: 500 }
    );
  }
}
