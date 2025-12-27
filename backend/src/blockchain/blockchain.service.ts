import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

// ABI will be imported from compiled contracts
const ESCROW_ABI = [
    'event EscrowCreated(uint256 indexed escrowId, address indexed client, address indexed provider, address token, uint256 amount, uint256 deadline)',
    'event EscrowFunded(uint256 indexed escrowId, address indexed funder, uint256 amount)',
    'event EscrowReleased(uint256 indexed escrowId, address indexed provider, uint256 amount, uint256 fee)',
    'event EscrowRefunded(uint256 indexed escrowId, address indexed client, uint256 amount)',
    'event DisputeOpened(uint256 indexed escrowId, address indexed opener, uint256 timestamp)',
    'event DisputeResolved(uint256 indexed escrowId, address indexed arbitrator, bool inFavorOfClient)',
    'event EscrowCancelled(uint256 indexed escrowId, address indexed client)',
    'function getEscrow(uint256 escrowId) view returns (tuple(address client, address provider, address arbitrator, address token, uint256 amount, uint256 fee, uint8 status, uint256 createdAt, uint256 deadline, string description))',
    'function getEscrowCount() view returns (uint256)',
];

export interface EscrowData {
    client: string;
    provider: string;
    arbitrator: string;
    token: string;
    amount: bigint;
    fee: bigint;
    status: number;
    createdAt: bigint;
    deadline: bigint;
    description: string;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
    private readonly logger = new Logger(BlockchainService.name);
    private providers: Map<number, ethers.JsonRpcProvider> = new Map();
    private contracts: Map<number, ethers.Contract> = new Map();

    constructor(private configService: ConfigService) { }

    async onModuleInit() {
        await this.initializeProviders();
    }

    private async initializeProviders() {
        // Ethereum/Sepolia
        const ethRpcUrl = this.configService.get('ETH_RPC_URL');
        const ethChainId = this.configService.get<number>('ETH_CHAIN_ID');
        const ethContractAddress = this.configService.get('ETH_ESCROW_CONTRACT_ADDRESS');

        if (ethRpcUrl && ethContractAddress) {
            const provider = new ethers.JsonRpcProvider(ethRpcUrl);
            this.providers.set(ethChainId, provider);
            this.contracts.set(
                ethChainId,
                new ethers.Contract(ethContractAddress, ESCROW_ABI, provider),
            );
            this.logger.log(`✅ Connected to Ethereum/Sepolia (Chain ID: ${ethChainId})`);
        }

        // Polygon
        const polygonRpcUrl = this.configService.get('POLYGON_RPC_URL');
        const polygonChainId = this.configService.get<number>('POLYGON_CHAIN_ID');
        const polygonContractAddress = this.configService.get('POLYGON_ESCROW_CONTRACT_ADDRESS');

        if (polygonRpcUrl && polygonContractAddress) {
            const provider = new ethers.JsonRpcProvider(polygonRpcUrl);
            this.providers.set(polygonChainId, provider);
            this.contracts.set(
                polygonChainId,
                new ethers.Contract(polygonContractAddress, ESCROW_ABI, provider),
            );
            this.logger.log(`✅ Connected to Polygon (Chain ID: ${polygonChainId})`);
        }

        // Mumbai
        const mumbaiRpcUrl = this.configService.get('MUMBAI_RPC_URL');
        const mumbaiChainId = this.configService.get<number>('MUMBAI_CHAIN_ID');
        const mumbaiContractAddress = this.configService.get('MUMBAI_ESCROW_CONTRACT_ADDRESS');

        if (mumbaiRpcUrl && mumbaiContractAddress) {
            const provider = new ethers.JsonRpcProvider(mumbaiRpcUrl);
            this.providers.set(mumbaiChainId, provider);
            this.contracts.set(
                mumbaiChainId,
                new ethers.Contract(mumbaiContractAddress, ESCROW_ABI, provider),
            );
            this.logger.log(`✅ Connected to Mumbai (Chain ID: ${mumbaiChainId})`);
        }
    }

    getProvider(chainId: number): ethers.JsonRpcProvider {
        const provider = this.providers.get(chainId);
        if (!provider) {
            throw new Error(`Provider not found for chain ID: ${chainId}`);
        }
        return provider;
    }

    getContract(chainId: number): ethers.Contract {
        const contract = this.contracts.get(chainId);
        if (!contract) {
            throw new Error(`Contract not found for chain ID: ${chainId}`);
        }
        return contract;
    }

    async getEscrow(chainId: number, escrowId: number): Promise<EscrowData> {
        const contract = this.getContract(chainId);
        const escrowData = await contract.getEscrow(escrowId);
        return {
            client: escrowData.client,
            provider: escrowData.provider,
            arbitrator: escrowData.arbitrator,
            token: escrowData.token,
            amount: escrowData.amount,
            fee: escrowData.fee,
            status: escrowData.status,
            createdAt: escrowData.createdAt,
            deadline: escrowData.deadline,
            description: escrowData.description,
        };
    }

    async getEscrowCount(chainId: number): Promise<number> {
        const contract = this.getContract(chainId);
        const count = await contract.getEscrowCount();
        return Number(count);
    }

    async getBlockNumber(chainId: number): Promise<number> {
        const provider = this.getProvider(chainId);
        return await provider.getBlockNumber();
    }

    async getTransactionReceipt(chainId: number, txHash: string) {
        const provider = this.getProvider(chainId);
        return await provider.getTransactionReceipt(txHash);
    }

    getSupportedChainIds(): number[] {
        return Array.from(this.providers.keys());
    }
}
