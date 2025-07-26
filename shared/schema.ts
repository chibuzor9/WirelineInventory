import { pgTable, text, serial, integer, timestamp, primaryKey, foreignKey, bigint, varchar, smallint, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User model
export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 255 }).notNull().unique(),
    password: text("password").notNull(),
    full_name: text("full_name").notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    email_verified: timestamp("email_verified", { withTimezone: true }),
    role: varchar("role", { length: 50 }).default("user").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    status: smallint("status").default(1),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
    deletion_scheduled_at: timestamp("deletion_scheduled_at", { withTimezone: true }),
});

// OTP table for email verification
export const otpCodes = pgTable("otp_codes", {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    code: varchar("code", { length: 6 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(), // 'email_verification', 'password_reset'
    expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
    used_at: timestamp("used_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table: any) => {
    return {
        userIdFk: foreignKey({
            columns: [table.user_id],
            foreignColumns: [users.id],
        })
    };
});

export const insertUserSchema = createInsertSchema(users).omit({
    id: true,
    created_at: true,
    deleted_at: true,
    deletion_scheduled_at: true,
    email_verified: true,
});

export const insertOtpCodeSchema = createInsertSchema(otpCodes).omit({
    id: true,
    created_at: true,
    used_at: true,
});

// Tool model
export const tools = pgTable("tools", {
    id: uuid("id").primaryKey().defaultRandom(),
    tool_id: text("tool_id").notNull().unique(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    description: text("description"),
    status: text("status").notNull(), // 'red', 'yellow', 'green', 'white'
    location: text("location"),
    last_updated: timestamp("last_updated").notNull().defaultNow(),
    last_updated_by: uuid("last_updated_by").notNull(),
}, (table: any) => {
    return {
        lastUpdatedByFk: foreignKey({
            columns: [table.last_updated_by],
            foreignColumns: [users.id],
        })
    };
});

export const insertToolSchema = createInsertSchema(tools).omit({
    id: true,
    last_updated_by: true,
    last_updated: true,
});

// Activity model
export const activities = pgTable("activities", {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").notNull(),
    action: varchar("action", { length: 255 }).notNull(),
    toolId: uuid("toolId"),
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
    otpCodes: many(otpCodes, { relationName: "user_otp_codes" }),
}));

export const otpCodesRelations = relations(otpCodes, ({ one }: any) => ({
    user: one(users, {
        fields: [otpCodes.user_id],
        references: [users.id],
        relationName: "user_otp_codes",
    }),
}));

export const toolsRelations = relations(tools, ({ one, many }: any) => ({
    updatedBy: one(users, {
        fields: [tools.last_updated_by],
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

export type InsertOtpCode = {
    user_id: string;
    email: string;
    code: string;
    type: string;
    expires_at: Date;
};
export type OtpCode = typeof otpCodes.$inferSelect;

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
    user_id: string;
    action: string;
    toolId?: string;
    timestamp?: Date;
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

// OTP types
export const otpTypeSchema = z.enum(["email_verification", "password_reset"]);
export type OtpType = z.infer<typeof otpTypeSchema>;

// Report types
export const reportTypeSchema = z.enum([
    "tag-status",
    "maintenance",
    "inventory",
    "activity"
]);
export type ReportType = z.infer<typeof reportTypeSchema>;
