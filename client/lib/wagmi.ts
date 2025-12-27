import { http, createConfig } from 'wagmi';
import { sepolia, polygon, polygonMumbai } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

export const config = createConfig({
    chains: [sepolia, polygon, polygonMumbai],
    connectors: [
        injected(),
        walletConnect({ projectId }),
    ],
    transports: {
        [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC),
        [polygon.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC),
        [polygonMumbai.id]: http(process.env.NEXT_PUBLIC_MUMBAI_RPC),
    },
});

// Contract addresses by chain
export const ESCROW_ADDRESSES: Record<number, `0x${string}`> = {
    [sepolia.id]: (process.env.NEXT_PUBLIC_SEPOLIA_ESCROW_ADDRESS as `0x${string}`) || '0x',
    [polygon.id]: (process.env.NEXT_PUBLIC_POLYGON_ESCROW_ADDRESS as `0x${string}`) || '0x',
    [polygonMumbai.id]: (process.env.NEXT_PUBLIC_MUMBAI_ESCROW_ADDRESS as `0x${string}`) || '0x',
};
