import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import SearchInput from '@/components/ui/search-input';
import {
    User,
    Wrench,
    Plus,
    Trash2,
    Edit,
    RefreshCw,
    FileText,
    Clock,
    Activity,
    Filter,
    X,
    ChevronDown,
} from 'lucide-react';

interface ActivityUser {
    id: string;
    full_name: string;
    email: string;
}

interface ActivityTool {
    id: string;
    name: string;
    category: string;
}

interface EnrichedActivity {
    id: string;
    action: string;
    details: string;
    comments?: string;
    previousStatus?: string;
    timestamp: string;
    user: ActivityUser;
    tool?: ActivityTool;
}

function getActionIcon(action: string) {
    switch (action) {
        case 'create':
            return <Plus className="w-4 h-4 text-green-600" />;
        case 'update':
            return <Edit className="w-4 h-4 text-blue-600" />;
        case 'delete':
            return <Trash2 className="w-4 h-4 text-red-600" />;
        case 'maintenance':
            return <Wrench className="w-4 h-4 text-orange-600" />;
        case 'report':
            return <FileText className="w-4 h-4 text-purple-600" />;
        default:
            return <Activity className="w-4 h-4 text-gray-600" />;
    }
}

function getActionBadge(action: string) {
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
        maintenance: {
            color: 'bg-orange-100 text-orange-800 border-orange-200',
            label: 'Maintenance',
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
}
function timeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

function formatActivityText(activity: EnrichedActivity): {
    mainText: string;
    hasComment: boolean;
    comment?: string;
} {
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
                hasComment: !!activity.comments?.trim(),
                comment: activity.comments,
            };
        }
    }

    // Fallback to original details
    return {
        mainText: details,
        hasComment: !!activity.comments?.trim(),
        comment: activity.comments,
    };
}

