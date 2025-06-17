import StatusCard from '@/components/status-card';
import ToolTable from '@/components/tool-table';
import RecentActivity from '@/components/recent-activity';
import ReportGenerator from '@/components/report-generator';
import { useQuery } from '@tanstack/react-query';
import { useRealtimeTools } from '@/hooks/use-realtime-tools';
import { Loader2 } from 'lucide-react';

type Stats = {
    red: number;
    yellow: number;
    green: number;
    white: number;
};

export default function DashboardPage() {
    // Enable real-time updates for tools
    useRealtimeTools();

    const { data: stats, isLoading: isStatsLoading } = useQuery<Stats>({
        queryKey: ['/api/stats'],
        queryFn: async () => {
            const response = await fetch('/api/stats');
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }
            return response.json();
        },
    });

    const { data: activitiesData, isLoading: isActivitiesLoading } = useQuery({
        queryKey: ['/api/activities'],
        queryFn: async () => {
            const response = await fetch('/api/activities');
            if (!response.ok) {
                throw new Error('Failed to fetch activities');
            }
            return response.json();
        },
    });

    return (
        <>
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {isStatsLoading ? (
                    <div className="col-span-2 flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-halliburton-red" />
                    </div>
                ) : (
                    <>
                        <StatusCard
                            title="Red"
                            count={stats?.red || 0}
                            icon="ri-error-warning-line"
                            type="red"
                        />

                        <StatusCard
                            title="Yellow"
                            count={stats?.yellow || 0}
                            icon="ri-alert-line"
                            type="yellow"
                        />

                        <StatusCard
                            title="Green"
                            count={stats?.green || 0}
                            icon="ri-checkbox-circle-line"
                            type="green"
                        />

                        <StatusCard
                            title="White"
                            count={stats?.white || 0}
                            icon="ri-file-list-3-line"
                            type="white"
                        />
                    </>
                )}
            </div>

            {/* Tool Table */}
            <ToolTable />

            {/* Activity and Report Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2">
                    <RecentActivity
                        activities={
                            Array.isArray(activitiesData) ? activitiesData : []
                        }
                        isLoading={isActivitiesLoading}
                    />
                </div>

                <div>
                    <ReportGenerator />
                </div>
            </div>
        </>
    );
}
