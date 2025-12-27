'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, isAddress } from 'viem';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ESCROW_ABI } from '@/lib/contracts';
import { ESCROW_ADDRESSES } from '@/lib/wagmi';

const formSchema = z.object({
    provider: z.string().refine((val) => isAddress(val), {
        message: 'Invalid Ethereum address',
    }),
    amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: 'Amount must be a positive number',
    }),
    token: z.string(),
    deadline: z.string().min(1, 'Deadline is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
});

const NATIVE_TOKEN = '0x0000000000000000000000000000000000000000';

export default function CreateEscrowPage() {
    const { address, chain } = useAccount();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { writeContract, data: hash, error: writeError } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            provider: '',
            amount: '',
            token: 'ETH',
            deadline: '',
            description: '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!address || !chain) {
            toast({
                title: 'Wallet not connected',
                description: 'Please connect your wallet to create an escrow.',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const escrowAddress = ESCROW_ADDRESSES[chain.id];
            if (!escrowAddress || escrowAddress === '0x') {
                throw new Error('Escrow contract not deployed on this network');
            }

            const deadlineTimestamp = Math.floor(new Date(values.deadline).getTime() / 1000);
            const amountWei = parseEther(values.amount);
            const tokenAddress = values.token === 'ETH' ? NATIVE_TOKEN : values.token;

            // If native ETH, send value with transaction
            const value = values.token === 'ETH' ? amountWei : BigInt(0);

            writeContract({
                address: escrowAddress,
                abi: ESCROW_ABI,
                functionName: 'createEscrow',
                args: [
                    values.provider as `0x${string}`,
                    tokenAddress as `0x${string}`,
                    amountWei,
                    BigInt(deadlineTimestamp),
                    values.description,
                ],
                value,
            });

        } catch (error) {
            console.error(error);
            toast({
                title: 'Error',
                description: 'Failed to create escrow. Please try again.',
                variant: 'destructive',
            });
            setIsSubmitting(false);
        }
    }

    // Handle success/error effects
    if (isConfirmed && isSubmitting) {
        setIsSubmitting(false);
        toast({
            title: 'Escrow Created!',
            description: 'Your escrow has been successfully created on the blockchain.',
        });
        router.push('/escrows');
    }

    if (writeError && isSubmitting) {
        setIsSubmitting(false);
        toast({
            title: 'Transaction Failed',
            description: writeError.message,
            variant: 'destructive',
        });
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="mb-6">
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Create New Escrow</CardTitle>
                    <CardDescription>
                        Set up a secure transaction with a provider. Funds will be held in the smart contract.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="provider"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Provider Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0x..." {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            The wallet address of the service provider.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amount</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.000001" placeholder="0.0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="token"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Token</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select token" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="ETH">ETH (Native)</SelectItem>
                                                    {/* Add more tokens here later */}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="deadline"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Deadline</FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            When the service should be completed.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe the service or product agreement..."
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={isSubmitting || isConfirming}>
                                {isSubmitting || isConfirming ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isConfirming ? 'Confirming Transaction...' : 'Waiting for Wallet...'}
                                    </>
                                ) : (
                                    'Create Escrow'
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
