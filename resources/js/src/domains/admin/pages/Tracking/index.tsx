import React from 'react';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { TrackingMap } from './components/TrackingMap';
import { TrackingDetails } from './components/TrackingDetails';
import { QuickTrackCards } from './components/QuickTrackCards';
import { useTracking } from './hooks/useTracking';
import { useTranslation } from 'react-i18next';
import { 
    Search, 
    X, 
    History, 
    Package, 
    ClipboardList,
    AlertCircle,
    Route
} from 'lucide-react';

export default function TrackingPage() {
    const { t } = useTranslation(['admin', 'sidebar']);
    const {
        searchQuery,
        setSearchQuery,
        searchType,
        setSearchType,
        recentSearches,
        recentDeliveries,
        loadingRecDeliveries,
        recentTasks,
        loadingRecTasks,
        trackingResult,
        isSearching,
        activeQuery,
        hasNoResults,
        handleSearch,
        handleQuickTrack,
        handleClear,
    } = useTracking();

    return (
        <div className="space-y-6 mx-auto">
            {/* Top Dashboard Hero Glass Header */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-card to-background border p-6 sm:p-8">
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-primary/15 text-primary">
                                <Route className="size-5" />
                            </div> 
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                            Real-time Operations Tracker
                        </h1>
                        </div>

                        <p className="text-sm text-muted-foreground max-w-2xl">
                            Oversee active customer deliveries and fleet service tasks. Search by tracking prefix code to visualize routes, transit intervals, and driver assignments instantly.
                        </p>
                    </div>
                </div>
            </div>

            {/* Premium Tracking Search Glass Panel */}
            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Selector Tabs */}
                            <Tabs value={searchType} onValueChange={(val) => setSearchType(val as any)} className="w-full sm:w-auto">
                                <TabsList className="grid grid-cols-3 h-11 p-1 bg-muted/65 rounded-xl">
                                    <TabsTrigger value="all" className="rounded-lg text-xs font-semibold">Auto</TabsTrigger>
                                    <TabsTrigger value="delivery" className="rounded-lg text-xs font-semibold flex items-center gap-1">
                                        <Package className="size-3.5" /> Deliveries
                                    </TabsTrigger>
                                    <TabsTrigger value="task" className="rounded-lg text-xs font-semibold flex items-center gap-1">
                                        <ClipboardList className="size-3.5" /> Tasks
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            {/* Search Input Container */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Enter Delivery (TRK-) or Task (TSK-) tracking code..."
                                    className="pl-10 pr-10 h-11 rounded-xl bg-background/50 border-border/70 focus-visible:ring-primary focus-visible:border-primary transition-all duration-300"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleClear}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-muted-foreground hover:bg-muted"
                                    >
                                        <X className="size-3.5" />
                                    </Button>
                                )}
                            </div>

                            <Button 
                                type="submit" 
                                className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-md active:scale-95"
                                disabled={isSearching}
                            >
                                {isSearching ? <Spinner className="size-4 mr-2" /> : <Search className="size-4 mr-2" />}
                                Track Route
                            </Button>
                        </div>

                        {/* Recent History Tags */}
                        {recentSearches.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap pt-1.5">
                                <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                                    <History className="size-3" /> Recent:
                                </span>
                                {recentSearches.map((term) => (
                                    <Badge
                                        key={term}
                                        variant="secondary"
                                        className="cursor-pointer hover:bg-secondary/80 font-mono text-[11px] py-1 px-2.5 rounded-lg transition-all active:scale-95 border"
                                        onClick={() => {
                                            const detectedType = term.toUpperCase().startsWith('TSK-') ? 'task' : 'delivery';
                                            handleQuickTrack(term, detectedType);
                                        }}
                                    >
                                        {term}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>

            {/* Content Results Display Section */}
            {isSearching ? (
                <Card className="border border-dashed p-16 flex flex-col items-center justify-center bg-muted/10 rounded-2xl">
                    <Spinner className="size-8 text-primary animate-spin" />
                    <p className="text-sm font-semibold text-muted-foreground mt-4 animate-pulse">
                        Querying telemetry nodes & coordinates...
                    </p>
                </Card>
            ) : trackingResult ? (
                /* Split details and map layout */
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    {/* Left detailed panel */}
                    <div className="xl:col-span-7 space-y-6">
                        <TrackingDetails type={trackingResult.type} item={trackingResult.data} />
                    </div>

                    {/* Right mapping panel */}
                    <div className="xl:col-span-5 h-[500px] xl:h-[620px] sticky top-6">
                        <TrackingMap type={trackingResult.type} item={trackingResult.data} />
                    </div>
                </div>
            ) : hasNoResults ? (
                /* No Results Card */
                <Card className="border border-dashed border-red-500/30 p-12 text-center bg-red-500/5 rounded-2xl max-w-2xl mx-auto">
                    <div className="size-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="size-6 text-red-600" />
                    </div>
                    <CardTitle className="text-xl font-bold text-red-950">No Tracking Records Located</CardTitle>
                    <CardDescription className="text-sm max-w-md mx-auto mt-2 leading-relaxed text-red-900/80">
                        We searched the logs for <span className="font-mono font-bold text-red-950">"{activeQuery}"</span>, but could not identify any matching active Deliveries or Tasks. Verify the tracking number syntax and try again.
                    </CardDescription>
                </Card>
            ) : (
                /* Landing / Quick Tracking Dashboard Lists */
                <QuickTrackCards
                    loadingRecDeliveries={loadingRecDeliveries}
                    recentDeliveries={recentDeliveries}
                    loadingRecTasks={loadingRecTasks}
                    recentTasks={recentTasks}
                    handleQuickTrack={handleQuickTrack}
                />
            )}
        </div>
    );
}
