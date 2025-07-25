import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRealtimeTools } from '@/hooks/use-realtime-tools';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import {
    Printer,
    FileDown,
    Clock,
    Calendar,
    ChevronDown,
    Sparkles,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ToolTag, Tool } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ReportMetrics {
    red: number;
    yellow: number;
    green: number;
    white: number;
}

export default function ReportsPage() {
    // Enable real-time updates for tools
    useRealtimeTools();
    const { toast } = useToast();

    const [timeframe, setTimeframe] = useState('30days');
    const [reportType, setReportType] = useState('status');
    const [activeTab, setActiveTab] = useState('overview');

    // Quick report generation mutation
    const quickReportMutation = useMutation({
        mutationFn: async ({
            format,
            type,
        }: {
            format: string;
            type: string;
        }) => {
            const response = await apiRequest('POST', '/api/reports', {
                reportType: 'tag-status',
                tags: ['red', 'yellow', 'green', 'white'],
                format,
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;

                const extension =
                    format === 'excel'
                        ? 'xlsx'
                        : format === 'csv'
                          ? 'csv'
                          : 'pdf';
                link.download = `quick-report-${new Date().toISOString().split('T')[0]}.${extension}`;

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                return { success: true };
            } else {
                throw new Error('Failed to generate report');
            }
        },
        onSuccess: (_, variables) => {
            toast({
                title: 'Report generated',
                description: `Your ${variables.format.toUpperCase()} report has been downloaded successfully.`,
            });
            queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to generate report: ${error.message}`,
                variant: 'destructive',
            });
        },
    });

    const handlePrintReport = () => {
        window.print();
    };

    const handleQuickExport = (format: string) => {
        quickReportMutation.mutate({ format, type: 'quick' });
    };

    // Fetch tools statistics
    const { data: statsData, isLoading: isStatsLoading } = useQuery({
        queryKey: ['/api/stats'],
        queryFn: async () => {
            const response = await fetch('/api/stats');
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }
            return response.json() as Promise<ReportMetrics>;
        },
    });

    // Fetch tools
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

    // Format data for charts
    const pieChartData = statsData
        ? [
              { name: 'Red', value: statsData.red, color: '#FF5252' },
              { name: 'Yellow', value: statsData.yellow, color: '#FFC107' },
              { name: 'Green', value: statsData.green, color: '#4CAF50' },
              { name: 'White', value: statsData.white, color: '#F5F5F5' },
          ]
        : [];

    const barChartData = [
        { name: 'Perforating Guns', red: 3, yellow: 5, green: 8, white: 2 },
        { name: 'Wireline Tools', red: 2, yellow: 7, green: 12, white: 3 },
        { name: 'Pressure Gauges', red: 4, yellow: 3, green: 10, white: 1 },
        { name: 'Logging Equipment', red: 1, yellow: 2, green: 15, white: 4 },
    ];

    const categoryChartData = [
        { name: 'Perforating', value: 35, color: '#9C27B0' },
        { name: 'Wireline', value: 25, color: '#2196F3' },
        { name: 'Logging', value: 20, color: '#00BCD4' },
        { name: 'Slickline', value: 15, color: '#009688' },
        { name: 'Other', value: 5, color: '#607D8B' },
    ];

    const formatDate = (dateInput: string) => {
        const date = new Date(dateInput);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(date);
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
            <Badge className={className[status]}>
                <span className="mr-1">●</span>
                {labels[status]}
            </Badge>
        );
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Reports
                    </h1>
                    <p className="text-muted-foreground">
                        Generate and view reports on your tool inventory
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="btn-halliburton">
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate Report
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handlePrintReport}>
                                <Printer className="h-4 w-4 mr-2" />
                                Print Report
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleQuickExport('pdf')}
                            >
                                <FileDown className="h-4 w-4 mr-2" />
                                Export PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleQuickExport('csv')}
                            >
                                <FileDown className="h-4 w-4 mr-2" />
                                Export CSV
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
                <div className="w-full md:w-1/3">
                    <Label htmlFor="reportType">Report Type</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger id="reportType">
                            <SelectValue placeholder="Status Report" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="status">
                                Status Report
                            </SelectItem>
                            <SelectItem value="category">
                                Category Distribution
                            </SelectItem>
                            <SelectItem value="location">
                                Location Analysis
                            </SelectItem>
                            <SelectItem value="maintenance">
                                Maintenance Report
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full md:w-1/3">
                    <Label htmlFor="timeframe">Time Frame</Label>
                    <Select value={timeframe} onValueChange={setTimeframe}>
                        <SelectTrigger id="timeframe">
                            <SelectValue placeholder="Last 30 Days" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7days">Last 7 Days</SelectItem>
                            <SelectItem value="30days">Last 30 Days</SelectItem>
                            <SelectItem value="90days">Last 90 Days</SelectItem>
                            <SelectItem value="1year">Last Year</SelectItem>
                            <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="detailed">Detailed Report</TabsTrigger>
                    <TabsTrigger value="historical">
                        Historical Data
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                        <Card className="stats-card-red">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">
                                    Red Tagged Tools
                                </CardTitle>
                                <CardDescription>
                                    Critical attention required
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isStatsLoading ? (
                                    <Skeleton className="h-12 w-20" />
                                ) : (
                                    <div className="text-3xl font-bold">
                                        {statsData?.red || 0}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="stats-card-yellow">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">
                                    Yellow Tagged Tools
                                </CardTitle>
                                <CardDescription>
                                    Inspection needed
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isStatsLoading ? (
                                    <Skeleton className="h-12 w-20" />
                                ) : (
                                    <div className="text-3xl font-bold">
                                        {statsData?.yellow || 0}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="stats-card-green">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">
                                    Green Tagged Tools
                                </CardTitle>
                                <CardDescription>Ready for use</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isStatsLoading ? (
                                    <Skeleton className="h-12 w-20" />
                                ) : (
                                    <div className="text-3xl font-bold">
                                        {statsData?.green || 0}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="stats-card-white">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">
                                    White Tagged Tools
                                </CardTitle>
                                <CardDescription>
                                    Archive/storage
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isStatsLoading ? (
                                    <Skeleton className="h-12 w-20" />
                                ) : (
                                    <div className="text-3xl font-bold">
                                        {statsData?.white || 0}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Tool Status Distribution</CardTitle>
                                <CardDescription>
                                    Overview of tool status by tag color
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-80">
                                {isStatsLoading ? (
                                    <div className="h-full w-full flex items-center justify-center">
                                        <Skeleton className="h-64 w-64 rounded-full" />
                                    </div>
                                ) : (
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={pieChartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) =>
                                                    `${name}: ${(percent * 100).toFixed(0)}%`
                                                }
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {pieChartData.map(
                                                    (entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.color}
                                                        />
                                                    ),
                                                )}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Category Analysis</CardTitle>
                                <CardDescription>
                                    Distribution by tool category
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-80">
                                {isStatsLoading ? (
                                    <div className="h-full w-full flex items-center justify-center">
                                        <div className="space-y-2 w-full">
                                            <Skeleton className="h-12 w-full" />
                                            <Skeleton className="h-12 w-4/5" />
                                            <Skeleton className="h-12 w-3/4" />
                                            <Skeleton className="h-12 w-2/3" />
                                            <Skeleton className="h-12 w-1/2" />
                                        </div>
                                    </div>
                                ) : reportType === 'category' ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={categoryChartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) =>
                                                    `${name}: ${(percent * 100).toFixed(0)}%`
                                                }
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {categoryChartData.map(
                                                    (entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.color}
                                                        />
                                                    ),
                                                )}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={barChartData}
                                            margin={{
                                                top: 20,
                                                right: 30,
                                                left: 20,
                                                bottom: 5,
                                            }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar
                                                dataKey="red"
                                                name="Red Tagged"
                                                stackId="a"
                                                fill="#FF5252"
                                            />
                                            <Bar
                                                dataKey="yellow"
                                                name="Yellow Tagged"
                                                stackId="a"
                                                fill="#FFC107"
                                            />
                                            <Bar
                                                dataKey="green"
                                                name="Green Tagged"
                                                stackId="a"
                                                fill="#4CAF50"
                                            />
                                            <Bar
                                                dataKey="white"
                                                name="White Tagged"
                                                stackId="a"
                                                fill="#F5F5F5"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="detailed" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Status Report</CardTitle>
                            <CardDescription>
                                Complete breakdown of tool status
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
                                            <TableHead>Location</TableHead>
                                            <TableHead>Last Updated</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isToolsLoading ? (
                                            // Skeleton loader rows
                                            Array.from({ length: 5 }).map(
                                                (_, index) => (
                                                    <TableRow
                                                        key={`skeleton-${index}`}
                                                    >
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
                                                            <Skeleton className="h-5 w-24" />
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )
                                        ) : toolsData?.tools?.length > 0 ? (
                                            toolsData.tools.map(
                                                (tool: Tool) => (
                                                    <TableRow
                                                        key={tool.id}
                                                        className="hover:bg-muted/50"
                                                    >
                                                        <TableCell className="font-medium">
                                                            {tool.tool_id}
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
                                                        </TableCell>
                                                        <TableCell>
                                                            {tool.location ||
                                                                '—'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {new Date(
                                                                tool.last_updated,
                                                            ).toLocaleDateString()}
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    className="h-24 text-center"
                                                >
                                                    No tools found. Add some
                                                    tools to generate reports.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button variant="outline" className="ml-auto">
                                <Printer className="h-4 w-4 mr-2" />
                                Print Report
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="historical" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historical Trend Analysis</CardTitle>
                            <CardDescription>
                                Tool status changes over time
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="h-80">
                            <div className="flex items-center mb-4">
                                <Clock className="mr-2 h-4 w-4" />
                                <Select
                                    value={timeframe}
                                    onValueChange={setTimeframe}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select timeframe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7days">
                                            Last 7 Days
                                        </SelectItem>
                                        <SelectItem value="30days">
                                            Last 30 Days
                                        </SelectItem>
                                        <SelectItem value="90days">
                                            Last 90 Days
                                        </SelectItem>
                                        <SelectItem value="1year">
                                            Last Year
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart
                                    data={[
                                        {
                                            name: 'Jan',
                                            red: 4,
                                            yellow: 7,
                                            green: 20,
                                            white: 3,
                                        },
                                        {
                                            name: 'Feb',
                                            red: 3,
                                            yellow: 8,
                                            green: 22,
                                            white: 2,
                                        },
                                        {
                                            name: 'Mar',
                                            red: 5,
                                            yellow: 6,
                                            green: 19,
                                            white: 4,
                                        },
                                        {
                                            name: 'Apr',
                                            red: 6,
                                            yellow: 4,
                                            green: 21,
                                            white: 3,
                                        },
                                        {
                                            name: 'May',
                                            red: 4,
                                            yellow: 7,
                                            green: 24,
                                            white: 2,
                                        },
                                        {
                                            name: 'Jun',
                                            red: 3,
                                            yellow: 9,
                                            green: 25,
                                            white: 5,
                                        },
                                    ]}
                                    margin={{
                                        top: 20,
                                        right: 30,
                                        left: 20,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar
                                        dataKey="red"
                                        name="Red Tagged"
                                        fill="#FF5252"
                                    />
                                    <Bar
                                        dataKey="yellow"
                                        name="Yellow Tagged"
                                        fill="#FFC107"
                                    />
                                    <Bar
                                        dataKey="green"
                                        name="Green Tagged"
                                        fill="#4CAF50"
                                    />
                                    <Bar
                                        dataKey="white"
                                        name="White Tagged"
                                        fill="#F5F5F5"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="mr-2 h-4 w-4" />
                                Data range: Jan 01, 2025 - Jun 30, 2025
                            </div>
                            <Button
                                variant="outline"
                                className="ml-auto"
                                onClick={() => handleQuickExport('excel')}
                                disabled={quickReportMutation.isPending}
                            >
                                <FileDown className="h-4 w-4 mr-2" />
                                Export Data
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
