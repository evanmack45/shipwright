import Anthropic from "@anthropic-ai/sdk";
import type { CategorizedIssues } from "./linear";

let _anthropic: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic();
  }
  return _anthropic;
}

export async function generateUpdate(
  teamName: string,
  weekStart: string,
  weekEnd: string,
  issues: CategorizedIssues,
): Promise<string> {
  const prompt = buildPrompt(teamName, weekStart, weekEnd, issues);

  const message = await getAnthropic().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type === "text") {
    return block.text;
  }

  throw new Error("Unexpected response format from Claude API");
}

function buildPrompt(
  teamName: string,
  weekStart: string,
  weekEnd: string,
  issues: CategorizedIssues,
): string {
  const completedList = issues.completed
    .map((i) => `- ${i.title}${i.assignee ? ` (${i.assignee.name})` : ""}`)
    .join("\n");

  const inProgressList = issues.inProgress
    .map((i) => `- ${i.title}${i.assignee ? ` (${i.assignee.name})` : ""}`)
    .join("\n");

  const blockedList = issues.blocked
    .map((i) => `- ${i.title}${i.assignee ? ` (${i.assignee.name})` : ""}`)
    .join("\n");

  return `You are a professional technical writer creating a weekly stakeholder update.

Write a clear, concise weekly status update for the "${teamName}" team for the week of ${weekStart} to ${weekEnd}.

## Completed Issues
${completedList || "No issues completed this week."}

## In Progress
${inProgressList || "No issues currently in progress."}

## Blocked
${blockedList || "No blockers this week."}

Format the update as clean markdown suitable for email or Slack. Include:
1. A brief summary paragraph (2-3 sentences)
2. "What Shipped" section with completed items
3. "In Progress" section with current work
4. "Blockers" section (only if there are blockers)
5. A brief outlook for next week

Keep it professional but readable. Stakeholders are non-technical executives.`;
}
