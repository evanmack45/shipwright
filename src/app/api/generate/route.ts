import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { projects, updates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getLinearClient, fetchTeamIssues } from "@/lib/linear";
import { generateUpdate } from "@/lib/generate";
import { canGenerateUpdate, incrementUpdateCount } from "@/lib/stripe";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await request.json();
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const allowed = await canGenerateUpdate(session.user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Free tier limit reached. Please upgrade to continue." },
      { status: 402 },
    );
  }

  const client = await getLinearClient(session.user.id);
  if (!client) {
    return NextResponse.json(
      { error: "Linear not connected" },
      { status: 400 },
    );
  }

  const now = new Date();
  const weekEnd = now.toISOString().split("T")[0];
  const weekStartDate = new Date(now);
  weekStartDate.setDate(weekStartDate.getDate() - 7);
  const weekStart = weekStartDate.toISOString().split("T")[0];

  const issues = await fetchTeamIssues(client, project.linearTeamId);
  const markdown = await generateUpdate(
    project.name,
    weekStart,
    weekEnd,
    issues,
  );

  const updateId = randomUUID();
  await db.insert(updates).values({
    id: updateId,
    projectId: project.id,
    weekStart,
    weekEnd,
    draftMarkdown: markdown,
    status: "draft",
  });

  await incrementUpdateCount(session.user.id);

  return NextResponse.json({ updateId, markdown });
}
