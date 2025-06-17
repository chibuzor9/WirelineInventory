import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    HelpCircle,
    Package,
    Users,
    Activity,
    FileText,
    Settings,
} from 'lucide-react';

interface AboutModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function AboutModal({ open, onOpenChange }: AboutModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-6 w-6 text-halliburton-red" />
                        Wireline Inventory Management System
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 pb-4">
                    {/* Project Overview */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-neutral-800">
                            About This System
                        </h3>
                        <p className="text-neutral-600 leading-relaxed">
                            The Wireline Inventory Management System is a
                            comprehensive tool designed for tracking and
                            managing wireline equipment and tools. Built
                            specifically for oilfield operations, it provides
                            real-time visibility into tool status, location, and
                            maintenance requirements.
                        </p>
                    </div>
                    {/* Key Features */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-neutral-800">
                            Key Features
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex items-start gap-3">
                                <Package className="h-5 w-5 text-halliburton-red mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-neutral-800">
                                        Tool Management
                                    </h4>
                                    <p className="text-sm text-neutral-600">
                                        Add, edit, and track all wireline tools
                                        with detailed information
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Activity className="h-5 w-5 text-halliburton-red mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-neutral-800">
                                        Status Tracking
                                    </h4>
                                    <p className="text-sm text-neutral-600">
                                        Color-coded status system (Green,
                                        Yellow, Red) for quick identification
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Users className="h-5 w-5 text-halliburton-red mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-neutral-800">
                                        User Management
                                    </h4>
                                    <p className="text-sm text-neutral-600">
                                        Role-based access control with admin and
                                        user permissions
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <FileText className="h-5 w-5 text-halliburton-red mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-neutral-800">
                                        Activity Logging
                                    </h4>
                                    <p className="text-sm text-neutral-600">
                                        Complete audit trail of all changes and
                                        updates
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Status Legend */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-neutral-800">
                            Status Legend
                        </h3>{' '}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-tag-green/10 text-tag-green border-tag-green">
                                    <span className="inline-block w-2 h-2 rounded-full bg-tag-green mr-1.5"></span>
                                    Green
                                </Badge>
                                <span className="text-sm text-neutral-600">
                                    Tool is available and ready for use
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-tag-yellow/10 text-tag-yellow border-tag-yellow">
                                    <span className="inline-block w-2 h-2 rounded-full bg-tag-yellow mr-1.5"></span>
                                    Yellow
                                </Badge>
                                <span className="text-sm text-neutral-600">
                                    Tool needs attention or maintenance
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-tag-red/10 text-tag-red border-tag-red">
                                    <span className="inline-block w-2 h-2 rounded-full bg-tag-red mr-1.5"></span>
                                    Red
                                </Badge>
                                <span className="text-sm text-neutral-600">
                                    Tool is out of service or needs repair
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* User Permissions */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-neutral-800">
                            User Permissions
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <Settings className="h-5 w-5 text-halliburton-red mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-neutral-800">
                                        Admin Users
                                    </h4>
                                    <p className="text-sm text-neutral-600">
                                        Full access to create, edit, and delete
                                        tools. Can manage all tool properties.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Users className="h-5 w-5 text-halliburton-red mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-neutral-800">
                                        Regular Users
                                    </h4>
                                    <p className="text-sm text-neutral-600">
                                        Can update tool status and add comments.
                                        Cannot create new tools or modify core
                                        properties.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>{' '}
                    {/* System Info */}
                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between text-sm text-neutral-500">
                            <span>© 2025 Wireline Inventory System</span>
                            <span>Version 1.0.0</span>
                        </div>
                    </div>
                    {/* Close Button */}
                    <div className="flex justify-end pt-4 border-t">
                        <Button onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
