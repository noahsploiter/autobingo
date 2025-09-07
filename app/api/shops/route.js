import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Shop from "@/app/models/Shop";
import { generateResponse } from "@/app/lib/auth";

// Create shop
export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();

    // Set default balance of 300 ETB
    const shopData = {
      ...data,
      balance: 300,
    };

    const shop = await Shop.create(shopData);

    // Select specific fields for response
    const shopResponse = await Shop.findById(shop._id).select(
      "_id name username status balance createdAt"
    );

    return NextResponse.json(
      generateResponse("success", "Shop created successfully", shopResponse),
      { status: 201 }
    );
  } catch (error) {
    console.error("Shop creation error:", error);
    return NextResponse.json(
      generateResponse(
        "error",
        error.code === 11000
          ? "Shop name or username already exists"
          : "Something went wrong"
      ),
      { status: error.code === 11000 ? 400 : 500 }
    );
  }
}

// Get all shops
export async function GET() {
  try {
    await connectDB();
    const shops = await Shop.find({})
      .select("name username status balance createdAt")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      generateResponse("success", "Shops retrieved successfully", shops),
      { status: 200 }
    );
  } catch (error) {
    console.error("Shop retrieval error:", error);
    return NextResponse.json(
      generateResponse("error", "Something went wrong"),
      { status: 500 }
    );
  }
}
