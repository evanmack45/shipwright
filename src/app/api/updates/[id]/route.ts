import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { updates, projects } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const update = await db.query.updates.findFirst({
    where: eq(updates.id, id),
  });

  if (!update) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, update.projectId),
  });

  if (!project || project.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ...update, projectName: project.name });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const update = await db.query.updates.findFirst({
    where: eq(updates.id, id),
  });

  if (!update) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const values: Record<string, unknown> = {};
  if (body.editedMarkdown !== undefined)
    values.editedMarkdown = body.editedMarkdown;
  if (body.status === "sent") {
    values.status = "sent";
    values.sentAt = new Date();
  }

  await db.update(updates).set(values).where(eq(updates.id, id));

  return NextResponse.json({ updated: true });
}
