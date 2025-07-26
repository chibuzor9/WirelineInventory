import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRealtimeTools } from '@/hooks/use-realtime-tools';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
    Tool,
    ToolTag,
    toolTagSchema,
    toolCategorySchema,
} from '@shared/schema';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
    Eye,
    Edit,
    Trash,
    Plus,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import ToolDialog from '@/components/tool-dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ToolTable() {
    // Enable real-time updates for tools
    useRealtimeTools();

    const { toast } = useToast();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [page, setPage] = useState(1);
    const [limit] = useState(5);
    const [statusFilter, setStatusFilter] = useState<string>('all_tags');
    const [categoryFilter, setCategoryFilter] =
        useState<string>('all_categories');

    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['/api/tools', page, limit, statusFilter, categoryFilter],
        queryFn: async () => {
            const queryParams = new URLSearchParams();
            queryParams.append('page', page.toString());
            queryParams.append('limit', limit.toString());

            if (statusFilter && statusFilter !== 'all_tags') {
                queryParams.append('status', statusFilter);
            }

            if (categoryFilter && categoryFilter !== 'all_categories') {
                queryParams.append('category', categoryFilter);
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

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest('DELETE', `/api/tools/${id}`);
        },
        onSuccess: () => {
            toast({
                title: 'Tool deleted',
                description: 'The tool has been successfully deleted.',
            });
            queryClient.invalidateQueries({ queryKey: ['/api/tools'] });
            queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
            queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
            setIsDeleteDialogOpen(false);
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to delete tool: ${error.message}`,
                variant: 'destructive',
            });
        },
    });

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleViewTool = (tool: Tool) => {
        setSelectedTool(tool);
        setIsViewDialogOpen(true);
    };

    const handleEditTool = (tool: Tool) => {
        setSelectedTool(tool);
        setIsEditDialogOpen(true);
    };

    const handleDeleteTool = (tool: Tool) => {
        setSelectedTool(tool);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (selectedTool) {
            deleteMutation.mutate(selectedTool.id);
        }
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
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm mb-6">
                <div className="p-3 sm:p-4 border-b border-neutral-100">
                    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3 sm:gap-4">
                        <h2 className="text-base sm:text-lg font-semibold">
                            Tool Inventory
                        </h2>

                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
                            {/* Status Filter */}
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="w-full sm:w-[140px] lg:w-[150px]">
                                    <SelectValue placeholder="All Tags" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all_tags">
                                        All Tags
                                    </SelectItem>
                                    {toolTagSchema.options.map((tag) => (
                                        <SelectItem
                                            key={tag}
                                            value={tag}
                                        >{`${tag.charAt(0).toUpperCase() + tag.slice(1)} Tagged`}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Category Filter */}
                            <Select
                                value={categoryFilter}
                                onValueChange={setCategoryFilter}
                            >
                                <SelectTrigger className="w-full sm:w-[140px] lg:w-[180px]">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all_categories">
                                        All Categories
                                    </SelectItem>
                                    {toolCategorySchema.options.map(
                                        (category) => (
                                            <SelectItem
                                                key={category}
                                                value={category}
                                            >
                                                {category}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>

                            {/* Add Tool Button */}
                            {isAdmin && (
                                <Button
                                    className="bg-halliburton-red hover:bg-halliburton-red/90 w-full sm:w-auto"
                                    onClick={() => setIsAddDialogOpen(true)}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">Add Tool</span>
                                    <span className="sm:hidden">Add</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tool Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-neutral-50">
                            <TableRow>
                                <TableHead className="text-neutral-500 uppercase text-xs">
                                    Tool ID
                                </TableHead>
                                <TableHead className="text-neutral-500 uppercase text-xs">
                                    Name
                                </TableHead>
                                <TableHead className="text-neutral-500 uppercase text-xs">
                                    Category
                                </TableHead>
                                <TableHead className="text-neutral-500 uppercase text-xs">
                                    Status
                                </TableHead>
                                <TableHead className="text-neutral-500 uppercase text-xs">
                                    Last Updated
                                </TableHead>
                                <TableHead className="text-neutral-500 uppercase text-xs">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                // Skeleton loader rows
                                Array.from({ length: limit }).map(
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
                                                <Skeleton className="h-5 w-20" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-5 w-24" />
                                            </TableCell>
                                        </TableRow>
                                    ),
                                )
                            ) : data?.tools?.length > 0 ? (
                                data.tools.map((tool: Tool) => (
                                    <TableRow
                                        key={tool.id}
                                        className="hover:bg-neutral-50"
                                    >
                                        <TableCell className="font-medium">
                                            {tool.tool_id}
                                        </TableCell>
                                        <TableCell>{tool.name}</TableCell>
                                        <TableCell className="text-neutral-500">
                                            {tool.category}
                                        </TableCell>
                                        <TableCell>
                                            {renderTagBadge(
                                                tool.status as ToolTag,
                                            )}
                                        </TableCell>
                                        <TableCell className="text-neutral-500">
                                            {formatDate(tool.last_updated)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-neutral-500 hover:text-halliburton-blue"
                                                    onClick={() =>
                                                        handleViewTool(tool)
                                                    }
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {isAdmin && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-neutral-500 hover:text-halliburton-blue"
                                                            onClick={() =>
                                                                handleEditTool(tool)
                                                            }
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-neutral-500 hover:text-red-500"
                                                            onClick={() =>
                                                                handleDeleteTool(tool)
                                                            }
                                                        >
                                                            <Trash className="h-4 w-4" />
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
                                        colSpan={6}
                                        className="text-center py-6 text-neutral-500"
                                    >
                                        No tools found. Add some tools to get
                                        started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {!isLoading && data?.total > 0 && (
                    <div className="px-3 sm:px-4 py-3 flex items-center justify-between border-t border-neutral-100 sm:px-6">
                        <div className="hidden lg:flex-1 lg:flex lg:items-center lg:justify-between">
                            <div>
                                <p className="text-sm text-neutral-500">
                                    Showing{' '}
                                    <span className="font-medium">
                                        {(page - 1) * limit + 1}
                                    </span>{' '}
                                    to{' '}
                                    <span className="font-medium">
                                        {Math.min(page * limit, data.total)}
                                    </span>{' '}
                                    of{' '}
                                    <span className="font-medium">
                                        {data.total}
                                    </span>{' '}
                                    results
                                </p>
                            </div>
                            <div>
                                <nav
                                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                                    aria-label="Pagination"
                                >
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="rounded-l-md"
                                        onClick={() =>
                                            handlePageChange(page - 1)
                                        }
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>

                                    {Array.from({
                                        length: Math.min(
                                            3,
                                            Math.ceil(data.total / limit),
                                        ),
                                    }).map((_, i) => (
                                        <Button
                                            key={i}
                                            variant={
                                                page === i + 1
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            className={
                                                page === i + 1
                                                    ? 'bg-halliburton-red text-white'
                                                    : ''
                                            }
                                            onClick={() =>
                                                handlePageChange(i + 1)
                                            }
                                        >
                                            {i + 1}
                                        </Button>
                                    ))}

                                    {Math.ceil(data.total / limit) > 3 && (
                                        <>
                                            <Button variant="outline" disabled>
                                                ...
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    handlePageChange(
                                                        Math.ceil(
                                                            data.total / limit,
                                                        ),
                                                    )
                                                }
                                            >
                                                {Math.ceil(data.total / limit)}
                                            </Button>
                                        </>
                                    )}

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="rounded-r-md"
                                        onClick={() =>
                                            handlePageChange(page + 1)
                                        }
                                        disabled={
                                            page >=
                                            Math.ceil(data.total / limit)
                                        }
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </nav>
                            </div>
                        </div>

                        {/* Mobile Pagination */}
                        <div className="flex items-center justify-between lg:hidden w-full">
                            <Button
                                variant="outline"
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1}
                                size="sm"
                            >
                                Previous
                            </Button>
                            <div className="text-sm text-neutral-500">
                                Page <span className="font-medium">{page}</span>{' '}
                                of{' '}
                                <span className="font-medium">
                                    {Math.ceil(data.total / limit)}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page >= Math.ceil(data.total / limit)}
                                size="sm"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

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

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the tool{' '}
                            {selectedTool?.name} ({selectedTool?.tool_id}). This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={confirmDelete}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending
                                ? 'Deleting...'
                                : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
