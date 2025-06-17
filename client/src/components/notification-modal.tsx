import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface NotificationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface Notification {
    id: number;
    type: 'info' | 'warning' | 'success';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
}

export default function NotificationModal({
    open,
    onOpenChange,
}: NotificationModalProps) {
    const [notifications] = useState<Notification[]>([
        {
            id: 1,
            type: 'warning',
            title: 'Tool Maintenance Due',
            message: 'Wireline Tool WL-001 is due for maintenance inspection.',
            timestamp: '2 hours ago',
            read: false,
        },
        {
            id: 2,
            type: 'info',
            title: 'System Update',
            message: 'Inventory system has been updated with new features.',
            timestamp: '1 day ago',
            read: false,
        },
        {
            id: 3,
            type: 'success',
            title: 'Tool Status Updated',
            message: 'Tool WL-015 status changed from Yellow to Green.',
            timestamp: '2 days ago',
            read: true,
        },
        {
            id: 4,
            type: 'warning',
            title: 'Low Inventory Alert',
            message: 'Running low on Category A tools. Consider restocking.',
            timestamp: '3 days ago',
            read: true,
        },
    ]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'warning':
                return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'info':
            default:
                return <Info className="h-4 w-4 text-blue-600" />;
        }
    };

    const getBadgeColor = (type: string) => {
        switch (type) {
            case 'warning':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'success':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'info':
            default:
                return 'bg-blue-100 text-blue-800 border-blue-300';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-halliburton-red" />
                        Notifications
                        {unreadCount > 0 && (
                            <Badge className="bg-halliburton-red text-white ml-2">
                                {unreadCount} new
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="text-center py-8 text-neutral-500">
                            <Bell className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                            <p>No notifications available</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 rounded-lg border transition-colors ${
                                    notification.read
                                        ? 'bg-neutral-50 border-neutral-200'
                                        : 'bg-white border-neutral-300 shadow-sm'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5">
                                        {getIcon(notification.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4
                                                className={`font-medium text-sm ${
                                                    notification.read
                                                        ? 'text-neutral-600'
                                                        : 'text-neutral-900'
                                                }`}
                                            >
                                                {notification.title}
                                            </h4>
                                            <Badge
                                                variant="outline"
                                                className={`text-xs ${getBadgeColor(notification.type)}`}
                                            >
                                                {notification.type}
                                            </Badge>
                                        </div>

                                        <p
                                            className={`text-sm mt-1 ${
                                                notification.read
                                                    ? 'text-neutral-500'
                                                    : 'text-neutral-700'
                                            }`}
                                        >
                                            {notification.message}
                                        </p>

                                        <div className="flex items-center gap-1 mt-2 text-xs text-neutral-400">
                                            <Clock className="h-3 w-3" />
                                            {notification.timestamp}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {notifications.length > 0 && (
                    <div className="flex justify-between items-center pt-4 border-t">
                        <Button variant="ghost" size="sm" className="text-xs">
                            Mark all as read
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs">
                            Clear all
                        </Button>
                    </div>
                )}

                <div className="flex justify-end pt-2">
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
