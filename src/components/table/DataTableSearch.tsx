import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface DataTableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilterClick?: () => void;
  showFilterButton?: boolean;
}

export const DataTableSearch: React.FC<DataTableSearchProps> = ({
  value,
  onChange,
  placeholder = 'Поиск...',
  onFilterClick,
  showFilterButton = true,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {showFilterButton && onFilterClick && (
        <Button variant="outline" size="icon" onClick={onFilterClick}>
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
