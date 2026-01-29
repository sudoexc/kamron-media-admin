import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';

interface DataTableActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

export const DataTableActions: React.FC<DataTableActionsProps> = ({
  onEdit,
  onDelete,
  onView,
}) => {
  const stop = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const handleMenuClick =
    (handler?: () => void) => (event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      handler?.();
    };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={stop}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        {onView && (
          <DropdownMenuItem onClick={handleMenuClick(onView)}>
            <Eye className="mr-2 h-4 w-4" />
            Просмотр
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={handleMenuClick(onEdit)}>
            <Pencil className="mr-2 h-4 w-4" />
            Редактировать
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem
            onClick={handleMenuClick(onDelete)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Удалить
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
