import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    const { email, password, firmName } = await req.json();

    if (!email || !password || !firmName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await getDb();

    // Check if user exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    // Create Firm
    const firmResult = await db.collection("firms").insertOne({
      name: firmName,
      createdAt: new Date(),
    });

    const firmId = firmResult.insertedId;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create Admin User
    await db.collection("users").insertOne({
      email,
      passwordHash,
      firmId,
      role: "admin",
      createdAt: new Date(),
    });

    return NextResponse.json({ message: "Registration successful" }, { status: 201 });
  } catch (error) {
    console.error("Registration error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
