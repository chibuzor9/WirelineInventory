import type { VercelRequest, VercelResponse } from '@vercel/node';
import { userCleanupService } from '../server/cleanup';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Verify this is a cron job request (optional security check)
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        console.log('Running scheduled user cleanup...');
        const result = await userCleanupService.runManualCleanup();
        
        console.log('Cleanup completed:', result);
        
        return res.status(200).json({
            success: true,
            message: 'Cleanup completed successfully',
            ...result
        });
    } catch (error) {
        console.error('Cleanup cron job failed:', error);
        return res.status(500).json({
            success: false,
            message: 'Cleanup failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}