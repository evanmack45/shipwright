import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getLinearClient, fetchTeamIssues } from "@/lib/linear";
import { generateUpdate } from "@/lib/generate";
import { updates } from "@/db/schema";
import { randomUUID } from "crypto";

export async function GET() {
  const authHeader =
    process.env.CRON_SECRET &&
    `Bearer ${process.env.CRON_SECRET}`;

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
    const client = await getLinearClient(project.userId);
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
