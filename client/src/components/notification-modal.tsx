import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Bell,
    Clock,
    CheckCircle,
    AlertTriangle,
    Info,
    XCircle,
    Wrench,
    Activity,
} from 'lucide-react';

interface NotificationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface Notification {
    id: string;
    type: 'info' | 'warning' | 'success' | 'error';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    source: 'activity' | 'tool';
    data?: any;
}

export default function NotificationModal({
    open,
    onOpenChange,
}: NotificationModalProps) {
    // Fetch real notifications from API
    const {
        data: notifications = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ['/api/notifications'],
        queryFn: async () => {
            const response = await fetch('/api/notifications');
            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }
            return response.json();
        },
        refetchInterval: 30000, // Refresh every 30 seconds
        enabled: open, // Only fetch when modal is open
    });

    const unreadCount = notifications.filter(
        (n: Notification) => !n.read,
    ).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'error':
                return <XCircle className="h-4 w-4 text-red-600" />;
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
            case 'error':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'warning':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'success':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'info':
            default:
                return 'bg-blue-100 text-blue-800 border-blue-300';
        }
    };

    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'tool':
                return <Wrench className="h-3 w-3" />;
            case 'activity':
            default:
                return <Activity className="h-3 w-3" />;
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60),
        );

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;

        return date.toLocaleDateString();
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

                <div className="max-h-96 overflow-y-auto space-y-3">
                    {isLoading ? (
                        // Loading skeleton
                        Array.from({ length: 5 }).map((_, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-3 border rounded-lg"
                            >
                                <Skeleton className="h-4 w-4 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))
                    ) : error ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Failed to load notifications</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => window.location.reload()}
                            >
                                Retry
                            </Button>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((notification: Notification) => (
                            <div
                                key={notification.id}
                                className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                                    !notification.read
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'bg-background hover:bg-muted/50'
                                }`}
                            >
                                <div className="flex-shrink-0 mt-0.5">
                                    {getIcon(notification.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-medium text-sm text-foreground">
                                            {notification.title}
                                        </h4>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            {getSourceIcon(notification.source)}
                                            <span>{notification.source}</span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {notification.message}
                                    </p>

                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className={`text-xs ${getBadgeColor(notification.type)}`}
                                            >
                                                {notification.type}
                                            </Badge>
                                            {!notification.read && (
                                                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {formatTime(notification.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={notifications.length === 0}
                    >
                        Mark All Read
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
