'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useParams, useRouter } from 'next/navigation';
import { formatEther, parseEther } from 'viem';
import { Loader2, ArrowLeft, CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getEscrow } from '@/lib/api';
import { ESCROW_ABI } from '@/lib/contracts';
import { ESCROW_ADDRESSES } from '@/lib/wagmi';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge'; // Using the one defined in page.tsx or create a real component
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const STATUS_MAP: Record<number, { label: string; color: string; icon: any }> = {
    0: { label: 'Created', color: 'bg-blue-500', icon: Loader2 },
    1: { label: 'Funded', color: 'bg-green-500', icon: CheckCircle2 },
    2: { label: 'Released', color: 'bg-purple-500', icon: ShieldCheck },
    3: { label: 'Refunded', color: 'bg-gray-500', icon: XCircle },
    4: { label: 'Disputed', color: 'bg-red-500', icon: AlertTriangle },
    5: { label: 'Resolved', color: 'bg-orange-500', icon: CheckCircle2 },
    6: { label: 'Cancelled', color: 'bg-gray-400', icon: XCircle },
};

export default function EscrowDetailsPage() {
    const { id } = useParams();
    const { address, chain } = useAccount();
    const router = useRouter();
    const { toast } = useToast();
    const [disputeReason, setDisputeReason] = useState('');
    const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false);

    const { data: escrow, isLoading, refetch } = useQuery({
        queryKey: ['escrow', id],
        queryFn: () => getEscrow(id as string),
        enabled: !!id,
    });

    const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    // Effect to refetch data after transaction confirmation
    if (isConfirmed) {
        refetch();
        // Reset hash to avoid infinite loop if we were using useEffect, but here it's fine
    }

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-20 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!escrow) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">Escrow not found</h2>
                <Button onClick={() => router.push('/escrows')}>Back to List</Button>
            </div>
        );
    }

    const isClient = address && escrow.client.toLowerCase() === address.toLowerCase();
    const isProvider = address && escrow.provider.toLowerCase() === address.toLowerCase();
    const isArbiter = false; // TODO: Check if address is arbiter

    const escrowAddress = chain ? ESCROW_ADDRESSES[chain.id] : undefined;

    const handleFund = () => {
        if (!escrowAddress) return;
        writeContract({
            address: escrowAddress,
            abi: ESCROW_ABI,
            functionName: 'fundEscrow',
            args: [BigInt(escrow.escrowId)],
            value: escrow.token === '0x0000000000000000000000000000000000000000' ? BigInt(escrow.amount) : BigInt(0),
        });
    };

    const handleRelease = () => {
        if (!escrowAddress) return;
        writeContract({
            address: escrowAddress,
            abi: ESCROW_ABI,
            functionName: 'releaseToProvider',
            args: [BigInt(escrow.escrowId)],
        });
    };

    const handleRefund = () => {
        if (!escrowAddress) return;
        writeContract({
            address: escrowAddress,
            abi: ESCROW_ABI,
            functionName: 'refundToClient',
            args: [BigInt(escrow.escrowId)],
        });
    };

    const handleDispute = () => {
        if (!escrowAddress) return;
        writeContract({
            address: escrowAddress,
            abi: ESCROW_ABI,
            functionName: 'openDispute',
            args: [BigInt(escrow.escrowId), disputeReason],
        });
        setIsDisputeDialogOpen(false);
    };

    const StatusIcon = STATUS_MAP[escrow.status]?.icon || Loader2;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.push('/escrows')} className="pl-0 hover:pl-2 transition-all">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Escrows
                </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl mb-2">Escrow #{escrow.escrowId}</CardTitle>
                                    <CardDescription>
                                        Created on {format(new Date(escrow.createdAt), 'PPP')}
                                    </CardDescription>
                                </div>
                                <Badge className={`${STATUS_MAP[escrow.status]?.color} text-white px-3 py-1 text-sm flex items-center gap-2`}>
                                    <StatusIcon className="h-4 w-4" />
                                    {STATUS_MAP[escrow.status]?.label}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-semibold mb-2">Description</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">{escrow.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-muted rounded-lg">
                                    <span className="text-sm text-muted-foreground block mb-1">Amount</span>
                                    <span className="text-xl font-bold">
                                        {formatEther(BigInt(escrow.amount))} {escrow.token === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'Token'}
                                    </span>
                                </div>
                                <div className="p-4 bg-muted rounded-lg">
                                    <span className="text-sm text-muted-foreground block mb-1">Deadline</span>
                                    <span className="text-lg font-medium">
                                        {escrow.deadline ? format(new Date(escrow.deadline), 'PPP') : 'No deadline'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 border rounded-md">
                                    <div>
                                        <span className="text-sm text-muted-foreground block">Client</span>
                                        <span className="font-mono text-sm">{escrow.client}</span>
                                    </div>
                                    {isClient && <Badge variant="outline">You</Badge>}
                                </div>
                                <div className="flex justify-between items-center p-3 border rounded-md">
                                    <div>
                                        <span className="text-sm text-muted-foreground block">Provider</span>
                                        <span className="font-mono text-sm">{escrow.provider}</span>
                                    </div>
                                    {isProvider && <Badge variant="outline">You</Badge>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline/History could go here */}
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Client Actions */}
                            {isClient && escrow.status === 0 && (
                                <Button className="w-full" onClick={handleFund} disabled={isPending || isConfirming}>
                                    {isPending || isConfirming ? <Loader2 className="animate-spin mr-2" /> : null}
                                    Fund Escrow
                                </Button>
                            )}

                            {isClient && escrow.status === 1 && (
                                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleRelease} disabled={isPending || isConfirming}>
                                    Release Funds
                                </Button>
                            )}

                            {/* Provider Actions */}
                            {isProvider && escrow.status === 1 && (
                                <Button className="w-full" variant="outline" onClick={handleRefund} disabled={isPending || isConfirming}>
                                    Refund Client
                                </Button>
                            )}

                            {/* Dispute Action (Both) */}
                            {(isClient || isProvider) && (escrow.status === 1 || escrow.status === 0) && (
                                <Dialog open={isDisputeDialogOpen} onOpenChange={setIsDisputeDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="destructive" className="w-full">
                                            Open Dispute
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Open a Dispute</DialogTitle>
                                            <DialogDescription>
                                                This will freeze the funds and summon an arbitrator. This action cannot be undone.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Reason for dispute</Label>
                                                <Textarea
                                                    placeholder="Explain why you are opening a dispute..."
                                                    value={disputeReason}
                                                    onChange={(e) => setDisputeReason(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsDisputeDialogOpen(false)}>Cancel</Button>
                                            <Button variant="destructive" onClick={handleDispute} disabled={!disputeReason}>
                                                Confirm Dispute
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}

                            {/* Status Messages */}
                            {escrow.status === 2 && (
                                <div className="p-4 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md text-center">
                                    Funds have been released to the provider.
                                </div>
                            )}
                            {escrow.status === 3 && (
                                <div className="p-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-center">
                                    Funds have been refunded to the client.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function Badge({ children, className, variant = 'default' }: { children: React.ReactNode; className?: string; variant?: 'default' | 'outline' }) {
    const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
    const variants = {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        outline: "text-foreground border border-input hover:bg-accent hover:text-accent-foreground",
    };

    // If className has bg color, it overrides default
    return (
        <span className={cn(baseStyles, variants[variant], className)}>
            {children}
        </span>
    );
}

import { cn } from "@/lib/utils";
