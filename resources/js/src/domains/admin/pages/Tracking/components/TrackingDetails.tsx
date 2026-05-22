import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
    Clock, 
    User, 
    Truck, 
    MapPin, 
    Phone, 
    ClipboardList, 
    CheckCircle2, 
    Calendar, 
    AlertCircle, 
    DollarSign,
    Package
} from 'lucide-react';
import { Delivery, OrderItem } from '../../../services/deliveryService';
import { Task } from '../../Tasks/services/taskService';
import { format } from 'date-fns';
import { statusColors, priorityColors } from '@/domains/admin/utils/statusStyles';

import { TrackingDetailsProps } from '../types';

export const TrackingDetails = ({ type, item }: TrackingDetailsProps) => {
    // Stepper mapping
    const steps = React.useMemo(() => {
        if (type === 'delivery') {
            const d = item as Delivery;
            const flow = ['pending', 'at_hub', 'linehaul', 'out_for_delivery', 'delivered'];
            const labels = {
                pending: 'Pending',
                at_hub: 'At Hub',
                linehaul: 'Linehaul Transit',
                out_for_delivery: 'Out for Delivery',
                delivered: 'Delivered'
            };
            
            let currentIndex = flow.indexOf(d.status);
            if (d.status === 'failed' || d.status === 'rescheduled') {
                // Keep progress but flag as error / alert
                currentIndex = 3; 
            }
            
            return {
                flow,
                labels,
                currentIndex,
                isError: d.status === 'failed'
            };
        } else {
            const t = item as Task;
            const flow = ['pending', 'assigned', 'in_progress', 'completed'];
            const labels = {
                pending: 'Created',
                assigned: 'Assigned',
                in_progress: 'In Progress',
                completed: 'Completed'
            };
            
            let currentIndex = flow.indexOf(t.status);
            if (t.status === 'cancelled' || t.status === 'archived') {
                currentIndex = 2;
            }
            
            return {
                flow,
                labels,
                currentIndex,
                isError: t.status === 'cancelled'
            };
        }
    }, [type, item]);



    return (
        <div className="space-y-6">
            {/* Timeline Progress Bar Card */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-0.5">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                Tracking Number
                            </span>
                            <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                {item.tracking_number}
                                <Badge className={statusColors[item.status] || 'bg-muted text-muted-foreground'} variant="outline">
                                    {item.status.replace('_', ' ')}
                                </Badge>
                            </CardTitle>
                        </div>
                        {type === 'task' && (item as Task).priority && (
                            <div className="sm:text-right">
                                <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Priority</span>
                                <Badge className={priorityColors[(item as Task).priority || 'normal']} variant="outline">
                                    {(item as Task).priority}
                                </Badge>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-2">
                    {/* Stepper Timeline */}
                    <div className="relative py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-0">
                        {steps.flow.map((step, idx) => {
                            const isCompleted = idx <= steps.currentIndex;
                            const isCurrent = idx === steps.currentIndex;
                            const isNextCompleted = idx + 1 <= steps.currentIndex;
                            
                            return (
                                <div key={step} className="flex md:flex-col items-start md:items-center md:text-center flex-1 w-full gap-4 md:gap-2 relative">
                                    {/* Connecting lines to the next step */}
                                    {idx < steps.flow.length - 1 && (
                                        <>
                                            {/* Mobile vertical line */}
                                            <div 
                                                className={`md:hidden absolute left-4 top-4 -translate-x-1/2 w-[2px] h-[calc(100%+1.5rem)] -z-10 transition-colors duration-500 ${
                                                    isNextCompleted ? 'bg-primary' : 'bg-muted'
                                                }`}
                                            />
                                            {/* Desktop horizontal line */}
                                            <div 
                                                className={`hidden md:block absolute left-1/2 top-4 -translate-y-1/2 w-full h-[2px] -z-10 transition-colors duration-500 ${
                                                    isNextCompleted ? 'bg-primary' : 'bg-muted'
                                                }`}
                                            />
                                        </>
                                    )}

                                    <div className={`size-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 ${
                                        isCompleted 
                                            ? steps.isError && isCurrent
                                                ? 'bg-red-500 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                                                : 'bg-primary border-primary text-primary-foreground shadow-[0_0_12px_rgba(var(--primary),0.3)]'
                                            : 'bg-background border-muted-foreground/30 text-muted-foreground'
                                    }`}>
                                        {isCompleted && !(steps.isError && isCurrent) ? (
                                            <CheckCircle2 className="size-4" />
                                        ) : steps.isError && isCurrent ? (
                                            <AlertCircle className="size-4" />
                                        ) : (
                                            idx + 1
                                        )}
                                    </div>
                                    <div className="flex flex-col md:items-center pt-0.5 md:pt-0">
                                        <span className={`text-xs font-semibold ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {steps.labels[step as keyof typeof steps.labels]}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/80 mt-0.5">
                                            {isCompleted && (
                                                idx === 0 
                                                    ? format(new Date(item.created_at), 'MMM d, hh:mm a')
                                                    : (type === 'delivery' && step === 'delivered' && (item as Delivery).completed_at)
                                                        ? format(new Date((item as Delivery).completed_at!), 'MMM d, hh:mm a')
                                                        : (type === 'task' && step === 'completed' && (item as Task).completed_at)
                                                            ? format(new Date((item as Task).completed_at!), 'MMM d, hh:mm a')
                                                            : (type === 'task' && step === 'in_progress' && (item as Task).started_at)
                                                                ? format(new Date((item as Task).started_at!), 'MMM d, hh:mm a')
                                                                : 'In Progress'
                                            )}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Status / Details Split Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Logistics details (Driver, Vehicle, Timestamps) */}
                <Card>
                    <CardHeader className="pb-3 border-b border-border/40">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                            <Truck className="size-4 text-primary" />
                            Logistics & Fulfillment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        {/* Driver */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <User className="size-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Assigned Driver</span>
                            </div>
                            <span className="text-xs font-semibold">
                                {item.driver?.name || 'Unassigned'}
                            </span>
                        </div>

                        {/* Vehicle */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Truck className="size-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Vehicle Plate</span>
                            </div>
                            <span className="text-xs font-semibold">
                                {type === 'delivery' 
                                    ? ((item as Delivery).driver?.name ? 'Standard Fleet' : 'N/A') 
                                    : ((item as Task).vehicle?.plate_number || 'N/A')
                                }
                            </span>
                        </div>

                        {/* Scheduled At */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Calendar className="size-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Scheduled Date</span>
                            </div>
                            <span className="text-xs font-semibold">
                                {item.scheduled_at 
                                    ? format(new Date(item.scheduled_at), 'MMM d, yyyy hh:mm a') 
                                    : 'Immediate Dispatch'
                                }
                            </span>
                        </div>

                        {/* Created At */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="size-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Created Time</span>
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground">
                                {format(new Date(item.created_at), 'MMM d, yyyy hh:mm a')}
                            </span>
                        </div>

                        {/* Hub location stopovers (Deliveries only) */}
                        {type === 'delivery' && (
                            <>
                                <hr className="my-2 border-t border-border/40" />
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Origin Hub</span>
                                        <span className="text-xs font-semibold">
                                            {(item as Delivery).origin_hub?.name || 'Main Sorting Facility'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Current Facility</span>
                                        <span className="text-xs font-semibold">
                                            {(item as Delivery).current_hub?.name || 'In Transit'}
                                        </span>
                                    </div>
                                    {((item as Delivery).weight_kg) && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">Cargo Weight</span>
                                            <span className="text-xs font-semibold">
                                                {(item as Delivery).weight_kg} kg
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Customer/Recipient or Task Description details */}
                <Card>
                    <CardHeader className="pb-3 border-b border-border/40">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                            <MapPin className="size-4 text-primary" />
                            {type === 'delivery' ? 'Customer & Consignee' : 'Task Descriptions & Contacts'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        {type === 'delivery' ? (
                            <>
                                {/* Customer Name */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Name</span>
                                    <span className="text-xs font-semibold">
                                        {(item as Delivery).order?.customer?.name || 'Retail Client'}
                                    </span>
                                </div>
                                {/* Customer Phone */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Phone className="size-3 text-muted-foreground" /> Phone
                                    </span>
                                    <span className="text-xs font-semibold">
                                        {(item as Delivery).order?.customer?.phone || 'No direct phone'}
                                    </span>
                                </div>
                                {/* Dropoff Address */}
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground block">Shipping Address</span>
                                    <p className="text-xs leading-relaxed bg-muted/20 p-2.5 rounded border border-border/25">
                                        {(item as Delivery).dropoff_address || 'No direct destination address entered.'}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Contact Name */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Client Contact</span>
                                    <span className="text-xs font-semibold">
                                        {(item as Task).contact_name || 'N/A'}
                                    </span>
                                </div>
                                {/* Contact Phone */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Phone className="size-3 text-muted-foreground" /> Phone
                                    </span>
                                    <span className="text-xs font-semibold">
                                        {(item as Task).contact_phone || 'N/A'}
                                    </span>
                                </div>
                                {/* Description */}
                                {((item as Task).description) && (
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground block">Task Instruction</span>
                                        <p className="text-xs leading-relaxed bg-muted/20 p-2.5 rounded border border-border/25">
                                            {(item as Task).description}
                                        </p>
                                    </div>
                                )}
                                {/* Pickup and Dropoff Address List */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 pt-1">
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] text-emerald-500 font-bold block">PICKUP LOCATION</span>
                                        <span className="text-xs text-muted-foreground line-clamp-2 block leading-snug">
                                            {(item as Task).pickup_address || 'No pickup address detail.'}
                                        </span>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] text-red-500 font-bold block">DROPOFF LOCATION</span>
                                        <span className="text-xs text-muted-foreground line-clamp-2 block leading-snug">
                                            {(item as Task).dropoff_address || 'No dropoff address detail.'}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delivery Order Items Table (Deliveries only) */}
            {type === 'delivery' && (item as Delivery).order && (
                <Card>
                    <CardHeader className="pb-3 border-b border-border/40">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                            <ClipboardList className="size-4 text-primary" />
                            Order Items Listing ({(item as Delivery).order?.order_number})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="pl-6 h-10 text-xs font-semibold text-muted-foreground">Product Name</TableHead>
                                    <TableHead className="h-10 text-xs font-semibold text-muted-foreground text-center w-20">Quantity</TableHead>
                                    <TableHead className="h-10 text-xs font-semibold text-muted-foreground text-right w-28">Unit Price</TableHead>
                                    <TableHead className="pr-6 h-10 text-xs font-semibold text-muted-foreground text-right w-32">Total Price</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {((item as Delivery).order?.items || []).map((orderItem: OrderItem) => (
                                    <TableRow key={orderItem.id} className="hover:bg-muted/10">
                                        <TableCell className="pl-6 py-3 text-xs font-medium">{orderItem.product_name}</TableCell>
                                        <TableCell className="py-3 text-xs text-center font-semibold">{orderItem.quantity}</TableCell>
                                        <TableCell className="py-3 text-xs text-right font-mono">${Number(orderItem.unit_price).toFixed(2)}</TableCell>
                                        <TableCell className="pr-6 py-3 text-xs text-right font-semibold font-mono">${Number(orderItem.total_price).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                                {((item as Delivery).order?.grand_total !== undefined) && (
                                    <TableRow className="hover:bg-transparent border-t border-border/40 font-bold bg-muted/5">
                                        <TableCell colSpan={3} className="pl-6 py-3 text-xs">Total Order Value</TableCell>
                                        <TableCell colSpan={2} className="pr-6 py-3 text-right font-bold font-mono text-primary text-sm flex items-center justify-end gap-1">
                                            <DollarSign className="size-3.5" />
                                            {Number((item as Delivery).order?.grand_total).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
