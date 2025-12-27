import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockchainService } from './blockchain.service';
import { Escrow } from '../escrow/entities/escrow.entity';

@Injectable()
export class EventListenerService {
    private readonly logger = new Logger(EventListenerService.name);
    private lastSyncedBlocks: Map<number, number> = new Map();

    constructor(
        private blockchainService: BlockchainService,
        private configService: ConfigService,
        @InjectRepository(Escrow)
        private escrowRepository: Repository<Escrow>,
    ) { }

    async onModuleInit() {
        // Initialize last synced blocks
        const startBlock = this.configService.get<number>('START_BLOCK') || 0;
        for (const chainId of this.blockchainService.getSupportedChainIds()) {
            this.lastSyncedBlocks.set(chainId, startBlock);
        }

        // Initial sync
        await this.syncBlockchainEvents();
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async syncBlockchainEvents() {
        this.logger.log('🔄 Syncing blockchain events...');

        for (const chainId of this.blockchainService.getSupportedChainIds()) {
            try {
                await this.syncChainEvents(chainId);
            } catch (error) {
                this.logger.error(`Error syncing chain ${chainId}:`, error.message);
            }
        }
    }

    private async syncChainEvents(chainId: number) {
        const contract = this.blockchainService.getContract(chainId);
        const currentBlock = await this.blockchainService.getBlockNumber(chainId);
        const fromBlock = this.lastSyncedBlocks.get(chainId) || 0;

        if (fromBlock >= currentBlock) {
            return;
        }

        this.logger.log(`Syncing chain ${chainId} from block ${fromBlock} to ${currentBlock}`);

        // Listen to EscrowCreated events
        const createdFilter = contract.filters.EscrowCreated();
        const createdEvents = await contract.queryFilter(createdFilter, fromBlock, currentBlock);

        for (const event of createdEvents) {
            await this.handleEscrowCreated(chainId, event);
        }

        // Listen to EscrowFunded events
        const fundedFilter = contract.filters.EscrowFunded();
        const fundedEvents = await contract.queryFilter(fundedFilter, fromBlock, currentBlock);

        for (const event of fundedEvents) {
            await this.handleEscrowFunded(chainId, event);
        }

        // Listen to other events (Released, Refunded, Disputed, etc.)
        // ... similar pattern

        this.lastSyncedBlocks.set(chainId, currentBlock);
    }

    private async handleEscrowCreated(chainId: number, event: any) {
        const { escrowId, client, provider, token, amount, deadline } = event.args;

        // Check if already exists
        const existing = await this.escrowRepository.findOne({
            where: { chainId, escrowId: Number(escrowId) },
        });

        if (existing) {
            return;
        }

        // Fetch full escrow data from contract
        const escrowData = await this.blockchainService.getEscrow(chainId, Number(escrowId));

        const escrow = this.escrowRepository.create({
            chainId,
            escrowId: Number(escrowId),
            client: client.toLowerCase(),
            provider: provider.toLowerCase(),
            arbitrator: escrowData.arbitrator.toLowerCase(),
            token: token.toLowerCase(),
            amount: amount.toString(),
            fee: escrowData.fee.toString(),
            status: escrowData.status,
            deadline: deadline > 0 ? new Date(Number(deadline) * 1000) : null,
            description: escrowData.description,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
        });

        await this.escrowRepository.save(escrow);
        this.logger.log(`✅ Escrow created: Chain ${chainId}, ID ${escrowId}`);
    }

    private async handleEscrowFunded(chainId: number, event: any) {
        const { escrowId } = event.args;

        const escrow = await this.escrowRepository.findOne({
            where: { chainId, escrowId: Number(escrowId) },
        });

        if (escrow) {
            escrow.status = 1; // FUNDED
            await this.escrowRepository.save(escrow);
            this.logger.log(`✅ Escrow funded: Chain ${chainId}, ID ${escrowId}`);
        }
    }
}
