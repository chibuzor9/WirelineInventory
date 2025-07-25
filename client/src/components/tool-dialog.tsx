import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Tool,
    insertToolSchema,
    toolTagSchema,
    toolCategorySchema,
} from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { SaveIcon, Loader2, Edit } from 'lucide-react';
import { z } from 'zod';

interface ToolDialogProps {
    mode: 'add' | 'edit' | 'view';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tool?: Tool | null;
}

// Create a form schema based on the insert schema
const toolFormSchema = z.object({
    toolId: z.string().min(3, 'Tool ID must be at least 3 characters'),
    name: z.string().min(3, 'Name must be at least 3 characters'),
    category: z.string().min(1, 'Category is required'),
    status: z.string().min(1, 'Status is required'),
    description: z.string().optional(),
    location: z.string().optional(),
    comment: z.string().optional(),
});

type ToolFormValues = z.infer<typeof toolFormSchema>;

export default function ToolDialog({
    mode,
    open,
    onOpenChange,
    tool,
}: ToolDialogProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const isViewMode = mode === 'view';
    const isEditMode = mode === 'edit';
    const isAddMode = mode === 'add';
    const isAdmin = user?.role === 'admin';
    const [originalStatus, setOriginalStatus] = useState<string>('');

    const form = useForm<ToolFormValues>({
        resolver: zodResolver(toolFormSchema),
        defaultValues: {
            toolId: '',
            name: '',
            category: '',
            description: '',
            status: 'green',
            location: '',
            comment: '',
        },
    });

    // Reset form when the dialog opens with a tool
    useEffect(() => {
        if (open && (isEditMode || isViewMode) && tool) {
            setOriginalStatus(tool.status);
            form.reset({
                toolId: tool.tool_id,
                name: tool.name,
                category: tool.category,
                description: tool.description || '',
                status: tool.status,
                location: tool.location || '',
                comment: '',
            });
        } else if (open && isAddMode) {
            setOriginalStatus('');
            form.reset({
                toolId: '',
                name: '',
                category: '',
                description: '',
                status: 'green',
                location: '',
                comment: '',
            });
        }
    }, [open, tool, isEditMode, isViewMode, isAddMode, form]);

    const createMutation = useMutation({
        mutationFn: async (data: ToolFormValues) => {
            const response = await apiRequest('POST', '/api/tools', {
                ...data,
                last_updated: new Date().toISOString(),
            });
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: 'Tool created',
                description: 'The tool has been created successfully.',
            });
            queryClient.invalidateQueries({ queryKey: ['/api/tools'] });
            queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
            queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
            onOpenChange(false);
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to create tool: ${error.message}`,
                variant: 'destructive',
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: ToolFormValues) => {
            if (!tool) return null;
            const payload = {
                ...data,
                last_updated: new Date().toISOString(),
                // Include comment and previous status for tag changes
                ...(data.status !== originalStatus && {
                    comment: data.comment || '',
                    previousStatus: originalStatus,
                }),
            };
            const response = await apiRequest(
                'PUT',
                `/api/tools/${tool.id}`,
                payload,
            );
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: 'Tool updated',
                description: 'The tool has been updated successfully.',
            });
            queryClient.invalidateQueries({ queryKey: ['/api/tools'] });
            queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
            queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
            onOpenChange(false);
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to update tool: ${error.message}`,
                variant: 'destructive',
            });
        },
    });

    const onSubmit = (data: ToolFormValues) => {
        if (isAddMode) {
            createMutation.mutate(data);
        } else if (isEditMode) {
            updateMutation.mutate(data);
        }
    };

    const renderStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            red: 'bg-tag-red/10 text-tag-red border-tag-red',
            yellow: 'bg-tag-yellow/10 text-tag-yellow border-tag-yellow',
            green: 'bg-tag-green/10 text-tag-green border-tag-green',
            white: 'bg-tag-white/50 text-gray-700 border-gray-300',
        };

        return (
            <Badge
                variant="outline"
                className={`${colors[status]} font-normal px-3 py-1`}
            >
                <span
                    className={`inline-block w-2 h-2 rounded-full bg-tag-${status} mr-1.5`}
                ></span>
                {`${status.charAt(0).toUpperCase() + status.slice(1)}`}
            </Badge>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md md:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {isViewMode
                            ? 'Tool Details'
                            : isEditMode
                              ? 'Edit Tool'
                              : 'Add New Tool'}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="toolId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tool ID</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter tool ID"
                                                {...field}
                                                value={field.value as string}
                                                disabled={
                                                    isViewMode || isEditMode
                                                } // Can't change tool ID once set
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter tool name"
                                                {...field}
                                                value={field.value as string}
                                                disabled={
                                                    isViewMode ||
                                                    (isEditMode && !isAdmin)
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <FormControl>
                                            {isViewMode ||
                                            (isEditMode && !isAdmin) ? (
                                                <Input
                                                    value={
                                                        (field.value as string) ||
                                                        ''
                                                    }
                                                    disabled
                                                />
                                            ) : (
                                                <Select
                                                    value={
                                                        field.value as string
                                                    }
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    disabled={
                                                        isViewMode ||
                                                        (isEditMode && !isAdmin)
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {toolCategorySchema.options.map(
                                                            (category) => (
                                                                <SelectItem
                                                                    key={
                                                                        category
                                                                    }
                                                                    value={
                                                                        category
                                                                    }
                                                                >
                                                                    {category}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <FormControl>
                                            {isViewMode ? (
                                                <div className="pt-2">
                                                    {renderStatusBadge(
                                                        field.value as string,
                                                    )}
                                                </div>
                                            ) : (
                                                <Select
                                                    value={
                                                        field.value as string
                                                    }
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    disabled={isViewMode}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {toolTagSchema.options.map(
                                                            (status) => (
                                                                <SelectItem
                                                                    key={status}
                                                                    value={
                                                                        status
                                                                    }
                                                                >
                                                                    {`${status.charAt(0).toUpperCase() + status.slice(1)}`}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Comment field - only show when editing and status might change */}
                        {isEditMode && (
                            <FormField
                                control={form.control}
                                name="comment"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Comment{' '}
                                            {form.watch('status') !==
                                                originalStatus &&
                                                '(for status change)'}
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={
                                                    form.watch('status') !==
                                                    originalStatus
                                                        ? 'Add a comment about this status change...'
                                                        : 'Add a comment about this update...'
                                                }
                                                className="min-h-[80px]"
                                                {...field}
                                                value={
                                                    (field.value as string) ||
                                                    ''
                                                }
                                                disabled={isViewMode}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter tool location"
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            name={field.name}
                                            ref={field.ref}
                                            value={
                                                (field.value as string) || ''
                                            }
                                            disabled={isViewMode}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter tool description"
                                            className="min-h-[100px]"
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            name={field.name}
                                            ref={field.ref}
                                            value={
                                                (field.value as string) || ''
                                            }
                                            disabled={
                                                isViewMode ||
                                                (isEditMode && !isAdmin)
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {isViewMode && tool && (
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <Label className="text-sm text-neutral-500">
                                        Last Updated
                                    </Label>
                                    <p className="text-sm font-medium">
                                        {new Date(
                                            tool.last_updated,
                                        ).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                {isViewMode ? 'Close' : 'Cancel'}
                            </Button>

                            {!isViewMode && (
                                <Button
                                    type="submit"
                                    disabled={
                                        createMutation.isPending ||
                                        updateMutation.isPending
                                    }
                                >
                                    {createMutation.isPending ||
                                    updateMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <SaveIcon className="h-4 w-4 mr-2" />
                                    )}
                                    {isAddMode ? 'Create Tool' : 'Save Changes'}
                                </Button>
                            )}

                            {isViewMode && (
                                <Button
                                    type="button"
                                    onClick={() => {
                                        onOpenChange(false);
                                    }}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Tool
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
