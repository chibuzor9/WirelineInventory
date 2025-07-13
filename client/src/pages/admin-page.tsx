import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Separator } from '../components/ui/separator';
import { toast } from '../hooks/use-toast';
import { Shield, UserPlus, Users, Trash2, RefreshCw, Settings, Clock, Mail, UserCheck } from 'lucide-react';

interface User {
    id: string;
    username: string;
    full_name: string;
    email: string;
    role: string;
    status: number;
    created_at: string;
    deletion_scheduled_at?: string;
    isScheduledForDeletion: boolean;
    daysToDeletion?: number;
}

interface CleanupStatus {
    cleanupService: {
        isRunning: boolean;
        nextRunTime: Date | null;
    };
    scheduledUsers: Array<{
        id: string;
        username: string;
        email: string;
        deletion_scheduled_at: string;
        daysRemaining: number;
    }>;
}

export default function AdminPage() {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        full_name: '',
        email: '',
        role: 'user'
    });
    const queryClient = useQueryClient();

    // Fetch all users
    const { data: users = [], isLoading, error } = useQuery<User[]>({
        queryKey: ['admin', 'users'],
        queryFn: async () => {
            const response = await fetch('/api/admin/users', {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            return response.json();
        }
    });

    // Fetch cleanup status
    const { data: cleanupStatus } = useQuery<CleanupStatus>({
        queryKey: ['admin', 'cleanup', 'status'],
        queryFn: async () => {
            const response = await fetch('/api/admin/cleanup/status', {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to fetch cleanup status');
            }
            return response.json();
        },
        refetchInterval: 30000 // Refresh every 30 seconds
    });

    // Create user mutation
    const createUserMutation = useMutation({
        mutationFn: async (userData: typeof newUser) => {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(userData)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create user');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            setShowCreateDialog(false);
            setNewUser({ username: '', password: '', full_name: '', email: '', role: 'user' });
            toast({ title: 'Success', description: 'User created successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    // Delete user mutation
    const deleteUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to schedule user deletion');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'cleanup', 'status'] });
            toast({ title: 'Success', description: 'User scheduled for deletion in 30 days' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    // Restore user mutation
    const restoreUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            const response = await fetch(`/api/admin/users/${userId}/restore`, {
                method: 'PUT',
                credentials: 'include'
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to restore user');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'cleanup', 'status'] });
            toast({ title: 'Success', description: 'User restored successfully' });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    // Manual cleanup mutation
    const manualCleanupMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/admin/cleanup/run', {
                method: 'POST',
                credentials: 'include'
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to run cleanup');
            }
            return response.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'cleanup', 'status'] });
            toast({ 
                title: 'Cleanup Complete', 
                description: `Deleted: ${data.deletedUsers} users, Reminders sent: ${data.remindersSent}` 
            });
        },
        onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        createUserMutation.mutate(newUser);
    };

    const getUserStatusBadge = (user: User) => {
        if (user.isScheduledForDeletion) {
            return (
                <Badge variant="destructive" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {user.daysToDeletion !== undefined && user.daysToDeletion > 0 
                        ? `${user.daysToDeletion} days` 
                        : 'Pending deletion'}
                </Badge>
            );
        }
        if (user.status === 0) {
            return <Badge variant="secondary">Inactive</Badge>;
        }
        return <Badge variant="default">Active</Badge>;
    };

    const getRoleBadge = (role: string) => {
        return role === 'admin' ? (
            <Badge variant="default" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Admin
            </Badge>
        ) : (
            <Badge variant="outline">User</Badge>
        );
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading users</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">
                        Manage system users, roles, and scheduled deletions
                    </p>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                            <DialogDescription>
                                Add a new user to the system
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        value={newUser.username}
                                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <Input
                                        id="full_name"
                                        value={newUser.full_name}
                                        onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="role">Role</Label>
                                    <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createUserMutation.isPending}>
                                    {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Cleanup Status Card */}
            {cleanupStatus && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Cleanup Service Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                                <Badge variant={cleanupStatus.cleanupService.isRunning ? "default" : "destructive"}>
                                    {cleanupStatus.cleanupService.isRunning ? "Running" : "Stopped"}
                                </Badge>
                                <span className="text-sm text-muted-foreground">Service Status</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">{cleanupStatus.scheduledUsers.length}</span>
                                <span className="text-sm text-muted-foreground">Users scheduled for deletion</span>
                            </div>
                            <div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => manualCleanupMutation.mutate()}
                                    disabled={manualCleanupMutation.isPending}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${manualCleanupMutation.isPending ? 'animate-spin' : ''}`} />
                                    Run Cleanup
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        All Users ({users.length})
                    </CardTitle>
                    <CardDescription>
                        Manage user accounts and view deletion schedules
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{user.full_name}</div>
                                            <div className="text-sm text-muted-foreground">@{user.username}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            {user.email}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                                    <TableCell>{getUserStatusBadge(user)}</TableCell>
                                    <TableCell>
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {user.isScheduledForDeletion ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => restoreUserMutation.mutate(user.id)}
                                                    disabled={restoreUserMutation.isPending}
                                                    className="flex items-center gap-1"
                                                >
                                                    <UserCheck className="h-3 w-3" />
                                                    Restore
                                                </Button>
                                            ) : user.role !== 'admin' ? (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                            Delete
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Schedule User Deletion</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will schedule {user.full_name} ({user.username}) for deletion in 30 days. 
                                                                They will receive an email notification and can contact an admin to restore their account.
                                                                <br /><br />
                                                                Are you sure you want to proceed?
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => deleteUserMutation.mutate(user.id)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Schedule Deletion
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Admin account</span>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}