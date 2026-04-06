import { LinearClient } from "@linear/sdk";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

interface LinearIssue {
  id: string;
  title: string;
  state: { name: string; type: string };
  assignee?: { name: string } | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  priority: number;
  labels: { nodes: Array<{ name: string }> };
}

export interface CategorizedIssues {
  completed: LinearIssue[];
  inProgress: LinearIssue[];
  blocked: LinearIssue[];
}

export function createLinearClient(apiKey: string): LinearClient {
  return new LinearClient({ apiKey });
}

export async function getLinearClientForUser(
  userId: string,
): Promise<LinearClient | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user?.linearApiKey) return null;

  return createLinearClient(user.linearApiKey);
}

export async function verifyLinearKey(
  apiKey: string,
): Promise<{ valid: boolean; name?: string; email?: string }> {
  try {
    const client = createLinearClient(apiKey);
    const viewer = await client.viewer;
    return { valid: true, name: viewer.name, email: viewer.email };
  } catch {
    return { valid: false };
  }
}

export async function fetchTeamIssues(
  client: LinearClient,
  teamId: string,
  daysBack = 7,
): Promise<CategorizedIssues> {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const issues = await client.issues({
    filter: {
      team: { id: { eq: teamId } },
      updatedAt: { gte: since.toISOString() },
    },
    first: 100,
  });

  const completed: LinearIssue[] = [];
  const inProgress: LinearIssue[] = [];
  const blocked: LinearIssue[] = [];

  for (const issue of issues.nodes) {
    const state = await issue.state;
    const assignee = await issue.assignee;
    const labels = await issue.labels();

    const mapped: LinearIssue = {
      id: issue.id,
      title: issue.title,
      state: {
        name: state?.name ?? "Unknown",
        type: state?.type ?? "unstarted",
      },
      assignee: assignee ? { name: assignee.name } : null,
      completedAt: issue.completedAt?.toISOString() ?? null,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
      priority: issue.priority,
      labels: { nodes: labels.nodes.map((l) => ({ name: l.name })) },
    };

    if (state?.type === "completed" || state?.type === "canceled") {
      completed.push(mapped);
    } else if (state?.name?.toLowerCase().includes("block")) {
      blocked.push(mapped);
    } else if (state?.type === "started") {
      inProgress.push(mapped);
    }
  }

  return { completed, inProgress, blocked };
}

export async function fetchUserTeams(client: LinearClient) {
  const teams = await client.teams();
  return teams.nodes.map((t) => ({
    id: t.id,
    name: t.name,
    key: t.key,
  }));
}
