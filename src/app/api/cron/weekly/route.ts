import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, updates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getLinearClientForUser, fetchTeamIssues } from "@/lib/linear";
import { generateUpdate } from "@/lib/generate";
import { randomUUID } from "node:crypto";

export async function GET() {
  const activeProjects = await db.query.projects.findMany({
    where: eq(projects.status, "active"),
  });

  const now = new Date();
  const weekEnd = now.toISOString().split("T")[0];
  const weekStartDate = new Date(now);
  weekStartDate.setDate(weekStartDate.getDate() - 7);
  const weekStart = weekStartDate.toISOString().split("T")[0];

  let generated = 0;

  for (const project of activeProjects) {
    const client = await getLinearClientForUser(project.userId);
    if (!client) continue;

    const issues = await fetchTeamIssues(client, project.linearTeamId);
    const markdown = await generateUpdate(
      project.name,
      weekStart,
      weekEnd,
      issues,
    );

    await db.insert(updates).values({
      id: randomUUID(),
      projectId: project.id,
      weekStart,
      weekEnd,
      draftMarkdown: markdown,
      status: "draft",
    });

    generated++;
  }

  return NextResponse.json({ generated });
}
