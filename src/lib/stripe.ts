import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const FREE_TIER_LIMIT = 2;

export async function canGenerateUpdate(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return false;
  if (user.subscriptionStatus === "active") return true;

  return (user.updatesGenerated ?? 0) < FREE_TIER_LIMIT;
}

export async function incrementUpdateCount(userId: string): Promise<void> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (user) {
    await db
      .update(users)
      .set({ updatesGenerated: (user.updatesGenerated ?? 0) + 1 })
      .where(eq(users.id, userId));
  }
}

export function getPaymentLink(): string {
  return process.env.STRIPE_PAYMENT_LINK ?? "#";
}
