import React, { useState } from 'react';
import { useLocation } from 'wouter';
import Sidebar from '@/components/sidebar';
import SearchInput from '@/components/ui/search-input';
import AboutModal from '@/components/about-modal';
import NotificationModal from '@/components/notification-modal';
import { Menu, BellRing, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [isNotificationModalOpen, setIsNotificationModalOpen] =
        useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [location, setLocation] = useLocation();

    const handleSearch = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchValue.trim()) {
            // Navigate to inventory page with search parameter
            setLocation(
                `/inventory?search=${encodeURIComponent(searchValue.trim())}`,
            );
        }
    };

    const handleSearchSubmit = () => {
        if (searchValue.trim()) {
            setLocation(
                `/inventory?search=${encodeURIComponent(searchValue.trim())}`,
            );
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Mobile sidebar toggle */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Button
                    variant="outline"
                    size="icon"
                    className="bg-white rounded-md shadow-md text-neutral-800"
                    onClick={() => setIsMobileSidebarOpen(true)}
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </div>

            {/* Mobile sidebar */}
            <Sheet
                open={isMobileSidebarOpen}
                onOpenChange={setIsMobileSidebarOpen}
            >
                <SheetContent side="left" className="p-0 w-64">
                    <Sidebar />
                </SheetContent>
            </Sheet>

            {/* Desktop sidebar */}
            <div className="hidden lg:block w-64 h-full">
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navigation */}
                <header className="bg-white shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl font-semibold text-neutral-800 truncate">
                                Inventory Dashboard
                            </h1>
                            <p className="text-xs sm:text-sm text-neutral-500">
                                Manage your tools and equipment
                            </p>
                        </div>

                        {/* Search Bar - Desktop */}
                        <div className="hidden lg:block">
                            <SearchInput
                                placeholder="Search inventory..."
                                value={searchValue}
                                onChange={setSearchValue}
                                onKeyDown={handleSearch}
                                onSearchClick={handleSearchSubmit}
                                className="w-64"
                            />
                        </div>

                        {/* Notification and Help */}
                        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative h-8 w-8 sm:h-10 sm:w-10"
                                onClick={() => setIsNotificationModalOpen(true)}
                                title="Notifications"
                            >
                                <BellRing className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-800" />
                                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2 h-2 bg-halliburton-red rounded-full"></span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hidden sm:flex h-8 w-8 sm:h-10 sm:w-10"
                                onClick={() => setIsAboutModalOpen(true)}
                                title="About this system"
                            >
                                <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-800" />
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Search */}
                    <div className="p-2 border-t border-neutral-100 lg:hidden">
                        <SearchInput
                            placeholder="Search inventory..."
                            value={searchValue}
                            onChange={setSearchValue}
                            onKeyDown={handleSearch}
                            onSearchClick={handleSearchSubmit}
                            className="w-full"
                        />
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-neutral-50">
                    {children}
                </main>
            </div>

            {/* About Modal */}
            <AboutModal
                open={isAboutModalOpen}
                onOpenChange={setIsAboutModalOpen}
            />

            {/* Notification Modal */}
            <NotificationModal
                open={isNotificationModalOpen}
                onOpenChange={setIsNotificationModalOpen}
            />
        </div>
    );
}
