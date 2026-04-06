import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProjects = await db.query.projects.findMany({
      where: eq(projects.userId, session.userId),
    });

    return NextResponse.json(userProjects);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
