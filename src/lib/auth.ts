import { cookies } from "next/headers";
import { db, ensureSchema } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createHmac, randomUUID } from "node:crypto";

const SECRET = process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me";

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

function verifyToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [userId, sig] = parts;
  if (sign(userId) === sig) return userId;
  return null;
}

function createToken(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

export async function getSession(): Promise<{ userId: string } | null> {
  await ensureSchema();
  const cookieStore = await cookies();
  const token = cookieStore.get("sw_session")?.value;
  if (!token) return null;

  const userId = verifyToken(token);
  if (!userId) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) return null;

  return { userId: user.id };
}

export async function createSession(userId: string): Promise<string> {
  return createToken(userId);
}

export async function getOrCreateUser(
  email: string,
  name?: string,
): Promise<string> {
  await ensureSchema();
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) return existing.id;

  const id = randomUUID();
  await db.insert(users).values({ id, email, name: name ?? null });
  return id;
}

export async function storeLinearKey(
  userId: string,
  key: string,
): Promise<void> {
  await db
    .update(users)
    .set({ linearApiKey: key })
    .where(eq(users.id, userId));
}
