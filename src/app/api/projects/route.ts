import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getLinearClient, fetchUserTeams } from "@/lib/linear";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userProjects = await db.query.projects.findMany({
    where: eq(projects.userId, session.user.id),
  });

  return NextResponse.json(userProjects);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { linearTeamId, linearTeamName, name } = await request.json();

  const project = {
    id: randomUUID(),
    userId: session.user.id,
    linearTeamId,
    linearTeamName,
    name: name || linearTeamName,
    status: "active",
  };

  await db.insert(projects).values(project);

  return NextResponse.json(project, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await request.json();

  await db.delete(projects).where(eq(projects.id, projectId));

  return NextResponse.json({ deleted: true });
}
