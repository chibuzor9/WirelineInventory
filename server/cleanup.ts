import { storage } from './storage.js';
import { emailService } from './email.js';

export class UserCleanupService {
    private isRunning: boolean = false;
    private intervalId: NodeJS.Timeout | null = null;

    // Run every 24 hours (86400000 ms)
    private readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;
    
    // Send reminder emails at these day thresholds
    private readonly REMINDER_DAYS = [7, 3, 1];

    start(): void {
        if (this.isRunning) {
            console.log('User cleanup service is already running');
            return;
        }

        console.log('Starting user cleanup service...');
        this.isRunning = true;

        // Run immediately on startup
        this.runCleanup();

        // Then schedule to run every 24 hours
        this.intervalId = setInterval(() => {
            this.runCleanup();
        }, this.CLEANUP_INTERVAL);
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('User cleanup service stopped');
    }

    private async runCleanup(): Promise<void> {
        try {
            console.log('Running user cleanup task...');
            
            // Get all users scheduled for deletion
            const scheduledUsers = await storage.getUsersScheduledForDeletion();
            
            if (scheduledUsers.length === 0) {
                console.log('No users scheduled for deletion');
                return;
            }

            const now = new Date();
            let deletedCount = 0;
            let remindersSent = 0;

            for (const user of scheduledUsers) {
                if (!user.deletion_scheduled_at) continue;

                const scheduledDate = new Date(user.deletion_scheduled_at);
                const deletionDate = new Date(scheduledDate.getTime() + (30 * 24 * 60 * 60 * 1000));
                const daysUntilDeletion = Math.ceil((deletionDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

                // If deletion date has passed, permanently delete the user
                if (daysUntilDeletion <= 0) {
                    try {
                        await storage.permanentlyDeleteUser(user.id);
                        deletedCount++;
                        console.log(`Permanently deleted user: ${user.username} (ID: ${user.id})`);
                        
                        // Log the permanent deletion
                        await storage.logActivity({
                            user_id: user.id,
                            action: 'system_permanent_deletion',
                            timestamp: now,
                            details: `User ${user.username} permanently deleted after 30-day grace period`,
                        });
                    } catch (error) {
                        console.error(`Failed to delete user ${user.username}:`, error);
                    }
                } 
                // Send reminder emails at specific day thresholds
                else if (this.REMINDER_DAYS.includes(daysUntilDeletion)) {
                    try {
                        await emailService.sendDeletionReminderEmail(
                            user.email,
                            user.full_name,
                            daysUntilDeletion
                        );
                        remindersSent++;
                        console.log(`Sent ${daysUntilDeletion}-day reminder to: ${user.email}`);
                        
                        // Log the reminder
                        await storage.logActivity({
                            user_id: user.id,
                            action: 'system_deletion_reminder',
                            timestamp: now,
                            details: `Sent ${daysUntilDeletion}-day deletion reminder to ${user.email}`,
                        });
                    } catch (error) {
                        console.error(`Failed to send reminder email to ${user.email}:`, error);
                    }
                }
            }

            console.log(`Cleanup completed. Deleted: ${deletedCount} users, Reminders sent: ${remindersSent}`);

        } catch (error) {
            console.error('Error during user cleanup:', error);
        }
    }

    // Manual cleanup method for testing or admin use
    async runManualCleanup(): Promise<{
        deletedUsers: number;
        remindersSent: number;
        errors: string[];
    }> {
        const result = {
            deletedUsers: 0,
            remindersSent: 0,
            errors: [] as string[]
        };

        try {
            const scheduledUsers = await storage.getUsersScheduledForDeletion();
            const now = new Date();

            for (const user of scheduledUsers) {
                if (!user.deletion_scheduled_at) continue;

                const scheduledDate = new Date(user.deletion_scheduled_at);
                const deletionDate = new Date(scheduledDate.getTime() + (30 * 24 * 60 * 60 * 1000));
                const daysUntilDeletion = Math.ceil((deletionDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

                if (daysUntilDeletion <= 0) {
                    try {
                        await storage.permanentlyDeleteUser(user.id);
                        result.deletedUsers++;
                    } catch (error) {
                        result.errors.push(`Failed to delete user ${user.username}: ${error}`);
                    }
                } else if (this.REMINDER_DAYS.includes(daysUntilDeletion)) {
                    try {
                        await emailService.sendDeletionReminderEmail(
                            user.email,
                            user.full_name,
                            daysUntilDeletion
                        );
                        result.remindersSent++;
                    } catch (error) {
                        result.errors.push(`Failed to send reminder to ${user.email}: ${error}`);
                    }
                }
            }
        } catch (error) {
            result.errors.push(`Cleanup error: ${error}`);
        }

        return result;
    }

    getStatus(): {
        isRunning: boolean;
        nextRunTime: Date | null;
    } {
        const nextRunTime = this.intervalId ? new Date(Date.now() + this.CLEANUP_INTERVAL) : null;
        return {
            isRunning: this.isRunning,
            nextRunTime
        };
    }
}

// Create singleton instance
export const userCleanupService = new UserCleanupService();