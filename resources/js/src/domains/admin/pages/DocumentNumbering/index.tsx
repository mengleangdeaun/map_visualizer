import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { DataTable } from '@/components/shared/system/DataTable';
import { SearchInput } from '@/components/shared/system/SearchInput';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { DeleteConfirmModal } from '@/components/shared/system/DeleteConfirmModal';
import { TableActionButtons, TableActionButton } from '@/components/shared/system/TableActionButtons';
import { Play, Settings2, Hash, FileText } from 'lucide-react';
import { DocumentNumberSetting } from '../../services/documentNumberingService';
import { useDocumentNumberSettings, useDeleteDocumentNumberSetting, useGenerateTestNumber } from '../../hooks/useDocumentNumbering';
import DocumentNumberingDialog from './components/DocumentNumberingDialog';

const DocumentNumberingPage = () => {
    const { t } = useTranslation('admin');
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounce(searchInput, 500);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSetting, setSelectedSetting] = useState<DocumentNumberSetting | undefined>(undefined);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [settingToDelete, setSettingToDelete] = useState<DocumentNumberSetting | undefined>(undefined);

    const { data: settingsData, isLoading, isFetching, refetch } = useDocumentNumberSettings({
        page,
        per_page: perPage,
        search: debouncedSearch
    });

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const handleSearchClear = () => {
        setSearchInput('');
    };

    const deleteMutation = useDeleteDocumentNumberSetting();
    const generateTestMutation = useGenerateTestNumber();

    const handleEdit = (setting: DocumentNumberSetting) => {
        setSelectedSetting(setting);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setSelectedSetting(undefined);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (setting: DocumentNumberSetting) => {
        setSettingToDelete(setting);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (settingToDelete) {
            await deleteMutation.mutateAsync(settingToDelete.id);
            setIsDeleteModalOpen(false);
            setSettingToDelete(undefined);
        }
    };

    const handleTestGenerate = async (setting: DocumentNumberSetting) => {
        await generateTestMutation.mutateAsync(setting.id);
    };

    const columns = useMemo<ColumnDef<DocumentNumberSetting>[]>(() => [
        {
            id: 'index',
            header: '#',
            cell: (info) => {
                const displayIndex = info.table.getSortedRowModel().flatRows.findIndex(row => row.id === info.row.id);
                return (
                    <div className="text-[10px] font-black text-muted-foreground/50 w-4">
                        {(page - 1) * perPage + displayIndex + 1}
                    </div>
                );
            },
        },
        {
            accessorKey: 'name',
            header: t('config_name', 'Configuration Name'),
            cell: ({ row }) => {
                const setting = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                            <Settings2 size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm leading-tight">{setting.name}</span>
                            <span className="text-[11px] text-muted-foreground leading-tight">
                                {setting.reset_frequency ? `${setting.reset_frequency} reset` : 'No reset schedule'}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'sequence_scope',
            header: t('scope', 'Scope'),
            cell: ({ row }) => {
                const scope = row.original.sequence_scope;
                if (!scope) return <span className="text-muted-foreground text-xs italic">{t('global', 'Global')}</span>;
                
                let scopeLabel = scope;
                let scopeColor = "bg-blue-500/10 text-blue-600 border-blue-500/20";
                
                if (scope === 'order') {
                    scopeLabel = t('scope_order', 'Order');
                    scopeColor = "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
                } else if (scope === 'tracking') {
                    scopeLabel = t('scope_tracking', 'Delivery Tracking');
                    scopeColor = "bg-purple-500/10 text-purple-600 border-purple-500/20";
                } else if (scope === 'task') {
                    scopeLabel = t('scope_task', 'Task Tracking');
                    scopeColor = "bg-amber-500/10 text-amber-600 border-amber-500/20";
                }

                return (
                    <Badge variant="outline" className={cn("text-[10px] font-semibold px-2 py-0.5 border capitalize", scopeColor)}>
                        {scopeLabel}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'template',
            header: t('template_format', 'Template Schema'),
            cell: ({ row }) => {
                const setting = row.original;
                return (
                    <div className="flex flex-col">
                        <code className="text-xs font-mono bg-muted/60 px-1.5 py-0.5 rounded border text-muted-foreground max-w-fit break-all">
                            {setting.template}
                        </code>
                    </div>
                );
            },
        },
        {
            accessorKey: 'next_number',
            header: t('next_number_status', 'Counter Status'),
            cell: ({ row }) => {
                const setting = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 font-mono text-xs font-bold bg-muted/50 border px-1.5 py-0.5 rounded shadow-sm text-foreground/80">
                            <Hash size={12} className="text-muted-foreground" />
                            {setting.next_number}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                            (padding: {setting.digit_padding})
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'status',
            header: t('status', 'Status'),
            cell: ({ row }) => {
                const isActive = row.original.is_active;
                return (
                    <Badge 
                        variant="outline" 
                        className={cn(
                            "capitalize text-[10px] font-semibold px-2 py-0 border",
                            isActive ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                        )}
                    >
                        {isActive ? t('active') : t('inactive')}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">{t('actions')}</div>,
            cell: ({ row }) => {
                const setting = row.original;
                return (
                    <div className="flex items-center justify-end gap-2">
                        {setting.is_active && (
                            <Button
                                size="xs"
                                variant="outline"
                                className="h-7 px-2 text-[10px] gap-1 hover:bg-primary/5 hover:text-primary transition-colors border-dashed"
                                onClick={() => handleTestGenerate(setting)}
                                disabled={generateTestMutation.isPending}
                            >
                                <Play size={10} className="fill-current text-primary" />
                                {t('test_run', 'Test Run')}
                            </Button>
                        )}
                        <TableActionButtons>
                            <TableActionButton 
                                variant="edit" 
                                onClick={() => handleEdit(setting)} 
                            />
                            <TableActionButton 
                                variant="delete" 
                                onClick={() => handleDeleteClick(setting)} 
                            />
                        </TableActionButtons>
                    </div>
                );
            },
        },
    ], [t, page, perPage, generateTestMutation.isPending]);

    return (
        <div>
            <PageHeader
                title={t('document_numbering', 'Document Numbering')}
                subtitle={t('manage_numbering_subtitle', 'Configure automated custom serial patterns per transaction scope.')}
                refreshAction={{
                    onClick: () => refetch(),
                    isFetching: isFetching
                }}
                primaryAction={{
                    label: t('add_numbering_config', 'Add Configuration'),
                    onClick: handleAdd
                }}
            />

            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b bg-muted/30">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 max-w-sm">
                            <SearchInput
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder={t('search_numbering_rules', 'Search by configuration name...')}
                                onClear={handleSearchClear}
                                isLoading={isFetching}
                            />
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={settingsData?.data || []}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    totalItems={settingsData?.total || 0}
                    currentPage={page}
                    pageSize={perPage}
                    pageCount={settingsData?.last_page || 1}
                    onPageChange={setPage}
                    onPageSizeChange={setPerPage}
                    searchQuery={debouncedSearch}
                    onEmptyAction={debouncedSearch ? handleSearchClear : handleAdd}
                    emptyActionLabel={debouncedSearch ? t('clear_search') : t('add_numbering_config')}
                />
            </div>

            {isFormOpen && (
                <DocumentNumberingDialog
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    setting={selectedSetting}
                />
            )}

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title={t('delete_numbering_title', 'Delete Numbering Configuration')}
                description={t('delete_numbering_desc', 'Are you sure you want to delete this configuration? Ongoing document numbers might revert to system legacy structures.')}
                isPending={deleteMutation.isPending}
            />
        </div>
    );
};

export default DocumentNumberingPage;
