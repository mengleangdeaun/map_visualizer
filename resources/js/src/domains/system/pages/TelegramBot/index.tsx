import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompanies } from '../Company/hooks/useCompanies';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { DataTable } from '@/components/shared/system/DataTable';
import { SearchInput } from '@/components/shared/system/SearchInput';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HighlightSearch } from '@/components/shared/system/HighlightSearch';
import { ColumnDef } from '@tanstack/react-table';
import { Send, Settings, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Company } from '../../services/companyService';
import { TelegramConfigModal } from './components/TelegramConfigModal';

const TelegramBotPage = () => {
    const { t } = useTranslation('system');
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounce(searchInput, 500);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const { data: companiesData, isLoading, isFetching, refetch } = useCompanies(page, perPage, debouncedSearch);

    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const handleSearchClear = () => {
        setSearchInput('');
    };

    const handleConfigureClick = (company: Company) => {
        setSelectedCompany(company);
        setIsConfigOpen(true);
    };

    const columns = useMemo<ColumnDef<Company>[]>(() => [
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
            header: t('company'),
            cell: ({ row }) => {
                const company = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-primary/10">
                            <AvatarImage src={company.logo_full_url || company.logo_url || ''} alt={company.name} className="object-cover" />
                            <AvatarFallback className="text-primary font-bold">
                                {company.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <HighlightSearch 
                                text={company.name} 
                                query={debouncedSearch} 
                                className="font-bold text-foreground leading-tight"
                            />
                            <span className="text-[10px] text-muted-foreground font-mono">
                                {company.slug}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'telegram_status',
            header: 'Bot Configuration',
            cell: () => {
                return (
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 flex items-center gap-1 text-[10px]">
                            <Send size={10} />
                            Custom Bot Support
                        </Badge>
                    </div>
                );
            },
        },
        {
            id: 'connection_status',
            header: 'Connection Status',
            cell: ({ row }) => {
                const company = row.original;
                const settings = company.telegram_settings || company.telegramSettings;
                
                const hasToken = !!settings?.bot_token;
                const hasChatId = !!settings?.company_chat_id;
                const botName = settings?.bot_name;
                const botUsername = settings?.bot_username;
                
                if (hasToken && hasChatId) {
                    return (
                        <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm">
                                <CheckCircle2 size={11} className="text-emerald-500" />
                                Connected
                            </span>
                            {botUsername && (
                                <span className="text-[10px] text-muted-foreground font-medium leading-none pl-0.5">
                                    {botName || 'Bot'}: <span className="font-mono text-primary font-bold">@{botUsername}</span>
                                </span>
                            )}
                        </div>
                    );
                }
                
                if (hasToken || hasChatId) {
                    return (
                        <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-sm">
                                <AlertCircle size={11} className="text-amber-500" />
                                Pending Setup
                            </span>
                            {botUsername && (
                                <span className="text-[10px] text-muted-foreground font-medium leading-none pl-0.5">
                                    {botName || 'Bot'}: <span className="font-mono text-primary font-bold">@{botUsername}</span>
                                </span>
                            )}
                        </div>
                    );
                }

                return (
                    <div className="flex items-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted/30 text-muted-foreground border border-muted shadow-sm">
                            <XCircle size={11} className="text-muted-foreground/60" />
                            Not Connected Yet
                        </span>
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const company = row.original;
                return (
                    <div className="text-right">
                        <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-primary/5 text-primary hover:bg-primary/10 border-primary/20 font-bold flex items-center gap-1.5 ml-auto"
                            onClick={() => handleConfigureClick(company)}
                        >
                            <Settings size={14} />
                            Configure Bot
                        </Button>
                    </div>
                );
            },
        },
    ], [page, perPage, debouncedSearch, t]);

    return (
        <div>
            <PageHeader 
                title="Telegram Bot Integration" 
                subtitle="Configure company-specific notification bots, custom channels, and delivery triggers."
                refreshAction={{
                    onClick: () => refetch(),
                    isFetching: isFetching
                }}
            />

            <div className="bg-card border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                <div className="p-4 border-b bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 max-w-sm">
                        <SearchInput
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search client companies..."
                            onClear={handleSearchClear}
                            isLoading={isFetching}
                        />
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={companiesData?.data || []}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    totalItems={companiesData?.total || 0}
                    currentPage={page}
                    pageSize={perPage}
                    pageCount={companiesData?.last_page || 1}
                    onPageChange={setPage}
                    onPageSizeChange={setPerPage}
                    searchQuery={debouncedSearch}
                    onEmptyAction={handleSearchClear}
                    emptyActionLabel="Clear Search Filter"
                />
            </div>

            {isConfigOpen && selectedCompany && (
                <TelegramConfigModal 
                    open={isConfigOpen}
                    onOpenChange={setIsConfigOpen}
                    company={selectedCompany}
                />
            )}
        </div>
    );
};

export default TelegramBotPage;
