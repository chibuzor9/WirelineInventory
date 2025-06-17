import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ReportType, ToolTag } from '@shared/schema';

export default function ReportGenerator() {
    const { toast } = useToast();

    const [reportType, setReportType] = useState<ReportType>('tag-status');
    const [tags, setTags] = useState<ToolTag[]>(['red', 'yellow']);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [format, setFormat] = useState<string>('pdf');

    const reportMutation = useMutation({
        mutationFn: async () => {
            const response = await apiRequest('POST', '/api/reports', {
                reportType,
                tags,
                startDate,
                endDate,
                format,
            });
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: 'Report generated',
                description: 'Your report has been generated successfully.',
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

    const handleTagChange = (tag: ToolTag, checked: boolean) => {
        if (checked) {
            setTags([...tags, tag]);
        } else {
            setTags(tags.filter((t) => t !== tag));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        reportMutation.mutate();
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle>Generate Report</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="report-type">Report Type</Label>
                        <Select
                            value={reportType}
                            onValueChange={(value) =>
                                setReportType(value as ReportType)
                            }
                        >
                            <SelectTrigger id="report-type" className="w-full">
                                <SelectValue placeholder="Select report type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tag-status">
                                    Tag Status Report
                                </SelectItem>
                                <SelectItem value="maintenance">
                                    Maintenance Report
                                </SelectItem>
                                <SelectItem value="inventory">
                                    Inventory Summary
                                </SelectItem>
                                <SelectItem value="activity">
                                    Activity Log
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Tag Filter</Label>
                        <div className="flex flex-wrap gap-2">
                            <div className="flex items-center space-x-2 bg-white border border-neutral-200 rounded-lg p-2">
                                <Checkbox
                                    id="tag-red"
                                    checked={tags.includes('red')}
                                    onCheckedChange={(checked) =>
                                        handleTagChange(
                                            'red',
                                            checked as boolean,
                                        )
                                    }
                                />
                                <Label
                                    htmlFor="tag-red"
                                    className="flex items-center cursor-pointer"
                                >
                                    <span className="h-2 w-2 rounded-full bg-tag-red mr-1.5"></span>
                                    Red Tags
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2 bg-white border border-neutral-200 rounded-lg p-2">
                                <Checkbox
                                    id="tag-yellow"
                                    checked={tags.includes('yellow')}
                                    onCheckedChange={(checked) =>
                                        handleTagChange(
                                            'yellow',
                                            checked as boolean,
                                        )
                                    }
                                />
                                <Label
                                    htmlFor="tag-yellow"
                                    className="flex items-center cursor-pointer"
                                >
                                    <span className="h-2 w-2 rounded-full bg-tag-yellow mr-1.5"></span>
                                    Yellow Tags
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2 bg-white border border-neutral-200 rounded-lg p-2">
                                <Checkbox
                                    id="tag-green"
                                    checked={tags.includes('green')}
                                    onCheckedChange={(checked) =>
                                        handleTagChange(
                                            'green',
                                            checked as boolean,
                                        )
                                    }
                                />
                                <Label
                                    htmlFor="tag-green"
                                    className="flex items-center cursor-pointer"
                                >
                                    <span className="h-2 w-2 rounded-full bg-tag-green mr-1.5"></span>
                                    Green Tags
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2 bg-white border border-neutral-200 rounded-lg p-2">
                                <Checkbox
                                    id="tag-white"
                                    checked={tags.includes('white')}
                                    onCheckedChange={(checked) =>
                                        handleTagChange(
                                            'white',
                                            checked as boolean,
                                        )
                                    }
                                />
                                <Label
                                    htmlFor="tag-white"
                                    className="flex items-center cursor-pointer"
                                >
                                    <span className="h-2 w-2 rounded-full bg-gray-300 mr-1.5"></span>
                                    White Tags
                                </Label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Date Range</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Format</Label>
                        <RadioGroup
                            value={format}
                            onValueChange={setFormat}
                            className="flex space-x-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="pdf" id="pdf" />
                                <Label htmlFor="pdf">PDF</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="excel" id="excel" />
                                <Label htmlFor="excel">Excel</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="csv" id="csv" />
                                <Label htmlFor="csv">CSV</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-halliburton-red hover:bg-halliburton-red/90"
                        disabled={reportMutation.isPending}
                    >
                        {reportMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Download className="h-4 w-4 mr-2" />
                        )}
                        Generate Report
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
