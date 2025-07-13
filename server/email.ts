import nodemailer from 'nodemailer';

interface EmailConfig {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
        user: string;
        pass: string;
    };
}

interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}

export class EmailService {
    private transporter: nodemailer.Transporter;
    private fromEmail: string;

    constructor(config: EmailConfig, fromEmail: string) {
        this.fromEmail = fromEmail;
        
        // Default to using environment variables or test configuration
        const emailConfig = {
            host: config.host || process.env.SMTP_HOST || 'smtp.gmail.com',
            port: config.port || parseInt(process.env.SMTP_PORT || '587'),
            secure: config.secure || false,
            auth: config.auth || {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || ''
            }
        };

        this.transporter = nodemailer.createTransport(emailConfig);
    }

    async sendDeletionWarningEmail(
        userEmail: string, 
        userName: string, 
        scheduledDate: Date
    ): Promise<boolean> {
        const finalDeletionDate = new Date(scheduledDate.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        const template = this.getDeletionWarningTemplate(userName, finalDeletionDate);
        
        try {
            await this.transporter.sendMail({
                from: this.fromEmail,
                to: userEmail,
                subject: template.subject,
                text: template.text,
                html: template.html
            });
            
            return true;
        } catch (error) {
            console.error('Failed to send deletion warning email:', error);
            return false;
        }
    }

    async sendDeletionReminderEmail(
        userEmail: string, 
        userName: string, 
        daysRemaining: number
    ): Promise<boolean> {
        const template = this.getDeletionReminderTemplate(userName, daysRemaining);
        
        try {
            await this.transporter.sendMail({
                from: this.fromEmail,
                to: userEmail,
                subject: template.subject,
                text: template.text,
                html: template.html
            });
            
            return true;
        } catch (error) {
            console.error('Failed to send deletion reminder email:', error);
            return false;
        }
    }

    async sendAccountRestoredEmail(
        userEmail: string, 
        userName: string
    ): Promise<boolean> {
        const template = this.getAccountRestoredTemplate(userName);
        
        try {
            await this.transporter.sendMail({
                from: this.fromEmail,
                to: userEmail,
                subject: template.subject,
                text: template.text,
                html: template.html
            });
            
            return true;
        } catch (error) {
            console.error('Failed to send account restored email:', error);
            return false;
        }
    }

    private getDeletionWarningTemplate(userName: string, finalDeletionDate: Date): EmailTemplate {
        const dateStr = finalDeletionDate.toLocaleDateString();
        
        return {
            subject: 'Important: Your Account Will Be Deleted',
            text: `
Dear ${userName},

This is to inform you that your account in the Wireline Inventory Management System has been scheduled for deletion by an administrator.

Your account will be permanently deleted on: ${dateStr}

If you believe this is an error or need to retain access to your account, please contact the system administrator immediately.

Important: After the deletion date, all your account data will be permanently removed and cannot be recovered.

Best regards,
Wireline Inventory Management System
            `.trim(),
            html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f8f9fa; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .date { font-weight: bold; color: #dc3545; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Account Deletion Notice</h1>
        </div>
        <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            
            <div class="warning">
                <strong>⚠️ Important Notice:</strong> Your account in the Wireline Inventory Management System has been scheduled for deletion by an administrator.
            </div>
            
            <p><strong>Deletion Date:</strong> <span class="date">${dateStr}</span></p>
            
            <p>If you believe this is an error or need to retain access to your account, please contact the system administrator immediately.</p>
            
            <p><strong>Important:</strong> After the deletion date, all your account data will be permanently removed and cannot be recovered.</p>
        </div>
        <div class="footer">
            <p>Wireline Inventory Management System</p>
        </div>
    </div>
</body>
</html>
            `.trim()
        };
    }

    private getDeletionReminderTemplate(userName: string, daysRemaining: number): EmailTemplate {
        return {
            subject: `Reminder: Account Deletion in ${daysRemaining} Days`,
            text: `
Dear ${userName},

This is a reminder that your account in the Wireline Inventory Management System is scheduled for deletion in ${daysRemaining} day(s).

If you need to retain access to your account, please contact the system administrator immediately.

Best regards,
Wireline Inventory Management System
            `.trim(),
            html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ffc107; color: #333; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f8f9fa; }
        .countdown { font-size: 24px; font-weight: bold; color: #dc3545; text-align: center; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Account Deletion Reminder</h1>
        </div>
        <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            
            <div class="countdown">${daysRemaining} Day(s) Remaining</div>
            
            <p>This is a reminder that your account is scheduled for deletion.</p>
            
            <p>If you need to retain access to your account, please contact the system administrator immediately.</p>
        </div>
        <div class="footer">
            <p>Wireline Inventory Management System</p>
        </div>
    </div>
</body>
</html>
            `.trim()
        };
    }

    private getAccountRestoredTemplate(userName: string): EmailTemplate {
        return {
            subject: 'Account Restored - Deletion Cancelled',
            text: `
Dear ${userName},

Good news! Your account in the Wireline Inventory Management System has been restored and the scheduled deletion has been cancelled.

You can continue to access your account as normal.

Best regards,
Wireline Inventory Management System
            `.trim(),
            html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f8f9fa; }
        .success { background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Account Restored</h1>
        </div>
        <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            
            <div class="success">
                <strong>✅ Good News:</strong> Your account has been restored and the scheduled deletion has been cancelled.
            </div>
            
            <p>You can continue to access your account as normal.</p>
        </div>
        <div class="footer">
            <p>Wireline Inventory Management System</p>
        </div>
    </div>
</body>
</html>
            `.trim()
        };
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            console.error('Email service connection test failed:', error);
            return false;
        }
    }
}

// Create singleton instance
export const emailService = new EmailService(
    {
        // Configuration will be loaded from environment variables
    },
    process.env.FROM_EMAIL || 'noreply@wirelineinventory.com'
);