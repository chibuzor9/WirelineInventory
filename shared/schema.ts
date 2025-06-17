import { pgTable, text, serial, integer, timestamp, primaryKey, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User model
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    full_name: text("full_name").notNull(),
    email: text("email").notNull(),
    role: text("role").default("User").notNull(),
});

export const insertUserSchema = createInsertSchema(users, {
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    full_name: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    role: z.string().default("user"),
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
    lastUpdatedBy: integer("last_updated_by").notNull(),
}, (table: any) => {
    return {
        lastUpdatedByFk: foreignKey({
            columns: [table.lastUpdatedBy],
            foreignColumns: [users.id],
        })
    };
});

export const insertToolSchema = createInsertSchema(tools, {
    toolId: z.string().min(1, "Tool ID is required"),
    name: z.string().min(1, "Name is required"),
    category: z.string().min(1, "Category is required"),
    description: z.string().optional(),
    status: z.string().min(1, "Status is required"),
    location: z.string().optional(),
}).omit({
    id: true,
    lastUpdatedBy: true,
    lastUpdated: true,
});

// Activity model
export const activities = pgTable("activities", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    action: text("action").notNull(),
    toolId: integer("tool_id"),
    timestamp: timestamp("timestamp").notNull(),
    details: text("details"),
    comments: text("comments"),
    previousStatus: text("previous_status"),
}, (table: any) => {
    return {
        userIdFk: foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
        }),
        toolIdFk: foreignKey({
            columns: [table.toolId],
            foreignColumns: [tools.id],
        }),
    };
});

export const insertActivitySchema = createInsertSchema(activities, {
    userId: z.number().int().positive(),
    action: z.string().min(1, "Action is required"),
    toolId: z.number().int().positive().optional(),
    timestamp: z.date(),
    details: z.string().optional(),
    comments: z.string().optional(),
    previousStatus: z.string().optional(),
}).omit({
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
        fields: [activities.userId],
        references: [users.id],
        relationName: "user_activities",
    }),
    tool: one(tools, {
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
    userId: number;
    action: string;
    toolId?: number;
    timestamp: Date;
    details?: string;
    comments?: string;
    previousStatus?: string;
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
