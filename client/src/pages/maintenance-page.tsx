import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRealtimeTools } from '@/hooks/use-realtime-tools';
import { Tool, ToolTag } from '@shared/schema';
import SearchInput from '@/components/ui/search-input';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Filter,
    Search,
    Calendar,
    XCircle,
    PlusCircle,
    FileDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

// Mock maintenance records for demonstration
const maintenanceRecords = [
    {
        id: 1,
        toolId: 'WP12345',
        toolName: 'Perforating Gun',
        type: 'inspection',
        status: 'completed',
        dueDate: '2025-04-10',
        completedDate: '2025-04-08',
        notes: 'Regular inspection completed. All components working properly.',
    },
    {
        id: 2,
        toolId: 'WP45678',
        toolName: 'Logging Tool',
        type: 'calibration',
        status: 'overdue',
        dueDate: '2025-04-05',
        completedDate: null,
        notes: 'Calibration needed for pressure sensor.',
    },
    {
        id: 3,
        toolId: 'WP78901',
        toolName: 'Sample Taker',
        type: 'repair',
        status: 'scheduled',
        dueDate: '2025-04-20',
        completedDate: null,
        notes: 'Replace damaged O-rings and pressure test.',
    },
    {
        id: 4,
        toolId: 'WP24680',
        toolName: 'eLine Cutter',
        type: 'certification',
        status: 'completed',
        dueDate: '2025-03-25',
        completedDate: '2025-03-24',
        notes: 'Certification renewed for another 12 months.',
    },
    {
        id: 5,
        toolId: 'WP13579',
        toolName: 'Wireline Tool',
        type: 'inspection',
        status: 'upcoming',
        dueDate: '2025-04-25',
        completedDate: null,
        notes: 'Scheduled for regular 6-month inspection.',
    },
];

