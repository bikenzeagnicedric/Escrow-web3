import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Users, Zap } from 'lucide-react';

export default function Home() {
    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="border-b">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Shield className="h-8 w-8 text-primary" />
                        <h1 className="text-2xl font-bold">Smart Escrow</h1>
                    </div>
                    <ConnectButton />
                </div>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                    Decentralized Escrow Platform
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Secure your transactions with blockchain-powered escrow. Built-in dispute resolution and arbitration for complete peace of mind.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link href="/escrows/create">
                        <Button size="lg" className="text-lg">
                            Create Escrow
                        </Button>
                    </Link>
                    <Link href="/escrows">
                        <Button size="lg" variant="outline" className="text-lg">
                            Browse Escrows
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Features */}
            <section className="container mx-auto px-4 py-20">
                <h3 className="text-3xl font-bold text-center mb-12">Why Smart Escrow?</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader>
                            <Shield className="h-10 w-10 text-primary mb-2" />
                            <CardTitle>Secure</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                Non-custodial smart contracts ensure your funds are always safe and under your control.
                            </CardDescription>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Lock className="h-10 w-10 text-primary mb-2" />
                            <CardTitle>Trustless</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                No intermediaries. Smart contracts automatically execute based on predefined conditions.
                            </CardDescription>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Users className="h-10 w-10 text-primary mb-2" />
                            <CardTitle>Dispute Resolution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                Built-in arbitration system to resolve conflicts fairly and transparently.
                            </CardDescription>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Zap className="h-10 w-10 text-primary mb-2" />
                            <CardTitle>Multi-Chain</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                Support for Ethereum, Polygon, and more. Choose the network that works for you.
                            </CardDescription>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* How It Works */}
            <section className="container mx-auto px-4 py-20">
                <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
                <div className="max-w-3xl mx-auto space-y-8">
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                            1
                        </div>
                        <div>
                            <h4 className="text-xl font-semibold mb-2">Create Escrow</h4>
                            <p className="text-muted-foreground">
                                Client creates an escrow specifying the provider, amount, and terms.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                            2
                        </div>
                        <div>
                            <h4 className="text-xl font-semibold mb-2">Fund Escrow</h4>
                            <p className="text-muted-foreground">
                                Client deposits funds (ETH or ERC20 tokens) into the smart contract.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                            3
                        </div>
                        <div>
                            <h4 className="text-xl font-semibold mb-2">Complete Work</h4>
                            <p className="text-muted-foreground">
                                Provider delivers the service or product as agreed.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                            4
                        </div>
                        <div>
                            <h4 className="text-xl font-semibold mb-2">Release Funds</h4>
                            <p className="text-muted-foreground">
                                Client releases funds to provider, or arbitrator resolves any disputes.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t mt-20">
                <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
                    <p>© 2024 Smart Escrow. Built with ❤️ on the blockchain.</p>
                </div>
            </footer>
        </div>
    );
}
