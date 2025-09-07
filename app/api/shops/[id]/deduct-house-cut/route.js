import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Shop from "@/app/models/Shop";
import { generateResponse } from "@/app/lib/auth";

// POST /api/shops/[id]/deduct-house-cut - Deduct house cut from shop balance
export async function POST(req) {
  try {
    await connectDB();
    const id = req.url.split("/shops/")[1].split("/deduct-house-cut")[0];
    const { houseCut } = await req.json();

    const shop = await Shop.findById(id);
    if (!shop) {
      return NextResponse.json(generateResponse("error", "Shop not found"), {
        status: 404,
      });
    }

    // Check if shop has sufficient balance
    if (shop.balance < houseCut) {
      return NextResponse.json(
        generateResponse("error", "Insufficient balance for house cut"),
        { status: 400 }
      );
    }

    // Deduct house cut from balance
    shop.balance -= houseCut;
    await shop.save();

    return NextResponse.json(
      generateResponse("success", "House cut deducted successfully", {
        shopId: shop._id,
        newBalance: shop.balance,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("House cut deduction error:", error);
    return NextResponse.json(
      generateResponse("error", "Something went wrong"),
      { status: 500 }
    );
  }
}
