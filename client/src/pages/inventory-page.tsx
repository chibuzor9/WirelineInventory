import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRealtimeTools } from '@/hooks/use-realtime-tools';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import SearchInput from '@/components/ui/search-input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Tool,
    ToolTag,
    toolTagSchema,
    toolCategorySchema,
} from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import ToolDialog from '@/components/tool-dialog';
import {
    Filter,
    Search,
    Plus,
    Tag,
    ChevronDown,
    Eye,
    Edit,
    Trash,
    DownloadCloud,
    Upload,
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function InventoryPage() {
    // Enable real-time updates for tools
    useRealtimeTools();

    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [location] = useLocation();

    // Extract search query from URL parameters
    const urlSearchQuery = (() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('search') || '';
    })();

    const [searchQuery, setSearchQuery] = useState(urlSearchQuery);

    // Update search query when URL changes
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const searchParam = params.get('search') || '';
        setSearchQuery(searchParam);
    }, [location]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all_tags');

    const { data, isLoading } = useQuery({
        queryKey: ['/api/tools', statusFilter, searchQuery],
        queryFn: async () => {
            const queryParams = new URLSearchParams();

            if (statusFilter && statusFilter !== 'all_tags') {
                queryParams.append('status', statusFilter);
            }

            if (searchQuery) {
                queryParams.append('search', searchQuery);
            }

            const response = await fetch(
                `/api/tools?${queryParams.toString()}`,
            );
            if (!response.ok) {
                throw new Error('Failed to fetch tools');
            }
            return response.json();
        },
    });

    const handleViewTool = (tool: Tool) => {
        setSelectedTool(tool);
        setIsViewDialogOpen(true);
    };

    const handleEditTool = (tool: Tool) => {
        setSelectedTool(tool);
        setIsEditDialogOpen(true);
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

    const formatDate = (dateInput: string | Date) => {
        const date =
            typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(date);
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Inventory
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your Wireline & Perforating tools inventory
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    {isAdmin && (
                        <Button
                            className="btn-halliburton"
                            onClick={() => setIsAddDialogOpen(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Tool
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <DownloadCloud className="h-4 w-4 mr-2" />
                                Export
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                            <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                            <DropdownMenuItem>Print Inventory</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Tool Inventory</CardTitle>
                    <CardDescription>
                        View and manage all inventory items with their status
                        and details
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
                        <SearchInput
                            placeholder="Search by tool ID, name, or location..."
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
                                <SelectTrigger className="w-[160px]">
                                    <Tag className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="All Tags" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all_tags">
                                        All Tags
                                    </SelectItem>
                                    {toolTagSchema.options.map((tag) => (
                                        <SelectItem key={tag} value={tag}>
                                            {`${tag.charAt(0).toUpperCase() + tag.slice(1)}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tool ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Tag</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    // Skeleton loader rows
                                    Array.from({ length: 5 }).map(
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
                                                    <Skeleton className="h-5 w-24" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-5 w-20 ml-auto" />
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )
                                ) : data?.tools?.length > 0 ? (
                                    data.tools.map((tool: Tool) => (
                                        <TableRow
                                            key={tool.id}
                                            className="hover:bg-muted/50"
                                        >
                                            <TableCell className="font-medium">
                                                {tool.toolId}
                                            </TableCell>
                                            <TableCell>{tool.name}</TableCell>
                                            <TableCell>
                                                {tool.category}
                                            </TableCell>
                                            <TableCell>
                                                {renderTagBadge(
                                                    tool.status as ToolTag,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {tool.location || '—'}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(tool.lastUpdated)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end items-center space-x-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleViewTool(tool)
                                                        }
                                                        className="h-8 w-8"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        <span className="sr-only">
                                                            View
                                                        </span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleEditTool(tool)
                                                        }
                                                        className="h-8 w-8"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                        <span className="sr-only">
                                                            Edit
                                                        </span>
                                                    </Button>
                                                    {isAdmin && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                                            >
                                                                <Trash className="h-4 w-4" />
                                                                <span className="sr-only">
                                                                    Delete
                                                                </span>
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="h-24 text-center"
                                        >
                                            No tools found. Add some tools to
                                            get started.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="justify-between border-t px-6 py-4">
                    <div className="text-xs text-muted-foreground">
                        Showing {data?.tools?.length || 0} of {data?.total || 0}{' '}
                        total tools
                    </div>
                    <div className="space-x-2">
                        <Button variant="outline" size="sm" disabled>
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" disabled>
                            Next
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {/* View Tool Dialog */}
            <ToolDialog
                mode="view"
                open={isViewDialogOpen}
                onOpenChange={setIsViewDialogOpen}
                tool={selectedTool}
            />

            {/* Edit Tool Dialog */}
            <ToolDialog
                mode="edit"
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                tool={selectedTool}
            />

            {/* Add Tool Dialog */}
            <ToolDialog
                mode="add"
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
            />
        </div>
    );
}
