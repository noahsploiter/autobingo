import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Shop from "@/app/models/Shop";
import { generateResponse } from "@/app/lib/auth";

// Top up shop balance
export async function POST(req) {
  try {
    await connectDB();
    const id = req.url.split("/shops/")[1].split("/balance")[0];
    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(generateResponse("error", "Invalid amount"), {
        status: 400,
      });
    }

    const shop = await Shop.findById(id);
    if (!shop) {
      return NextResponse.json(generateResponse("error", "Shop not found"), {
        status: 404,
      });
    }

    // Update shop balance
    shop.balance += Number(amount);
    await shop.save();

    return NextResponse.json(
      generateResponse("success", "Balance updated successfully", {
        shopId: shop._id,
        newBalance: shop.balance,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Balance update error:", error);
    return NextResponse.json(
      generateResponse("error", "Something went wrong"),
      { status: 500 }
    );
  }
}

// Get shop balance
export async function GET(req) {
  try {
    await connectDB();
    const id = req.url.split("/shops/")[1].split("/balance")[0];

    const shop = await Shop.findById(id).select("balance name");
    if (!shop) {
      return NextResponse.json(generateResponse("error", "Shop not found"), {
        status: 404,
      });
    }

    return NextResponse.json(
      generateResponse("success", "Balance retrieved successfully", {
        shopId: shop._id,
        name: shop.name,
        balance: shop.balance,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Balance retrieval error:", error);
    return NextResponse.json(
      generateResponse("error", "Something went wrong"),
      { status: 500 }
    );
  }
}
