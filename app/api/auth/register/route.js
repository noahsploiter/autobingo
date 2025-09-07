import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Admin from "@/app/models/Admin";
import { generateResponse, signToken } from "@/app/lib/auth";

export async function POST(req) {
  try {
    await connectDB();

    const { username, password } = await req.json();

    // Check if admin already exists
    const adminExists = await Admin.findOne({ username });
    if (adminExists) {
      return NextResponse.json(
        generateResponse("error", "Admin already exists"),
        { status: 400 }
      );
    }

    // Check if this is the first admin
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return NextResponse.json(
        generateResponse("error", "Admin registration is disabled"),
        { status: 403 }
      );
    }

    // Create admin
    const admin = await Admin.create({
      username,
      password,
    });

    const token = signToken(admin._id);

    return NextResponse.json(
      generateResponse("success", "Admin created successfully", { token }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      generateResponse("error", "Something went wrong"),
      { status: 500 }
    );
  }
}
