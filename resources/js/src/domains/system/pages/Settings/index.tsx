import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from '@tanstack/react-router';
import { toast } from 'sonner';
import { 
    Settings, 
    Globe, 
    Sliders, 
    RefreshCw, 
    TrendingUp, 
    Database, 
    Check, 
    Loader2, 
    AlertCircle,
    Server,
    Building2,
    Pencil,
    History
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { 
    Tabs, 
    TabsContent, 
    TabsList, 
    TabsTrigger 
} from '@/components/ui/tabs';
import { useSystemSettings, useUpdateSystemSettings, useSyncExchangeRate } from './hooks/useSystemSettings';
import { useCompanies, useUpdateCompany } from '../Company/hooks/useCompanies';
import { Company } from '../../services/companyService';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/shared/system/PageHeader';
import { DataTable } from '@/components/shared/system/DataTable';
import { SearchInput } from '@/components/shared/system/SearchInput';

const SettingsPage = () => {
    const { t } = useTranslation('system');
    const location = useLocation();
    const { data: settings, isLoading: isSettingsLoading } = useSystemSettings();
    const updateMutation = useUpdateSystemSettings();
    const syncMutation = useSyncExchangeRate();

    // Determine default active tab based on route pathname
    const defaultTab = location.pathname.includes('exchange-rates') ? 'companies' : 'general';
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    // Form states
    const [mode, setMode] = useState<'auto' | 'manual'>('auto');
    const [manualValue, setManualValue] = useState<string>('');
    const [providerUrl, setProviderUrl] = useState<string>('');
    const [dataPath, setDataPath] = useState<'average' | 'bid' | 'ask'>('average');

    // Companies Query State
    const [companiesPage, setCompaniesPage] = useState(1);
    const [companiesPerPage, setCompaniesPerPage] = useState(10);
    const [companiesSearch, setCompaniesSearch] = useState('');
    const debouncedCompaniesSearch = useDebounce(companiesSearch, 500);

    const { data: companiesData, isLoading: isCompaniesLoading, refetch: refetchCompanies, isFetching: isCompaniesFetching } = useCompanies(
        companiesPage,
        companiesPerPage,
        debouncedCompaniesSearch
    );

    const updateCompanyMutation = useUpdateCompany();

    // Company Rate Edit Modal States
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [companyRateMode, setCompanyRateMode] = useState<'global' | 'override'>('global');
    const [companyRateValue, setCompanyRateValue] = useState<string>('');
    const [isCompanyRateModalOpen, setIsCompanyRateModalOpen] = useState(false);

    const handleEditCompanyRate = (company: Company) => {
        setSelectedCompany(company);
        setCompanyRateMode(company.exchange_rate_mode || 'global');
        setCompanyRateValue(company.exchange_rate_override_value?.toString() || '');
        setIsCompanyRateModalOpen(true);
    };

    const handleSaveCompanyRate = () => {
        if (!selectedCompany) return;

        updateCompanyMutation.mutate({
            id: selectedCompany.id,
            data: {
                exchange_rate_mode: companyRateMode,
                exchange_rate_override_value: companyRateMode === 'override' && companyRateValue 
                    ? parseFloat(companyRateValue) 
                    : null
            }
        }, {
            onSuccess: () => {
                setIsCompanyRateModalOpen(false);
                refetchCompanies();
            }
        });
    };

    // Sync settings with state when loaded
    useEffect(() => {
        if (settings) {
            setMode((settings.exchange_rate_mode as 'auto' | 'manual') || 'auto');
            setManualValue(settings.exchange_rate_manual_value || '');
            setProviderUrl(settings.exchange_rate_provider_url || '');
            setDataPath((settings.exchange_rate_data_path as 'average' | 'bid' | 'ask') || 'average');
        }
    }, [settings]);

    const handleSave = () => {
        updateMutation.mutate({
            exchange_rate_mode: mode,
            exchange_rate_manual_value: manualValue,
            exchange_rate_provider_url: providerUrl,
            exchange_rate_data_path: dataPath,
        });
    };

    const handleSync = () => {
        syncMutation.mutate();
    };

    const handleSearchClear = () => {
        setCompaniesSearch('');
    };

    const formatLastSync = (syncTime: string | null | undefined) => {
        if (!syncTime) return 'Never';
        let dateStr = syncTime;
        // If SQL style raw string (e.g. "2026-05-19 06:17:44"), convert to ISO UTC standard
        if (syncTime.includes(' ') && !syncTime.includes('T') && !syncTime.endsWith('Z') && !syncTime.includes('+')) {
            dateStr = syncTime.replace(' ', 'T') + 'Z';
        } else if (!syncTime.includes('T') && !syncTime.endsWith('Z') && !syncTime.includes('+')) {
            dateStr = syncTime + 'Z';
        }
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? 'Never' : date.toLocaleString();
    };

    // Columns for the Company active rate overview
    const columns = useMemo<ColumnDef<Company>[]>(() => [
        {
            accessorKey: 'name',
            header: t('company_name', 'Company Name'),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                        <Building2 className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-foreground">{row.original.name}</span>
                </div>
            )
        },
        {
            accessorKey: 'exchange_rate_mode',
            header: t('exchange_rate_mode', 'Rate Configuration'),
            cell: ({ row }) => {
                const modeVal = row.original.exchange_rate_mode;
                return modeVal === 'override' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        Custom Override
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Global (NBC)
                    </span>
                );
            }
        },
        {
            id: 'active_rate',
            header: t('active_rate', 'Active Rate'),
            cell: ({ row }) => {
                const isOverride = row.original.exchange_rate_mode === 'override';
                const rate = isOverride 
                    ? row.original.exchange_rate_override_value 
                    : settings?.exchange_rate_current_value;
                return (
                    <div className="flex flex-col">
                        <span className="font-bold font-mono text-sm text-foreground">
                            {rate ? `${parseFloat(String(rate)).toLocaleString()} KHR` : '—'}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                            {isOverride ? 'Manual Override' : 'System NBC Inherited'}
                        </span>
                    </div>
                );
            }
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleEditCompanyRate(row.original)}
                    >
                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                    </Button>
                </div>
            )
        }
    ], [t, settings]);

    if (isSettingsLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm font-medium text-muted-foreground">{t('loading', 'Loading Settings...')}</p>
                </div>
            </div>
        );
    }

    const renderConfigForm = (isModal: boolean = false) => {
        return (
            <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 1. EXCHANGE RATE SYNC MODE CARD (Left, spans 2 cols) */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="shadow-md overflow-hidden p-0 relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            <CardHeader className="relative border-b border-muted py-4">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    <CardTitle className="text-base font-bold">{t('exchange_rate_settings')}</CardTitle>
                                </div>
                                <CardDescription className="text-xs">
                                    Choose whether the system synchronizes exchange rates automatically or relies on a manual override.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="relative space-y-4 p-4 pt-0">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Auto Mode Card */}
                                    <div 
                                        onClick={() => setMode('auto')}
                                        className={`relative cursor-pointer rounded-xl border p-4 flex flex-col gap-2 transition-all duration-300 ${
                                            mode === 'auto' 
                                            ? 'bg-primary/5 border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.05)] ring-1 ring-primary/20' 
                                            : 'bg-gradient-to-b from-card to-background border-border'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className={`p-2 rounded-lg ${mode === 'auto' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                <Globe className="h-4 w-4" />
                                            </div>
                                            {mode === 'auto' && (
                                                <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                                                    <Check className="h-2.5 w-2.5 text-primary-foreground stroke-[3]" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">{t('exchange_rate_mode_auto')}</h4>
                                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                                Fetch official daily average rates from the National Bank of Cambodia XML feed.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Manual Mode Card */}
                                    <div 
                                        onClick={() => setMode('manual')}
                                        className={`relative cursor-pointer rounded-xl border p-4 flex flex-col gap-2 transition-all duration-300 ${
                                            mode === 'manual' 
                                            ? 'bg-blue-500/5 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.05)] ring-1 ring-blue-500/20' 
                                            : 'bg-gradient-to-b from-card to-background  border-border'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className={`p-2 rounded-lg ${mode === 'manual' ? 'bg-blue-500/20 text-blue-500' : 'bg-muted text-muted-foreground'}`}>
                                                <Sliders className="h-4 w-4" />
                                            </div>
                                            {mode === 'manual' && (
                                                <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                                                    <Check className="h-2.5 w-2.5 text-white stroke-[3]" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">{t('exchange_rate_mode_manual')}</h4>
                                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                                Deactivate sync and enforce a custom exchange rate value system-wide.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. NBC PROVIDER SETTINGS */}
                        <Card className={`shadow-md transition-all p-0 gap-0 duration-300 ${mode !== 'auto' ? 'opacity-60' : ''}`}>
                            <CardHeader className="border-b border-muted py-4">
                                <div className="flex items-center gap-2">
                                    <Database className="h-4 w-4 text-primary" />
                                    <CardTitle className="text-sm font-bold">NBC API Provider Config</CardTitle>
                                </div>
                                <CardDescription className="text-xs">
                                    Manage the XML feed endpoint and node target utilized for daily conversion updates.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="sm:col-span-2 space-y-1.5">
                                        <Label className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                                            {t('exchange_rate_provider_url')}
                                        </Label>
                                        <div className="relative">
                                            <Server className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input 
                                                value={providerUrl}
                                                onChange={(e) => setProviderUrl(e.target.value)}
                                                disabled={mode !== 'auto'}
                                                placeholder="https://www.nbc.gov.kh/api/exRate.php"
                                                className="pl-9 h-9 font-mono text-xs bg-background/50 border-border"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                                            Data Extraction Field
                                        </Label>
                                        <Select 
                                            value={dataPath} 
                                            onValueChange={(val: 'average' | 'bid' | 'ask') => setDataPath(val)}
                                            disabled={mode !== 'auto'}
                                        >
                                            <SelectTrigger className="bg-background/50 border-border !h-9 text-xs">
                                                <SelectValue placeholder="Select path" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="average">Average Rate</SelectItem>
                                                <SelectItem value="bid">Bid Rate</SelectItem>
                                                <SelectItem value="ask">Ask Rate</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 3. STATUS & CONTROLS WIDGETS */}
                    <div className="space-y-6">
                        {/* Active Snap Rate Widget */}
                        <Card className="p-0 bg-gradient-to-b from-card to-background shadow-md overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full filter blur-lg pointer-events-none" />
                            <CardContent className="p-4 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                            Active Snap Rate
                                        </p>
                                        <h2 className="text-3xl font-black mt-1 font-mono flex items-baseline gap-1">
                                            {settings?.exchange_rate_current_value || '4,014'}
                                            <span className="text-xs font-semibold text-muted-foreground">KHR</span>
                                        </h2>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            Equivalent to 1.00 USD
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {mode === 'auto' ? (
                                            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500/10 p-0.5">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            </span>
                                        ) : (
                                            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-blue-500/10 p-0.5">
                                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                            </span>
                                        )}
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                            {mode === 'auto' ? 'Live Auto' : 'Manual'}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-muted pt-3 space-y-1.5">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-muted-foreground">{t('exchange_rate_last_sync')}</span>
                                        <span className="font-semibold text-foreground font-mono">
                                            {formatLastSync(settings?.exchange_rate_last_sync)}
                                        </span>
                                    </div>
                                </div>

                                {/* Manual Live NBC Trigger */}
                                {mode === 'auto' && (
                                    <Button 
                                        onClick={handleSync}
                                        disabled={syncMutation.isPending}
                                        variant="outline" 
                                        className="w-full bg-background hover:bg-primary/5 hover:text-primary hover:border-primary transition-all duration-300 font-bold h-9 text-xs"
                                    >
                                        {syncMutation.isPending ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                                        ) : (
                                            <RefreshCw className="h-3.5 w-3.5 mr-2" />
                                        )}
                                        {t('sync_now')}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Manual Value override block */}
                        {mode === 'manual' && (
                            <Card className="p-0 gap-0 border-blue-500/20 bg-background/50 shadow-md overflow-hidden animate-in zoom-in-95 duration-200">
                                <CardHeader className="border-b border-blue-500/10 bg-blue-500/5 py-3">
                                    <div className="flex items-center gap-1.5">
                                        <Sliders className="h-3.5 w-3.5 text-blue-500" />
                                        <CardTitle className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">
                                            {t('exchange_rate_manual_value')}
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 bg-gradient-to-t from-card to-background ">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-semibold text-muted-foreground">USD to KHR Rate Override</Label>
                                        <Input 
                                            type="number"
                                            value={manualValue}
                                            onChange={(e) => setManualValue(e.target.value)}
                                            placeholder="e.g. 4015"
                                            className="font-mono text-base font-bold border-blue-500/30 focus-visible:ring-blue-500 bg-background h-9"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Bottom Actions Sticky Bar */}
                {isModal ? (
                    <div className="flex justify-end gap-2 pt-4 border-t border-muted mt-6">
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsConfigModalOpen(false)}
                            className="h-9 text-xs"
                        >
                            {t('cancel')}
                        </Button>
                        <Button 
                            onClick={() => {
                                handleSave();
                                setIsConfigModalOpen(false);
                            }}
                            disabled={updateMutation.isPending}
                            className="px-6 h-9 text-xs font-bold"
                        >
                            {updateMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            ) : null}
                            {t('save_changes')}
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between bg-muted/40 border border-border backdrop-blur-md rounded-2xl p-4 shadow-md mt-6">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <AlertCircle className="h-3.5 w-3.5 text-primary animate-pulse" />
                            <span>Ensure settings are aligned before saving to avoid active transaction calculation errors.</span>
                        </div>
                        <Button 
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            size="lg" 
                            className="px-8 font-bold text-xs bg-primary hover:bg-primary/95 text-primary-foreground shadow-md hover:shadow-primary/10 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 h-9"
                        >
                            {updateMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            ) : null}
                            {t('save_changes')}
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            {/* Standard Shared Page Header */}
            <PageHeader
                title={t('system_settings')}
                subtitle={t('configure_global_system_variables')}
            >
                {/* Tabs Selector List */}
                <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'general' | 'companies')}>
                    <TabsList className="bg-muted p-1 rounded-xl">
                        <TabsTrigger value="general" className="rounded-lg px-4 py-1.5 text-xs font-bold gap-1.5 transition-all duration-200">
                            <Settings className="h-3.5 w-3.5" />
                            General & Sync
                        </TabsTrigger>
                        <TabsTrigger value="companies" className="rounded-lg px-4 py-1.5 text-xs font-bold gap-1.5 transition-all duration-200">
                            <Building2 className="h-3.5 w-3.5" />
                            Company Rates
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </PageHeader>

            {/* Tabs View Panels */}
            <Tabs value={activeTab}>
                <TabsContent value="general" className="mt-4">
                    {renderConfigForm(false)}
                </TabsContent>
                
                <TabsContent value="companies" className="mt-4">
                    <div className="space-y-4">
                        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b bg-muted/30">
                                <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                                    <div className="flex-1 max-w-sm w-full">
                                        <SearchInput
                                            value={companiesSearch}
                                            onChange={(e) => setCompaniesSearch(e.target.value)}
                                            placeholder={t('search_placeholder', 'Search companies...')}
                                            onClear={handleSearchClear}
                                            isLoading={isCompaniesFetching}
                                        />
                                    </div>
                                    <Button 
                                        onClick={() => setIsConfigModalOpen(true)}
                                        variant="outline"
                                        className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary hover:border-primary transition-all duration-200 h-9 text-xs"
                                    >
                                        <Sliders size={16} />
                                        Configure Global Sync
                                    </Button>
                                </div>
                            </div>

                            <DataTable
                                columns={columns}
                                data={companiesData?.data || []}
                                isLoading={isCompaniesLoading}
                                isFetching={isCompaniesFetching}
                                totalItems={companiesData?.total || 0}
                                currentPage={companiesPage}
                                pageSize={companiesPerPage}
                                pageCount={companiesData?.last_page || 1}
                                onPageChange={setCompaniesPage}
                                onPageSizeChange={setCompaniesPerPage}
                                searchQuery={debouncedCompaniesSearch}
                                onEmptyAction={handleSearchClear}
                                emptyActionLabel={t('clear_search', 'Clear Search')}
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Global Settings Configuration Modal (Active only from Companies Tab) */}
            <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
                <DialogContent className="sm:max-w-5xl w-full max-h-[90vh] overflow-y-auto bg-background border border-border rounded-2xl shadow-2xl p-6">
                    <DialogHeader className="border-b border-muted pb-4">
                        <div className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-primary animate-spin-[spin_10s_linear_infinite]" />
                            <DialogTitle className="text-lg font-bold">Configure Global Exchange Rates</DialogTitle>
                        </div>
                        <DialogDescription className="text-xs">
                            Define NBC automatic synchronization credentials or enforce manual conversion override parameters.
                        </DialogDescription>
                    </DialogHeader>
                    {renderConfigForm(true)}
                </DialogContent>
            </Dialog>

            {/* Inline Company Exchange Rate Edit Modal */}
            <Dialog open={isCompanyRateModalOpen} onOpenChange={setIsCompanyRateModalOpen}>
                <DialogContent className="max-w-md bg-background border border-border rounded-2xl shadow-2xl p-6">
                    <DialogHeader className="border-b border-muted pb-4">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            <DialogTitle className="text-lg font-bold">
                                {t('edit_company_rate', 'Configure Company Rate')}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-xs mt-1">
                            Adjust custom exchange rate override preferences for <strong>{selectedCompany?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Rate Calculation Mode
                            </Label>
                            <Select 
                                value={companyRateMode} 
                                onValueChange={(val: 'global' | 'override') => setCompanyRateMode(val)}
                            >
                                <SelectTrigger className="bg-background/50 border-border h-9 text-xs">
                                    <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="global">Follow Global System (NBC Rate)</SelectItem>
                                    <SelectItem value="override">Use Custom Manual Override</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {companyRateMode === 'override' && (
                            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    USD to KHR Override Value
                                </Label>
                                <Input 
                                    type="number"
                                    value={companyRateValue}
                                    onChange={(e) => setCompanyRateValue(e.target.value)}
                                    placeholder="e.g. 4020"
                                    className="font-mono text-base font-bold border-blue-500/30 focus-visible:ring-blue-500 bg-background h-9"
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="border-t border-muted pt-4">
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsCompanyRateModalOpen(false)}
                            className="h-9 text-xs"
                        >
                            {t('cancel', 'Cancel')}
                        </Button>
                        <Button 
                            onClick={handleSaveCompanyRate}
                            disabled={updateCompanyMutation.isPending}
                            className="h-9 text-xs font-bold px-6"
                        >
                            {updateCompanyMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                            {t('save', 'Save Preferences')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SettingsPage;
