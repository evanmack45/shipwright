import { NextRequest, NextResponse } from "next/server";
import { verifyLinearKey } from "@/lib/linear";
import { createSession, getOrCreateUser, storeLinearKey } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { apiKey } = await request.json();

  if (!apiKey || typeof apiKey !== "string") {
    return NextResponse.json(
      { error: "Linear API key is required" },
      { status: 400 },
    );
  }

  const verification = await verifyLinearKey(apiKey.trim());
  if (!verification.valid) {
    return NextResponse.json(
      { error: "Invalid Linear API key. Check your key and try again." },
      { status: 400 },
    );
  }

  const userId = await getOrCreateUser(
    verification.email ?? `user-${Date.now()}@shipwright.local`,
    verification.name,
  );

  // Store the user-provided key for API access
  await storeLinearKey(userId, apiKey.trim());

  const token = await createSession(userId);

  const response = NextResponse.json({
    success: true,
    name: verification.name,
  });

  response.cookies.set("sw_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
