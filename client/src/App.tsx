import { Switch, Route } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import NotFound from '@/pages/not-found';
import { ProtectedRoute } from './lib/protected-route';
import DashboardPage from '@/pages/dashboard-page';
import InventoryPage from '@/pages/inventory-page';
import ReportsPage from '@/pages/reports-page';
import MaintenancePage from '@/pages/maintenance-page';
import ActivityPage from '@/pages/activity-page';
import AuthPage from '@/pages/auth-page';
import { AuthProvider } from '@/hooks/use-auth';
import AppLayout from '@/components/layouts/app-layout';

function Router() {
    return (
        <Switch>
            <Route path="/auth" component={AuthPage} />

            <Route path="/">
                <AppLayout>
                    <ProtectedRoute path="/" component={DashboardPage} />
                </AppLayout>
            </Route>

            <Route path="/inventory">
                <AppLayout>
                    <ProtectedRoute
                        path="/inventory"
                        component={InventoryPage}
                    />
                </AppLayout>
            </Route>

            <Route path="/reports">
                <AppLayout>
                    <ProtectedRoute path="/reports" component={ReportsPage} />
                </AppLayout>
            </Route>

            <Route path="/maintenance">
                <AppLayout>
                    <ProtectedRoute
                        path="/maintenance"
                        component={MaintenancePage}
                    />
                </AppLayout>
            </Route>

            <Route path="/activity">
                <AppLayout>
                    <ProtectedRoute path="/activity" component={ActivityPage} />
                </AppLayout>
            </Route>

            <Route component={NotFound} />
        </Switch>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Router />
                <Toaster />
            </AuthProvider>
        </QueryClientProvider>
    );
}

export default App;
