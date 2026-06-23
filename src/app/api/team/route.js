import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const members = await db.collection("users")
    .find({ firmId: session.user.firmId })
    .project({ passwordHash: 0 })
    .toArray();

  return NextResponse.json({ members });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Only admins can add team members" }, { status: 403 });
  }

  const { email, password, role } = await req.json();

  if (!email || !password || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!['admin', 'viewer'].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const db = await getDb();

  const existing = await db.collection("users").findOne({ email });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.collection("users").insertOne({
    email,
    passwordHash,
    firmId: session.user.firmId,
    role,
    createdAt: new Date()
  });

  return NextResponse.json({ message: `User ${email} added as ${role}` }, { status: 201 });
}
