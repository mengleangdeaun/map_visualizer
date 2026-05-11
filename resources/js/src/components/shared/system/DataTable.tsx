import React from 'react';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    SortingState,
    getFilteredRowModel,
} from '@tanstack/react-table';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { EmptyState } from './EmptyState';
import { 
    Pagination, 
    PaginationContent, 
    PaginationItem, 
    PaginationLink, 
    PaginationNext, 
    PaginationPrevious,
} from '@/components/ui/pagination';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { RotateCw, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    isLoading?: boolean;
    isFetching?: boolean;
    searchQuery?: string;
    searchColumn?: string;
    
    // Pagination & Metadata
    totalItems?: number;
    pageSize?: number;
    pageCount?: number;
    currentPage?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    onEmptyAction?: () => void;
    emptyActionLabel?: string;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    isLoading,
    isFetching,
    searchQuery,
    searchColumn,
    totalItems = 0,
    pageSize = 10,
    pageCount = 1,
    currentPage = 1,
    onPageChange,
    onPageSizeChange,
    onEmptyAction,
    emptyActionLabel,
}: DataTableProps<TData, TValue>) {
    const { t } = useTranslation();
    const [sorting, setSorting] = React.useState<SortingState>([]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            globalFilter: searchQuery,
        },
    });

    // Apply filter manually if searchQuery is provided
    React.useEffect(() => {
        if (searchColumn) {
            table.getColumn(searchColumn)?.setFilterValue(searchQuery || '');
        }
    }, [searchQuery, searchColumn, table]);

    const filteredRowsCount = table.getFilteredRowModel().rows.length;
    const isFiltered = searchQuery && searchQuery.trim().length > 0;
    
    // If filtered, we show the count of filtered items on current page
    // If not filtered, we show the server-side total
    const displayTotal = isFiltered ? filteredRowsCount : totalItems;
    
    const from = displayTotal === 0 ? 0 : (isFiltered ? 1 : Math.min((currentPage - 1) * pageSize + 1, displayTotal));
    const to = isFiltered ? filteredRowsCount : Math.min(currentPage * pageSize, displayTotal);
    const displayPageCount = isFiltered ? 1 : pageCount;

    return (
        <div className="w-full relative">
            {/* Running Light Progress Bar */}
            <div className={cn(
                "absolute top-0 left-0 right-0 h-[2px] overflow-hidden z-20 transition-all duration-500",
                isFetching ? "opacity-100" : "opacity-0 invisible"
            )}>
                <div className="h-full bg-primary w-full animate-infinite-loading origin-left" />
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/30">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-border/50">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="h-10 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 px-6">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                <TableBody className={cn(
                    "relative transition-opacity duration-500",
                    isFetching ? "opacity-40 pointer-events-none" : "opacity-100"
                )}>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3 opacity-60">
                                        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('loading')}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} className="hover:bg-muted/20 transition-colors border-b border-border/30 group">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-4 px-6 text-sm">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-96 text-center border-none hover:bg-transparent">
                                    <EmptyState 
                                        type={searchQuery ? 'no-results' : 'no-data'}
                                        onAction={onEmptyAction}
                                        actionLabel={emptyActionLabel}
                                    />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination & Controls */}
            <div className="px-6 py-4 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Item Counts */}
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {t('showing')} <span className="text-foreground">{from}</span> - <span className="text-foreground">{to}</span> {t('of')} <span className="text-foreground">{displayTotal}</span>
                </div>

                {/* Pagination (Using official UI Component) */}
                <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious 
                                href="#" 
                                text={t('previous')}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (currentPage > 1) onPageChange?.(currentPage - 1);
                                }}
                                className={cn(currentPage <= 1 && "pointer-events-none opacity-50")}
                            />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.min(3, displayPageCount) }, (_, i) => {
                            const pageNumber = i + 1;
                            return (
                                <PaginationItem key={pageNumber}>
                                    <PaginationLink 
                                        href="#" 
                                        isActive={currentPage === pageNumber}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onPageChange?.(pageNumber);
                                        }}
                                        className="size-8 text-xs font-bold"
                                    >
                                        {pageNumber}
                                    </PaginationLink>
                                </PaginationItem>
                            );
                        })}

                        <PaginationItem>
                            <PaginationNext 
                                href="#" 
                                text={t('next')}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (currentPage < displayPageCount) onPageChange?.(currentPage + 1);
                                }}
                                className={cn((currentPage >= displayPageCount || isFiltered) && "pointer-events-none opacity-50")}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>

                {/* Page Size */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">{t('per_page')}</span>
                    <Select
                        value={pageSize.toString()}
                        onValueChange={(value) => onPageSizeChange?.(Number(value))}
                        disabled={isLoading}
                    >
                        <SelectTrigger className="h-8 w-[70px] text-[10px] font-bold bg-muted/20 border-border/40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card/95 backdrop-blur-md">
                            {[10, 20, 50, 100].map((size) => (
                                <SelectItem key={size} value={size.toString()} className="text-[10px] font-bold">
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
