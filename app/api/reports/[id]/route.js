import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import GameSession from "@/app/models/GameSession";

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const { status, winnerCardId, winningPattern, completedAt } =
      await req.json();

    const updateData = {
      status,
      completedAt: completedAt ? new Date(completedAt) : new Date(),
    };

    if (winnerCardId) {
      updateData.winnerCardId = winnerCardId;
    }

    if (winningPattern) {
      updateData.winningPattern = winningPattern;
    }

    const gameSession = await GameSession.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!gameSession) {
      return NextResponse.json(
        { success: false, error: "Game session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Game session updated successfully",
      gameSession,
    });
  } catch (error) {
    console.error("Error updating game session:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update game session",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const gameSession = await GameSession.findById(id).populate({
      path: "cards",
      model: "BingoCard",
    });

    if (!gameSession) {
      return NextResponse.json(
        { success: false, error: "Game session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      gameSession,
    });
  } catch (error) {
    console.error("Error fetching game session:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch game session",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
