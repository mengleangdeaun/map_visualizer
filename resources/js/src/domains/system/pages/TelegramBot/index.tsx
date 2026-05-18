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
import { Send, Settings, CheckCircle2, XCircle, AlertCircle, HelpCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTelegramSettings, useUpdateTelegramSettings, useTestBot, useTestMessage } from './hooks/useTelegramSettings';
import { Company } from '../../services/companyService';
import { toast } from 'sonner';

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
            cell: ({ row }) => {
                const company = row.original;
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
    ], [t, page, perPage, debouncedSearch]);

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

// --- Modal Component ---
interface TelegramConfigModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    company: Company;
}

const TelegramConfigModal = ({ open, onOpenChange, company }: TelegramConfigModalProps) => {
    const { data: settings, isLoading: isLoadingSettings, refetch } = useTelegramSettings(company.id);
    const updateMutation = useUpdateTelegramSettings();
    const testBotMutation = useTestBot();
    const testMessageMutation = useTestMessage();

    // Local form state
    const [botToken, setBotToken] = useState('');
    const [companyChatId, setCompanyChatId] = useState('');
    const [notifyPwa, setNotifyPwa] = useState(true);
    const [notifyDriverTelegram, setNotifyDriverTelegram] = useState(true);
    const [notifyCompanyTelegram, setNotifyCompanyTelegram] = useState(true);

    // Live validation states
    const [botTestResult, setBotTestResult] = useState<{ success: boolean; message: string; username?: string } | null>(null);
    const [msgTestResult, setMsgTestResult] = useState<{ success: boolean; message: string } | null>(null);

    // Load initial settings
    useEffect(() => {
        if (settings) {
            setBotToken(settings.bot_token || '');
            setCompanyChatId(settings.company_chat_id || '');
            setNotifyPwa(settings.notify_pwa);
            setNotifyDriverTelegram(settings.notify_driver_telegram);
            setNotifyCompanyTelegram(settings.notify_company_telegram);
            setBotTestResult(null);
            setMsgTestResult(null);
        }
    }, [settings]);

    const handleSave = async () => {
        await updateMutation.mutateAsync({
            companyId: company.id,
            data: {
                bot_token: botToken || null,
                company_chat_id: companyChatId || null,
                notify_pwa: notifyPwa,
                notify_driver_telegram: notifyDriverTelegram,
                notify_company_telegram: notifyCompanyTelegram
            }
        });
        onOpenChange(false);
    };

    const handleTestBot = async () => {
        if (!botToken) {
            toast.error('Please enter a Bot Token to test');
            return;
        }
        setBotTestResult(null);
        try {
            const res = await testBotMutation.mutateAsync({ companyId: company.id, bot_token: botToken });
            setBotTestResult({
                success: true,
                message: `Connected! Active Bot: @${res.bot.username} (${res.bot.first_name})`,
                username: res.bot.username
            });
            toast.success('Telegram Bot connected successfully!');
        } catch (err: any) {
            setBotTestResult({
                success: false,
                message: err.response?.data?.message || 'Connection test failed. Invalid token.'
            });
            toast.error('Bot connection failed!');
        }
    };

    const handleTestMessage = async () => {
        if (!botToken || !companyChatId) {
            toast.error('Token and Company Chat ID are required for test messages');
            return;
        }
        setMsgTestResult(null);
        try {
            await testMessageMutation.mutateAsync({ 
                companyId: company.id, 
                bot_token: botToken, 
                company_chat_id: companyChatId 
            });
            setMsgTestResult({
                success: true,
                message: 'Test message delivered successfully!'
            });
            toast.success('Test message sent to Telegram group!');
        } catch (err: any) {
            setMsgTestResult({
                success: false,
                message: err.response?.data?.message || 'Delivery failed. Check group ID and make sure Bot is an admin.'
            });
            toast.error('Failed to deliver test message.');
        }
    };

    const isPending = updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] h-fit gap-0 p-0 bg-background shadow-2xl grid grid-rows-[auto_1fr] overflow-hidden">
                <DialogHeader className="p-4 border-b bg-background flex-shrink-0">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Send className="size-5 text-primary animate-pulse" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-primary">
                                Telegram Bot Setup — {company.name}
                            </DialogTitle>
                            <DialogDescription>
                                Configure custom notification channels and triggers for this organization.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {isLoadingSettings ? (
                    <div className="h-[400px] flex items-center justify-center">
                        <Loader2 className="size-8 text-primary animate-spin" />
                    </div>
                ) : (
                    <div className="flex flex-col min-h-0 overflow-hidden">
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="p-4 space-y-6">
                                
                                {/* 1. Connection Details */}
                                <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-dashed">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        1. Bot Connection & Channel Mapping
                                    </h3>
                                    
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="botToken">Telegram Bot Token (HTTP API)</Label>
                                            <div className="flex gap-2">
                                                <Input 
                                                    id="botToken"
                                                    value={botToken}
                                                    onChange={(e) => setBotToken(e.target.value)}
                                                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                                                    className="font-mono text-sm bg-background flex-1"
                                                />
                                                <Button 
                                                    type="button" 
                                                    variant="outline"
                                                    disabled={testBotMutation.isPending || !botToken}
                                                    onClick={handleTestBot}
                                                    className="font-bold h-8 flex-shrink-0 bg-background"
                                                >
                                                    {testBotMutation.isPending && <Loader2 className="size-3 mr-1 animate-spin" />}
                                                    Test Bot
                                                </Button>
                                            </div>
                                            {botTestResult && (
                                                <div className={`text-[10px] font-medium flex items-center gap-1.5 mt-1 ${botTestResult.success ? 'text-green-600' : 'text-red-500'}`}>
                                                    {botTestResult.success ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                    {botTestResult.message}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="companyChat">Company Telegram Group Chat ID</Label>
                                            <div className="flex gap-2">
                                                <Input 
                                                    id="companyChat"
                                                    value={companyChatId}
                                                    onChange={(e) => setCompanyChatId(e.target.value)}
                                                    placeholder="e.g. -1002384910239"
                                                    className="font-mono text-sm bg-background flex-1"
                                                />
                                                <Button 
                                                    type="button" 
                                                    variant="outline"
                                                    disabled={testMessageMutation.isPending || !botToken || !companyChatId}
                                                    onClick={handleTestMessage}
                                                    className="font-bold h-8 flex-shrink-0 bg-background"
                                                >
                                                    {testMessageMutation.isPending && <Loader2 className="size-3 mr-1 animate-spin" />}
                                                    Send Test Alert
                                                </Button>
                                            </div>
                                            {msgTestResult && (
                                                <div className={`text-[10px] font-medium flex items-center gap-1.5 mt-1 ${msgTestResult.success ? 'text-green-600' : 'text-red-500'}`}>
                                                    {msgTestResult.success ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                    {msgTestResult.message}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Notification Triggers */}
                                <div className="space-y-4 bg-accent/5 p-4 rounded-xl border">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <AlertCircle size={14} className="text-primary" />
                                        2. Multi-Channel Triggers (Toggle On/Off)
                                    </h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Enable or disable real-time delivery alerts across our separate tracking domains when new tasks are dispatched.
                                    </p>

                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-center justify-between gap-4 p-2 bg-background rounded-lg border">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-bold text-foreground">Driver PWA App Alerts</span>
                                                <span className="text-[10px] text-muted-foreground leading-tight">
                                                    Driver receives instant pop-up toast alerts inside their progressive web application.
                                                </span>
                                            </div>
                                            <Switch 
                                                checked={notifyPwa}
                                                onCheckedChange={setNotifyPwa}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between gap-4 p-2 bg-background rounded-lg border">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-bold text-foreground">Driver Telegram Alert Routing</span>
                                                <span className="text-[10px] text-muted-foreground leading-tight">
                                                    Bot forwards targeted dispatch alerts to the Driver's custom group chat or targeted topic thread.
                                                </span>
                                            </div>
                                            <Switch 
                                                checked={notifyDriverTelegram}
                                                onCheckedChange={setNotifyDriverTelegram}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between gap-4 p-2 bg-background rounded-lg border">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-bold text-foreground">Central Company Group Alerts</span>
                                                <span className="text-[10px] text-muted-foreground leading-tight">
                                                    Bot broadcasts a beautifully formatted markdown dispatch summary to the organization's central chat room.
                                                </span>
                                            </div>
                                            <Switch 
                                                checked={notifyCompanyTelegram}
                                                onCheckedChange={setNotifyCompanyTelegram}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Integration Guide */}
                                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-2 flex gap-3">
                                    <HelpCircle className="size-5 text-primary flex-shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-bold text-primary">Need Help? Quick Telegram Bot Guide:</h4>
                                        <ul className="list-disc pl-4 text-[10px] text-muted-foreground space-y-1 leading-normal">
                                            <li>Search for <b>@BotFather</b> on Telegram and send <code>/newbot</code> to get your <b>Bot Token</b>.</li>
                                            <li>Invite your new Bot as an <b>Administrator</b> into your company Telegram group chat or channel.</li>
                                            <li>Send any message in the group, then check <code>https://api.telegram.org/bot&lt;token&gt;/getUpdates</code> to find the group's <b>Chat ID</b> (it will start with <code>-100</code>).</li>
                                            <li>For forum-style supergroups, drivers can specify their topic thread ID inside their User Profile!</li>
                                        </ul>
                                    </div>
                                </div>

                            </div>
                        </ScrollArea>

                        <DialogFooter className="p-4 border-t bg-muted/5 flex-shrink-0">
                            <div className="flex items-center justify-end gap-3 w-full">
                                <Button 
                                    size="lg"
                                    type="button" 
                                    variant="ghost" 
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    size="lg"
                                    type="button" 
                                    className="px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold"
                                    disabled={isPending}
                                    onClick={handleSave}
                                >
                                    {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                                    Save Config
                                </Button>
                            </div>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default TelegramBotPage;
