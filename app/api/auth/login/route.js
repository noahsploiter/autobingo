import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Admin from "@/app/models/Admin";
import Shop from "@/app/models/Shop";
import { generateResponse, signToken } from "@/app/lib/auth";

export async function POST(req) {
  try {
    await connectDB();

    const { username, password, type = "admin" } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        generateResponse("error", "Username and password are required"),
        { status: 400 }
      );
    }

    let user;
    let userType;
    let Model;

    // Determine model and type based on login type
    switch (type) {
      case "shop":
        Model = Shop;
        userType = "shop";
        break;
      case "backoffice":
        return NextResponse.json(
          generateResponse("error", "Backoffice login not implemented yet"),
          { status: 401 }
        );
      default:
        Model = Admin;
        userType = "admin";
    }

    try {
      // Find user and explicitly select password field
      user = await Model.findOne({ username }).select("+password");
    } catch (error) {
      console.error("Database query error:", error);
      return NextResponse.json(
        generateResponse("error", "Database error occurred"),
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        generateResponse("error", "Invalid username or password"),
        { status: 401 }
      );
    }

    try {
      // Check password
      const isPasswordMatch = await user.comparePassword(password);

      if (!isPasswordMatch) {
        return NextResponse.json(
          generateResponse("error", "Invalid username or password"),
          { status: 401 }
        );
      }
    } catch (error) {
      console.error("Password comparison error:", error);
      return NextResponse.json(
        generateResponse("error", "Authentication error occurred"),
        { status: 500 }
      );
    }

    // For shop users, check if they are active
    if (userType === "shop" && user.status === "inactive") {
      return NextResponse.json(
        generateResponse("error", "This shop account has been deactivated"),
        { status: 403 }
      );
    }

    // Generate token with user info
    const token = signToken({
      id: user._id,
      type: userType,
      username: user.username,
    });

    // Remove sensitive data from response
    const userData = {
      id: user._id,
      username: user.username,
      ...(userType === "shop" && { name: user.name, status: user.status }),
    };

    return NextResponse.json(
      generateResponse("success", "Login successful", {
        token,
        type: userType,
        user: userData,
      }),
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      generateResponse("error", "An unexpected error occurred"),
      { status: 500 }
    );
  }
}
