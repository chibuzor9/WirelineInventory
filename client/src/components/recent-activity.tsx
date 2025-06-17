import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowRight,
    Loader2,
    User,
    Plus,
    Edit,
    Trash,
    FileText,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { timeAgo } from '@/lib/utils';

interface ActivityUser {
    id: number;
    username: string;
    full_name: string;
}

interface ActivityTool {
    id: number;
    toolId: string;
    name: string;
}

interface EnrichedActivity {
    id: number;
    userId: number;
    action: string;
    toolId?: number;
    timestamp: string;
    details: string;
    comments?: string;
    previousStatus?: string;
    user: ActivityUser;
    tool?: ActivityTool;
}

interface RecentActivityProps {
    activities: EnrichedActivity[];
    isLoading: boolean;
}

export default function RecentActivity({
    activities,
    isLoading,
}: RecentActivityProps) {
    const [, setLocation] = useLocation();

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'create':
                return <Plus className="w-4 h-4 text-green-600" />;
            case 'update':
                return <Edit className="w-4 h-4 text-blue-600" />;
            case 'delete':
                return <Trash className="w-4 h-4 text-red-600" />;
            case 'report':
                return <FileText className="w-4 h-4 text-purple-600" />;
            default:
                return <Plus className="w-4 h-4 text-gray-600" />;
        }
    };

    const getActionBadge = (action: string) => {
        const badgeProps = {
            create: {
                color: 'bg-green-100 text-green-800 border-green-200',
                label: 'Created',
            },
            update: {
                color: 'bg-blue-100 text-blue-800 border-blue-200',
                label: 'Updated',
            },
            delete: {
                color: 'bg-red-100 text-red-800 border-red-200',
                label: 'Deleted',
            },
            report: {
                color: 'bg-purple-100 text-purple-800 border-purple-200',
                label: 'Report',
            },
        };

        const config =
            badgeProps[action as keyof typeof badgeProps] || badgeProps.create;

        return (
            <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}
            >
                {config.label}
            </span>
        );
    };

    const formatActivityText = (activity: EnrichedActivity) => {
        const details = activity.details;

        // For status changes, extract the tool and status change info
        if (
            details.includes('Changed tag for') &&
            details.includes('from') &&
            details.includes('to')
        ) {
            const match = details.match(
                /Changed tag for (.+?) \((.+?)\) from (\w+) to (\w+)/,
            );
            if (match) {
                const [, toolName, toolId, fromStatus, toStatus] = match;
                return {
                    mainText: `${toolName} (${toolId}) changed from ${fromStatus} to ${toStatus}`,
                    isStatusChange: true,
                    fromStatus,
                    toStatus,
                    hasComment: !!activity.comments?.trim(),
                    comment: activity.comments,
                };
            }
        }

        // For creation
        if (details.includes('Created tool')) {
            const match = details.match(
                /Created tool (.+?) \((.+?)\) with (\w+) tag/,
            );
            if (match) {
                const [, toolName, toolId, status] = match;
                return {
                    mainText: `${toolName} (${toolId}) was created with ${status} tag`,
                    isStatusChange: false,
                    hasComment: !!activity.comments?.trim(),
                    comment: activity.comments,
                };
            }
        }

        // For general updates
        if (details.includes('Updated tool')) {
            const match = details.match(/Updated tool (.+?) \((.+?)\)/);
            if (match) {
                const [, toolName, toolId] = match;
                return {
                    mainText: `${toolName} (${toolId}) was updated`,
                    isStatusChange: false,
                    hasComment: !!activity.comments?.trim(),
                    comment: activity.comments,
                };
            }
        }

        // Fallback to original details
        return {
            mainText: details,
            isStatusChange: false,
            hasComment: !!activity.comments?.trim(),
            comment: activity.comments,
        };
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-halliburton-red" />
                    </div>
                ) : activities.length > 0 ? (
                    <ul className="space-y-3">
                        {activities.map((activity) => {
                            const formattedActivity =
                                formatActivityText(activity);
                            return (
                                <li
                                    key={activity.id}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors"
                                >
                                    {getActionIcon(activity.action)}
                                    {getActionBadge(activity.action)}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-neutral-800 font-medium">
                                            {formattedActivity.mainText}
                                        </p>
                                        {formattedActivity.hasComment &&
                                            formattedActivity.comment && (
                                                <p className="text-sm text-neutral-600 italic mt-1 px-2 py-1 bg-neutral-50 rounded">
                                                    💬{' '}
                                                    {formattedActivity.comment}
                                                </p>
                                            )}
                                        <p className="text-xs text-neutral-500 mt-1">
                                            {timeAgo(
                                                new Date(activity.timestamp),
                                            )}{' '}
                                            • {activity.user.full_name}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-center py-6 text-neutral-500">
                        No recent activity found.
                    </p>
                )}

                {activities.length > 0 && (
                    <Button
                        variant="ghost"
                        className="w-full mt-4 text-sm text-halliburton-blue hover:text-halliburton-red"
                        onClick={() => setLocation('/activity')}
                    >
                        View All Activity
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
