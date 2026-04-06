import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });

  if (!user) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    name: user.name,
    email: user.email,
    subscriptionStatus: user.subscriptionStatus,
    updatesGenerated: user.updatesGenerated,
  });
}
