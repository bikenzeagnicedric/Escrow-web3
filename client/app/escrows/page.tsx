'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { formatEther } from 'viem';
import { Loader2, Plus, Filter } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getEscrows, Escrow } from '@/lib/api';
import { Badge } from '@/components/ui/badge'; // Need to create Badge
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

const STATUS_MAP: Record<number, { label: string; color: string }> = {
    0: { label: 'Created', color: 'bg-blue-500' },
    1: { label: 'Funded', color: 'bg-green-500' },
    2: { label: 'Released', color: 'bg-purple-500' },
    3: { label: 'Refunded', color: 'bg-gray-500' },
    4: { label: 'Disputed', color: 'bg-red-500' },
    5: { label: 'Resolved', color: 'bg-orange-500' },
    6: { label: 'Cancelled', color: 'bg-gray-400' },
};

export default function EscrowsPage() {
    const { address } = useAccount();
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const { data: escrows, isLoading, error } = useQuery({
        queryKey: ['escrows', address, statusFilter],
        queryFn: () => getEscrows({
            // For now fetch all, filtering by address should be done by backend or passed here
            // If backend supports OR query for client/provider, use that.
            // Otherwise we might need to fetch all and filter client-side or use specific endpoints.
            // The backend findAll supports client and provider params.
            // Let's try to fetch where user is client OR provider if possible, but the API might not support OR.
            // For now, let's just fetch all and filter client side if the API returns everything,
            // OR if the API is restricted to the logged in user (which it might be if we implement that logic).
            // Actually, the backend `findAll` takes query params.
            status: statusFilter !== 'all' ? Number(statusFilter) : undefined,
        }),
        enabled: !!address, // Only fetch if connected
    });

    if (!address) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
                <p className="text-muted-foreground mb-8">Please connect your wallet to view your escrows.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-20 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Client-side filtering for my escrows (since backend API might return all if not filtered)
    // Ideally backend should handle "my escrows"
    const myEscrows = escrows?.filter(
        (e) => e.client.toLowerCase() === address.toLowerCase() || e.provider.toLowerCase() === address.toLowerCase()
    ) || [];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold">My Escrows</h1>
                    <p className="text-muted-foreground">Manage your secure transactions</p>
                </div>
                <div className="flex items-center gap-4">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="0">Created</SelectItem>
                            <SelectItem value="1">Funded</SelectItem>
                            <SelectItem value="2">Released</SelectItem>
                            <SelectItem value="4">Disputed</SelectItem>
                        </SelectContent>
                    </Select>
                    <Link href="/escrows/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Escrow
                        </Button>
                    </Link>
                </div>
            </div>

            {myEscrows.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <p className="text-muted-foreground mb-4">No escrows found.</p>
                        <Link href="/escrows/create">
                            <Button variant="outline">Create your first escrow</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myEscrows.map((escrow) => (
                        <Link href={`/escrows/${escrow.id}`} key={escrow.id}>
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg font-semibold truncate" title={escrow.description}>
                                            {escrow.description || `Escrow #${escrow.escrowId}`}
                                        </CardTitle>
                                        <Badge className={STATUS_MAP[escrow.status]?.color}>
                                            {STATUS_MAP[escrow.status]?.label}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        ID: {escrow.escrowId} • {format(new Date(escrow.createdAt), 'MMM d, yyyy')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Amount:</span>
                                            <span className="font-bold">
                                                {formatEther(BigInt(escrow.amount))} {escrow.token === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'Token'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Role:</span>
                                            <span>
                                                {escrow.client.toLowerCase() === address.toLowerCase() ? 'Client' : 'Provider'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${className}`}>
            {children}
        </span>
    );
}
