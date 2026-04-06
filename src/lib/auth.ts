import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { db } from "@/db";
import { users, accounts, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export const authConfig: NextAuthConfig = {
  providers: [
    {
      id: "linear",
      name: "Linear",
      type: "oauth",
      authorization: {
        url: "https://linear.app/oauth/authorize",
        params: { scope: "read", response_type: "code" },
      },
      token: "https://api.linear.app/oauth/token",
      clientId: process.env.LINEAR_CLIENT_ID,
      clientSecret: process.env.LINEAR_CLIENT_SECRET,
      userinfo: {
        url: "https://api.linear.app/graphql",
        async request({ tokens }: { tokens: { access_token?: string } }) {
          const response = await fetch("https://api.linear.app/graphql", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokens.access_token}`,
            },
            body: JSON.stringify({
              query: "{ viewer { id name email avatarUrl } }",
            }),
          });
          return response.json();
        },
      },
      async profile(profile: Record<string, unknown>) {
        const data = profile as { data?: { viewer?: { id?: string; name?: string; email?: string; avatarUrl?: string } } };
        const viewer = data.data?.viewer;
        return {
          id: viewer?.id ?? randomUUID(),
          name: viewer?.name ?? "Linear User",
          email: viewer?.email ?? "",
          image: viewer?.avatarUrl ?? null,
        };
      },
    },
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email || !account) return false;

      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, user.email),
      });

      const userId = existingUser?.id ?? randomUUID();

      if (!existingUser) {
        await db.insert(users).values({
          id: userId,
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
        });
      }

      const existingAccount = await db.query.accounts.findFirst({
        where: eq(accounts.providerAccountId, account.providerAccountId),
      });

      if (!existingAccount) {
        await db.insert(accounts).values({
          id: randomUUID(),
          userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          accessToken: account.access_token ?? null,
          refreshToken: account.refresh_token ?? null,
          expiresAt: account.expires_at ?? null,
          tokenType: account.token_type ?? null,
          scope: account.scope ?? null,
        });
      } else {
        await db
          .update(accounts)
          .set({
            accessToken: account.access_token ?? null,
            refreshToken: account.refresh_token ?? null,
            expiresAt: account.expires_at ?? null,
          })
          .where(eq(accounts.id, existingAccount.id));
      }

      return true;
    },
    async session({ session, token }) {
      if (token.sub) {
        const user = await db.query.users.findFirst({
          where: eq(users.email, session.user.email),
        });
        if (user) {
          session.user.id = user.id;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
