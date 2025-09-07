import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Shop from "@/app/models/Shop";
import { generateResponse } from "@/app/lib/auth";
import bcrypt from "bcryptjs";
import GameStats from "@/app/models/GameStats";

// Get shop
export async function GET(req, context) {
  try {
    await connectDB();
    const { id } = await context.params;

    const shop = await Shop.findById(id).select("-password");
    if (!shop) {
      return NextResponse.json(generateResponse("error", "Shop not found"), {
        status: 404,
      });
    }

    return NextResponse.json(
      generateResponse("success", "Shop fetched successfully", shop),
      { status: 200 }
    );
  } catch (error) {
    console.error("Shop fetch error:", error);
    return NextResponse.json(
      generateResponse("error", "Something went wrong"),
      { status: 500 }
    );
  }
}

// Update shop
export async function PUT(req, context) {
  try {
    await connectDB();
    const { id } = await context.params;
    const data = await req.json();

    const updateData = { ...data };

    // If password is provided, hash it
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(data.password, salt);
    }

    const shop = await Shop.findByIdAndUpdate(id, updateData, {
      new: true,
      select: "-password",
    });

    if (!shop) {
      return NextResponse.json(generateResponse("error", "Shop not found"), {
        status: 404,
      });
    }

    return NextResponse.json(
      generateResponse("success", "Shop updated successfully", shop),
      { status: 200 }
    );
  } catch (error) {
    console.error("Shop update error:", error);
    return NextResponse.json(
      generateResponse("error", "Something went wrong"),
      { status: 500 }
    );
  }
}

// Delete shop
export async function DELETE(req, context) {
  try {
    await connectDB();
    const { id } = await context.params;

    // Find the shop first
    const shop = await Shop.findById(id);
    if (!shop) {
      return NextResponse.json(generateResponse("error", "Shop not found"), {
        status: 404,
      });
    }

    // Delete related game stats
    await GameStats.deleteMany({ shopId: id });

    // Delete the shop
    await Shop.findByIdAndDelete(id);

    return NextResponse.json(
      generateResponse("success", "Shop deleted successfully"),
      { status: 200 }
    );
  } catch (error) {
    console.error("Shop deletion error:", error);
    return NextResponse.json(
      generateResponse("error", "Something went wrong"),
      { status: 500 }
    );
  }
}
