import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';

interface Column<T> {
  key: string;
  header: string;
  cell: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  rowKey: (item: T) => string;
  selectable?: boolean;
  selectedKeys?: string[];
  onSelectedKeysChange?: (keys: string[]) => void;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyMessage = 'Нет данных',
  onRowClick,
  rowKey,
  selectable,
  selectedKeys,
  onSelectedKeysChange,
}: DataTableProps<T>) {
  const isSelectable = Boolean(selectable && onSelectedKeysChange);
  const keys = data.map((item) => rowKey(item));
  const selectedSet = new Set(selectedKeys ?? []);
  const allSelected = isSelectable && keys.length > 0 && keys.every((key) => selectedSet.has(key));
  const someSelected = isSelectable && selectedSet.size > 0 && !allSelected;

  const toggleAll = (checked: boolean) => {
    if (!onSelectedKeysChange) return;
    onSelectedKeysChange(checked ? keys : []);
  };

  const toggleOne = (key: string, checked: boolean) => {
    if (!onSelectedKeysChange) return;
    const next = new Set(selectedSet);
    if (checked) {
      next.add(key);
    } else {
      next.delete(key);
    }
    onSelectedKeysChange(Array.from(next));
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {isSelectable && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={someSelected ? 'indeterminate' : allSelected}
                    onCheckedChange={(value) => toggleAll(Boolean(value))}
                    onClick={(event) => event.stopPropagation()}
                    aria-label="Выбрать все"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.key} className="font-semibold">
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {isSelectable && (
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    <Skeleton className="h-5 w-full max-w-[200px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border p-12 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            {isSelectable && (
              <TableHead className="w-10">
                <Checkbox
                  checked={someSelected ? 'indeterminate' : allSelected}
                  onCheckedChange={(value) => toggleAll(Boolean(value))}
                  onClick={(event) => event.stopPropagation()}
                  aria-label="Выбрать все"
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead key={column.key} className="font-semibold">
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={rowKey(item)}
              onClick={() => onRowClick?.(item)}
              className={onRowClick ? 'cursor-pointer table-row-hover' : 'table-row-hover'}
            >
              {isSelectable && (
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <Checkbox
                    checked={selectedSet.has(rowKey(item))}
                    onCheckedChange={(value) => toggleOne(rowKey(item), Boolean(value))}
                    aria-label="Выбрать строку"
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell key={column.key}>{column.cell(item)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
