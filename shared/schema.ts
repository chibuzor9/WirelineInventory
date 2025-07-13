import { pgTable, text, serial, integer, timestamp, primaryKey, foreignKey, bigint, varchar, smallint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User model
export const users = pgTable("users", {
    id: bigint("id", { mode: "bigint" }).primaryKey(),
    username: varchar("username").notNull().unique(),
    password: text("password").notNull(),
    full_name: text("full_name").notNull(),
    email: varchar("email").notNull(),
    role: varchar("role").default("user").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    status: smallint("status").default(1),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
    deletion_scheduled_at: timestamp("deletion_scheduled_at", { withTimezone: true }),
});

export const insertUserSchema = createInsertSchema(users).omit({
    id: true,
    created_at: true,
    deleted_at: true,
    deletion_scheduled_at: true,
});

// Tool model
export const tools = pgTable("tools", {
    id: serial("id").primaryKey(),
    toolId: text("tool_id").notNull().unique(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    description: text("description"),
    status: text("status").notNull(), // 'red', 'yellow', 'green'
    location: text("location"),
    lastUpdated: timestamp("last_updated").notNull(),
    lastUpdatedBy: bigint("last_updated_by", { mode: "bigint" }).notNull(),
}, (table: any) => {
    return {
        lastUpdatedByFk: foreignKey({
            columns: [table.lastUpdatedBy],
            foreignColumns: [users.id],
        })
    };
});

export const insertToolSchema = createInsertSchema(tools).omit({
    id: true,
    lastUpdatedBy: true,
    lastUpdated: true,
});

// Activity model
export const activities = pgTable("activities", {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").notNull(),
    action: varchar("action", { length: 255 }).notNull(),
    toolId: integer("toolId"),
    timestamp: timestamp("timestamp").defaultNow(),
    details: text("details"),
    comments: text("comments"),
    previous_status: text("previous_status"),
}, (table: any) => {
    return {
        userIdFk: foreignKey({
            columns: [table.user_id],
            foreignColumns: [users.id],
        }),
        toolIdFk: foreignKey({
            columns: [table.toolId],
            foreignColumns: [tools.id],
        }),
    };
});

export const insertActivitySchema = createInsertSchema(activities).omit({
    id: true,
});

// Relations
export const usersRelations = relations(users, ({ many }: any) => ({
    tools: many(tools, { relationName: "user_tools" }),
    activities: many(activities, { relationName: "user_activities" }),
}));

export const toolsRelations = relations(tools, ({ one, many }: any) => ({
    updatedBy: one(users, {
        fields: [tools.lastUpdatedBy],
        references: [users.id],
        relationName: "user_tools",
    }),
    activities: many(activities, { relationName: "tool_activities" }),
}));

export const activitiesRelations = relations(activities, ({ one }: any) => ({
    user: one(users, {
        fields: [activities.user_id],
        references: [users.id],
        relationName: "user_activities",
    }), tool: one(tools, {
        fields: [activities.toolId],
        references: [tools.id],
        relationName: "tool_activities",
    }),
}));

// Types
export type InsertUser = {
    username: string;
    password: string;
    full_name: string;
    email: string;
    role?: string;
};
export type User = typeof users.$inferSelect;

export type InsertTool = {
    toolId: string;
    name: string;
    category: string;
    description?: string;
    status: string;
    location?: string;
};
export type Tool = typeof tools.$inferSelect;

export type InsertActivity = {
    user_id: number;
    action: string;
    tool_id?: number;
    timestamp: Date;
    details?: string;
    comments?: string;
    previous_status?: string;
};
export type Activity = typeof activities.$inferSelect;

// Extended schemas for validation
export const toolTagSchema = z.enum(["red", "yellow", "green", "white"]);
export type ToolTag = z.infer<typeof toolTagSchema>;

export const toolCategorySchema = z.enum([
    "Pressure Equipment",
    "Perforating Equipment",
    "Logging Equipment",
    "Wireline Equipment",
    "Completion Equipment",
    "Other"
]);
export type ToolCategory = z.infer<typeof toolCategorySchema>;

// Report types
export const reportTypeSchema = z.enum([
    "tag-status",
    "maintenance",
    "inventory",
    "activity"
]);
export type ReportType = z.infer<typeof reportTypeSchema>;