export default function MaintenancePage() {
    // Enable real-time updates for tools
    useRealtimeTools();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('scheduled');

    // Fetch tools data
    const { data: toolsData, isLoading: isToolsLoading } = useQuery({
        queryKey: ['/api/tools'],
        queryFn: async () => {
            const response = await fetch('/api/tools');
            if (!response.ok) {
                throw new Error('Failed to fetch tools');
            }
            return response.json();
        },
    });

    // Filter maintenance records based on search and filters
    const filteredRecords = maintenanceRecords.filter((record) => {
        // Search filter
        const matchesSearch =
            searchQuery === '' ||
            record.toolId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.notes.toLowerCase().includes(searchQuery.toLowerCase());

        // Status filter
        const matchesStatus =
            statusFilter === 'all' || record.status === statusFilter;

        // Type filter
        const matchesType = typeFilter === 'all' || record.type === typeFilter;

        // Tab filter
        const matchesTab =
            (activeTab === 'scheduled' &&
                ['upcoming', 'scheduled'].includes(record.status)) ||
            (activeTab === 'completed' && record.status === 'completed') ||
            (activeTab === 'overdue' && record.status === 'overdue') ||
            activeTab === 'all';

        return matchesSearch && matchesStatus && matchesType && matchesTab;
    });

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(date);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <Badge className="bg-tag-green/10 text-tag-green border border-tag-green/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                    </Badge>
                );
            case 'overdue':
                return (
                    <Badge className="bg-tag-red/10 text-tag-red border border-tag-red/20">
                        <XCircle className="h-3 w-3 mr-1" />
                        Overdue
                    </Badge>
                );
            case 'upcoming':
                return (
                    <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                        <Clock className="h-3 w-3 mr-1" />
                        Upcoming
                    </Badge>
                );
            case 'scheduled':
                return (
                    <Badge className="bg-tag-yellow/10 text-tag-yellow border border-tag-yellow/20">
                        <Calendar className="h-3 w-3 mr-1" />
                        Scheduled
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Calculate statistics
    const stats = {
        total: maintenanceRecords.length,
        completed: maintenanceRecords.filter((r) => r.status === 'completed')
            .length,
        overdue: maintenanceRecords.filter((r) => r.status === 'overdue')
            .length,
        upcoming: maintenanceRecords.filter((r) => r.status === 'upcoming')
            .length,
        scheduled: maintenanceRecords.filter((r) => r.status === 'scheduled')
            .length,
    };

    const renderTagBadge = (status: ToolTag) => {
        const className = {
            red: 'tag-badge-red',
            yellow: 'tag-badge-yellow',
            green: 'tag-badge-green',
            white: 'tag-badge-white',
        };

        const labels = {
            red: 'Red',
            yellow: 'Yellow',
            green: 'Green',
            white: 'White',
        };

        return (
            <div className={className[status]}>
                <span className="mr-1">●</span>
                {labels[status]}
            </div>
        );
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Maintenance
                    </h1>
                    <p className="text-muted-foreground">
                        Track and schedule maintenance for your tools
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button className="btn-halliburton">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Schedule Maintenance
                    </Button>
                    <Button variant="outline">
                        <FileDown className="h-4 w-4 mr-2" />
                        Export Schedule
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Total Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card className="stats-card-green">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {stats.completed}
                        </div>
                    </CardContent>
                </Card>
                <Card className="stats-card-yellow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Scheduled</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {stats.scheduled + stats.upcoming}
                        </div>
                    </CardContent>
                </Card>
                <Card className="stats-card-red">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Overdue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {stats.overdue}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Maintenance Schedule</CardTitle>
                    <CardDescription>
                        View and manage tool maintenance records
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
                        <SearchInput
                            placeholder="Search by tool ID, name, or notes..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            className="flex-1"
                        />
                        <div className="flex gap-2">
                            <div className="flex items-center">
                                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Filter:</span>
                            </div>
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Statuses
                                    </SelectItem>
                                    <SelectItem value="completed">
                                        Completed
                                    </SelectItem>
                                    <SelectItem value="scheduled">
                                        Scheduled
                                    </SelectItem>
                                    <SelectItem value="upcoming">
                                        Upcoming
                                    </SelectItem>
                                    <SelectItem value="overdue">
                                        Overdue
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={typeFilter}
                                onValueChange={setTypeFilter}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Types
                                    </SelectItem>
                                    <SelectItem value="inspection">
                                        Inspection
                                    </SelectItem>
                                    <SelectItem value="calibration">
                                        Calibration
                                    </SelectItem>
                                    <SelectItem value="repair">
                                        Repair
                                    </SelectItem>
                                    <SelectItem value="certification">
                                        Certification
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full mb-6"
                    >
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="scheduled">
                                <Calendar className="h-4 w-4 mr-2" />
                                Scheduled
                            </TabsTrigger>
                            <TabsTrigger value="completed">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Completed
                            </TabsTrigger>
                            <TabsTrigger value="overdue">
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Overdue
                            </TabsTrigger>
                            <TabsTrigger value="all">All Records</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tool ID</TableHead>
                                    <TableHead>Tool Name</TableHead>
                                    <TableHead>Maintenance Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Completed</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRecords.length > 0 ? (
                                    filteredRecords.map((record) => (
                                        <TableRow
                                            key={record.id}
                                            className="hover:bg-muted/50"
                                        >
                                            <TableCell className="font-medium">
                                                {record.toolId}
                                            </TableCell>
                                            <TableCell>
                                                {record.toolName}
                                            </TableCell>
                                            <TableCell className="capitalize">
                                                {record.type}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(record.status)}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(record.dueDate)}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(
                                                    record.completedDate,
                                                )}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {record.notes}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="h-24 text-center"
                                        >
                                            No maintenance records found
                                            matching your filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <div className="text-xs text-muted-foreground">
                        Showing {filteredRecords.length} of{' '}
                        {maintenanceRecords.length} maintenance records
                    </div>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Red & Yellow Tools</CardTitle>
                    <CardDescription>
                        Tools that may need maintenance
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tool ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isToolsLoading ? (
                                    // Skeleton loader rows
                                    Array.from({ length: 3 }).map(
                                        (_, index) => (
                                            <TableRow key={`skeleton-${index}`}>
                                                <TableCell>
                                                    <Skeleton className="h-5 w-20" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-5 w-32" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-5 w-28" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-5 w-24" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-5 w-28" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-5 w-20" />
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )
                                ) : toolsData?.tools?.length > 0 ? (
                                    toolsData.tools
                                        .filter((tool: Tool) =>
                                            ['red', 'yellow'].includes(
                                                tool.status,
                                            ),
                                        )
                                        .map((tool: Tool) => (
                                            <TableRow
                                                key={tool.id}
                                                className="hover:bg-muted/50"
                                            >
                                                <TableCell className="font-medium">
                                                    {tool.toolId}
                                                </TableCell>
                                                <TableCell>
                                                    {tool.name}
                                                </TableCell>
                                                <TableCell>
                                                    {tool.category}
                                                </TableCell>
                                                <TableCell>
                                                    {renderTagBadge(
                                                        tool.status as ToolTag,
                                                    )}
                                                </TableCell>{' '}
                                                <TableCell>
                                                    {formatDate(
                                                        tool.lastUpdated?.toISOString() ||
                                                            null,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                    >
                                                        <PlusCircle className="h-3.5 w-3.5 mr-1" />
                                                        Schedule
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="h-24 text-center"
                                        >
                                            No red or yellow tools found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
