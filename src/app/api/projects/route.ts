import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userProjects = await db.query.projects.findMany({
    where: eq(projects.userId, session.userId),
  });

  return NextResponse.json(userProjects);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { linearTeamId, linearTeamName, name } = await request.json();

  const project = {
    id: randomUUID(),
    userId: session.userId,
    linearTeamId,
    linearTeamName,
    name: name || linearTeamName,
    status: "active",
  };

  await db.insert(projects).values(project);

  return NextResponse.json(project, { status: 201 });
}
