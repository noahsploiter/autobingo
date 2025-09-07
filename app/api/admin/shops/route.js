import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Shop from "@/app/models/Shop";

// GET all shops for admin
export async function GET(req) {
  try {
    await dbConnect();

    const shops = await Shop.find({}, { password: 0 }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: shops,
    });
  } catch (error) {
    console.error("Error fetching shops:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch shops",
      },
      { status: 500 }
    );
  }
}

// POST to create a new shop
export async function POST(req) {
  try {
    await dbConnect();
    const { name, username, password, initialBalance = 300 } = await req.json();

    // Check if shop already exists
    const existingShop = await Shop.findOne({
      $or: [{ name }, { username }],
    });

    if (existingShop) {
      return NextResponse.json(
        {
          success: false,
          error: "Shop with this name or username already exists",
        },
        { status: 400 }
      );
    }

    // Create new shop
    const shop = await Shop.create({
      name,
      username,
      password,
      balance: initialBalance,
    });

    // Return shop without password
    const { password: _, ...shopData } = shop.toObject();

    return NextResponse.json({
      success: true,
      data: shopData,
      message: "Shop created successfully",
    });
  } catch (error) {
    console.error("Error creating shop:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create shop",
      },
      { status: 500 }
    );
  }
}
