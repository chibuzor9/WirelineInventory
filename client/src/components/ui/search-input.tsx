import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchInputProps {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    onSearchClick?: () => void;
    className?: string;
    iconClassName?: string;
}

export default function SearchInput({
    placeholder = 'Search...',
    value = '',
    onChange,
    onKeyDown,
    onSearchClick,
    className = '',
    iconClassName = '',
}: SearchInputProps) {
    return (
        <div className={cn('relative', className)}>
            <Input
                type="text"
                placeholder={placeholder}
                className="pl-10 pr-4 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-halliburton-blue focus:ring-halliburton-blue/20 focus:ring-2 focus:bg-white"
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                onKeyDown={onKeyDown}
            />{' '}
            <button
                onClick={onSearchClick}
                className={cn(
                    'absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 cursor-pointer transition-colors',
                    iconClassName,
                )}
                type="button"
                title="Search"
                aria-label="Search"
            >
                <Search className="h-4 w-4" />
            </button>
        </div>
    );
}