export default function ActivityPage() {
    const [limit, setLimit] = useState(100);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState<string>('all');
    const [userFilter, setUserFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    const {
        data: activities = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['activities', limit],
        queryFn: async (): Promise<EnrichedActivity[]> => {
            const response = await fetch(`/api/activities?limit=${limit}`, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch activities: ${response.statusText}`,
                );
            }

            return response.json();
        },
        staleTime: 30000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
    });

    // Get unique users and actions for filters
    const uniqueUsers = useMemo(() => {
        const users = activities
            .filter((activity) => activity.user?.full_name)
            .map((activity) => ({
                id: activity.user.id,
                name: activity.user.full_name,
            }));
        return Array.from(
            new Map(users.map((user) => [user.id, user])).values(),
        );
    }, [activities]);

    const uniqueActions = useMemo(() => {
        return Array.from(
            new Set(activities.map((activity) => activity.action)),
        );
    }, [activities]);

    // Filter activities based on current filters
    const filteredActivities = useMemo(() => {
        return activities.filter((activity) => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesSearch =
                    activity.details.toLowerCase().includes(query) ||
                    activity.comments?.toLowerCase().includes(query) ||
                    activity.user?.full_name.toLowerCase().includes(query) ||
                    activity.tool?.name?.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            // Action filter
            if (actionFilter !== 'all' && activity.action !== actionFilter) {
                return false;
            }

            // User filter
            if (userFilter !== 'all' && activity.user?.id !== userFilter) {
                return false;
            } // Date range filter
            const activityDate = new Date(activity.timestamp);
            if (dateFrom && activityDate < new Date(dateFrom)) {
                return false;
            }
            if (dateTo) {
                const endOfDay = new Date(dateTo);
                endOfDay.setHours(23, 59, 59, 999);
                if (activityDate > endOfDay) {
                    return false;
                }
            }

            return true;
        });
    }, [activities, searchQuery, actionFilter, userFilter, dateFrom, dateTo]);

    const clearFilters = () => {
        setSearchQuery('');
        setActionFilter('all');
        setUserFilter('all');
        setDateFrom('');
        setDateTo('');
    };

    const hasActiveFilters =
        searchQuery ||
        actionFilter !== 'all' ||
        userFilter !== 'all' ||
        dateFrom ||
        dateTo;

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-800">
                            Activity Log
                        </h1>
                        <p className="text-sm text-neutral-600">
                            System activity and audit trail
                        </p>
                    </div>
                </div>

                <Card className="p-8 text-center">
                    <CardContent>
                        <Activity className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                            Error Loading Activities
                        </h3>
                        <p className="text-neutral-600 mb-4">
                            {error instanceof Error
                                ? error.message
                                : 'Failed to load activity log'}
                        </p>
                        <Button onClick={() => refetch()}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-800">
                            Activity Log
                        </h1>
                        <p className="text-sm text-neutral-600">
                            System activity and audit trail (
                            {filteredActivities.length} of {activities.length}{' '}
                            entries)
                        </p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                            <ChevronDown
                                className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                            />
                        </Button>
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearFilters}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Clear
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            disabled={isLoading}
                        >
                            <RefreshCw
                                className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                            />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <Card className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Search */}{' '}
                            <div>
                                <Label htmlFor="search">Search</Label>
                                <SearchInput
                                    placeholder="Search activities..."
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    className="mt-1"
                                />
                            </div>
                            {/* Action Filter */}
                            <div>
                                <Label htmlFor="action">Action Type</Label>
                                <Select
                                    value={actionFilter}
                                    onValueChange={setActionFilter}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="All actions" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Actions
                                        </SelectItem>
                                        {uniqueActions.map((action) => (
                                            <SelectItem
                                                key={action}
                                                value={action}
                                            >
                                                {action
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    action.slice(1)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* User Filter */}
                            <div>
                                <Label htmlFor="user">User</Label>
                                <Select
                                    value={userFilter}
                                    onValueChange={setUserFilter}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="All users" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Users
                                        </SelectItem>
                                        {uniqueUsers.map((user) => (
                                            <SelectItem
                                                key={user.id}
                                                value={user.id}
                                            >
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>{' '}
                            {/* Date Range */}
                            <div>
                                <Label>Date Range</Label>
                                <div className="flex gap-2 mt-1">
                                    <Input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) =>
                                            setDateFrom(e.target.value)
                                        }
                                        placeholder="From date"
                                        className="flex-1"
                                    />
                                    <Input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) =>
                                            setDateTo(e.target.value)
                                        }
                                        placeholder="To date"
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {/* Activity List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Activity className="h-5 w-5 mr-2" />
                        Recent Activities
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="flex items-start space-x-4 p-4 border-b border-neutral-100 last:border-0"
                                >
                                    <div className="w-8 h-8 bg-neutral-200 rounded-full animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-neutral-200 rounded animate-pulse w-3/4" />
                                        <div className="h-3 bg-neutral-200 rounded animate-pulse w-1/2" />
                                    </div>
                                    <div className="h-6 w-16 bg-neutral-200 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : filteredActivities.length === 0 ? (
                        <div className="text-center py-12">
                            <Activity className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                                No Activities Found
                            </h3>
                            <p className="text-neutral-600">
                                {hasActiveFilters
                                    ? 'No activities match your current filters. Try adjusting your search criteria.'
                                    : 'No recent activity to display. Activities will appear here as users interact with the system.'}
                            </p>
                            {hasActiveFilters && (
                                <Button
                                    variant="outline"
                                    onClick={clearFilters}
                                    className="mt-4"
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-0">
                            {filteredActivities.map((activity, index) => {
                                const formattedActivity =
                                    formatActivityText(activity);
                                return (
                                    <div
                                        key={activity.id}
                                        className={`flex items-center gap-4 p-4 ${
                                            index <
                                            filteredActivities.length - 1
                                                ? 'border-b border-neutral-100'
                                                : ''
                                        } hover:bg-neutral-50 transition-colors`}
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
                                                        {
                                                            formattedActivity.comment
                                                        }
                                                    </p>
                                                )}
                                            <p className="text-xs text-neutral-500 mt-1">
                                                {timeAgo(
                                                    new Date(
                                                        activity.timestamp,
                                                    ),
                                                )}{' '}
                                                •{' '}
                                                {activity.user?.full_name ||
                                                    'Unknown User'}{' '}
                                                •{' '}
                                                {new Date(
                                                    activity.timestamp,
                                                ).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}{' '}
                    {/* Pagination and Load More Controls */}
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-100 mt-4">
                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-neutral-600">
                                Showing {filteredActivities.length} of{' '}
                                {activities.length} activities
                            </div>
                            {activities.length >= limit && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setLimit((prev) => prev + 100)
                                    }
                                    disabled={isLoading}
                                >
                                    Load More
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Label htmlFor="limit" className="text-sm">
                                Show:
                            </Label>
                            <Select
                                value={limit.toString()}
                                onValueChange={(value) =>
                                    setLimit(parseInt(value))
                                }
                            >
                                <SelectTrigger className="w-20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                    <SelectItem value="200">200</SelectItem>
                                    <SelectItem value="500">500</SelectItem>
                                    <SelectItem value="1000">1000</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
