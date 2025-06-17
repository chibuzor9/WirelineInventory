import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { LogOut } from 'lucide-react';

export default function Sidebar() {
    const { user, logout, logoutState } = useAuth();
    const [location, setLocation] = useLocation();

    // Navigation items
    const navItems = [
        { name: 'Dashboard', icon: 'ri-dashboard-line', path: '/' },
        { name: 'Inventory', icon: 'ri-tools-line', path: '/inventory' },
        { name: 'Reports', icon: 'ri-file-list-3-line', path: '/reports' },
        { name: 'Activity Log', icon: 'ri-history-line', path: '/activity' },
    ];

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="flex flex-col h-full bg-white shadow-lg">
            {/* Logo and App Title */}
            <div className="p-4 border-b border-neutral-100">
                <div className="flex items-center justify-center">
                    <div className="bg-halliburton-red rounded-lg p-2 mr-2">
                        <i className="ri-stack-line text-white text-xl"></i>
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-halliburton-blue">
                            Halliburton
                        </h1>
                        <p className="text-xs text-neutral-500">
                            Inventory Management
                        </p>
                    </div>
                </div>
            </div>

            {/* User Profile */}
            <div className="p-4 border-b border-neutral-100">
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-800 font-semibold mr-3">
                        {user?.full_name
                            ?.split(' ')
                            .map((name: string) => name[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                    </div>
                    <div>
                        <p className="font-medium text-sm">{user?.full_name}</p>
                        <p className="text-xs text-neutral-500">{user?.role}</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
                <ul>
                    {navItems.map((item) => (
                        <li key={item.name} className="mb-1">
                            <Button
                                variant="ghost"
                                className={cn(
                                    'flex w-full items-center justify-start px-4 py-2 text-sm font-medium',
                                    location === item.path
                                        ? 'bg-neutral-100 text-halliburton-blue'
                                        : 'text-neutral-800 hover:bg-neutral-100',
                                )}
                                onClick={() => setLocation(item.path)}
                            >
                                <i
                                    className={cn(item.icon, 'mr-3 text-lg')}
                                ></i>
                                {item.name}
                            </Button>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-neutral-100">
                <Button
                    variant="ghost"
                    className="flex items-center text-sm text-neutral-800 hover:text-halliburton-red w-full justify-start"
                    onClick={handleLogout}
                    disabled={logoutState.isLoading}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                </Button>
            </div>
        </div>
    );
}
