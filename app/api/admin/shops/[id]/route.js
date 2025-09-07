import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Shop from "@/app/models/Shop";

// GET specific shop
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const shop = await Shop.findById(id, { password: 0 });
    if (!shop) {
      return NextResponse.json(
        {
          success: false,
          error: "Shop not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: shop,
    });
  } catch (error) {
    console.error("Error fetching shop:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch shop",
      },
      { status: 500 }
    );
  }
}

// PUT to update shop (including balance top-up)
export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const { name, username, status, balance, topUpAmount } = await req.json();

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (status !== undefined) updateData.status = status;
    if (balance !== undefined) updateData.balance = balance;

    // Handle balance top-up
    if (topUpAmount && topUpAmount > 0) {
      const shop = await Shop.findById(id);
      if (!shop) {
        return NextResponse.json(
          {
            success: false,
            error: "Shop not found",
          },
          { status: 404 }
        );
      }
      updateData.balance = (shop.balance || 0) + topUpAmount;
    }

    const shop = await Shop.findByIdAndUpdate(id, updateData, {
      new: true,
      select: "-password",
    });

    if (!shop) {
      return NextResponse.json(
        {
          success: false,
          error: "Shop not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: shop,
      message: topUpAmount
        ? `Balance topped up successfully. New balance: ETB ${shop.balance.toLocaleString()}`
        : "Shop updated successfully",
    });
  } catch (error) {
    console.error("Error updating shop:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update shop",
      },
      { status: 500 }
    );
  }
}

// DELETE shop
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const shop = await Shop.findByIdAndDelete(id);
    if (!shop) {
      return NextResponse.json(
        {
          success: false,
          error: "Shop not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Shop deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting shop:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete shop",
      },
      { status: 500 }
    );
  }
}
