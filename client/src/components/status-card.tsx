interface StatusCardProps {
    title: string;
    count: number;
    change?: string;
    icon: string;
    type: 'red' | 'yellow' | 'green' | 'white';
}

export default function StatusCard({
    title,
    count,
    change,
    icon,
    type,
}: StatusCardProps) {
    const borderColors = {
        red: 'border-tag-red',
        yellow: 'border-tag-yellow',
        green: 'border-tag-green',
        white: 'border-gray-300',
    };

    const bgColors = {
        red: 'bg-tag-red/10',
        yellow: 'bg-tag-yellow/10',
        green: 'bg-tag-green/10',
        white: 'bg-tag-white/50',
    };

    const textColors = {
        red: 'text-tag-red',
        yellow: 'text-tag-yellow',
        green: 'text-tag-green',
        white: 'text-gray-700',
    };

    return (
        <div
            className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${borderColors[type]}`}
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-neutral-500 text-sm">{title}</p>
                    <p className="text-2xl font-semibold mt-1">{count}</p>
                    {change && (
                        <p className="text-xs text-neutral-500 mt-1">
                            {change}
                        </p>
                    )}
                </div>
                <div className={`p-2 ${bgColors[type]} rounded-full`}>
                    <i className={`${icon} ${textColors[type]} text-xl`}></i>
                </div>
            </div>
        </div>
    );
}
