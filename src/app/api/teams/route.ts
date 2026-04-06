import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLinearClient, fetchUserTeams } from "@/lib/linear";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await getLinearClient(session.user.id);
  if (!client) {
    return NextResponse.json(
      { error: "Linear not connected" },
      { status: 400 },
    );
  }

  const teams = await fetchUserTeams(client);
  return NextResponse.json(teams);
}
