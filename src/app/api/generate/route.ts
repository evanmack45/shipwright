import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { projects, updates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getLinearClientForUser, fetchTeamIssues } from "@/lib/linear";
import { generateUpdate } from "@/lib/generate";
import { canGenerateUpdate, incrementUpdateCount } from "@/lib/stripe";
import { randomUUID } from "node:crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await request.json();
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId required" },
        { status: 400 },
      );
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project || project.userId !== session.userId) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    const allowed = await canGenerateUpdate(session.userId);
    if (!allowed) {
      return NextResponse.json(
        { error: "Free tier limit reached. Please upgrade to continue." },
        { status: 402 },
      );
    }

    const client = await getLinearClientForUser(session.userId);
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

    await incrementUpdateCount(session.userId);

    return NextResponse.json({ updateId, markdown });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
