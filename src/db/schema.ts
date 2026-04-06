import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  linearApiKey: text("linear_api_key"),
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionStatus: text("subscription_status").default("free"),
  updatesGenerated: integer("updates_generated").default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  linearTeamId: text("linear_team_id").notNull(),
  linearTeamName: text("linear_team_name").notNull(),
  name: text("name").notNull(),
  status: text("status").default("active"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const updates = sqliteTable("updates", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  weekStart: text("week_start").notNull(),
  weekEnd: text("week_end").notNull(),
  draftMarkdown: text("draft_markdown").notNull(),
  editedMarkdown: text("edited_markdown"),
  status: text("status").default("draft"),
  generatedAt: integer("generated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  sentAt: integer("sent_at", { mode: "timestamp" }),
});
