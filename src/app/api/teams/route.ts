import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getLinearClientForUser, fetchUserTeams } from "@/lib/linear";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await getLinearClientForUser(session.userId);
  if (!client) {
    return NextResponse.json(
      { error: "Linear not connected" },
      { status: 400 },
    );
  }

  const teams = await fetchUserTeams(client);
  return NextResponse.json(teams);
}
