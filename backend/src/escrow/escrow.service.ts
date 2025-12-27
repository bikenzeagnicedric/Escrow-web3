import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Escrow, EscrowStatus } from './entities/escrow.entity';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class EscrowService {
    constructor(
        @InjectRepository(Escrow)
        private escrowRepository: Repository<Escrow>,
        private blockchainService: BlockchainService,
    ) { }

    async findAll(filters?: {
        chainId?: number;
        client?: string;
        provider?: string;
        status?: EscrowStatus;
    }): Promise<Escrow[]> {
        const query = this.escrowRepository.createQueryBuilder('escrow');

        if (filters?.chainId) {
            query.andWhere('escrow.chainId = :chainId', { chainId: filters.chainId });
        }

        if (filters?.client) {
            query.andWhere('LOWER(escrow.client) = LOWER(:client)', { client: filters.client });
        }

        if (filters?.provider) {
            query.andWhere('LOWER(escrow.provider) = LOWER(:provider)', { provider: filters.provider });
        }

        if (filters?.status !== undefined) {
            query.andWhere('escrow.status = :status', { status: filters.status });
        }

        query.orderBy('escrow.createdAt', 'DESC');

        return query.getMany();
    }

    async findOne(id: string): Promise<Escrow> {
        const escrow = await this.escrowRepository.findOne({ where: { id } });

        if (!escrow) {
            throw new NotFoundException(`Escrow with ID ${id} not found`);
        }

        return escrow;
    }

    async findByChainAndEscrowId(chainId: number, escrowId: number): Promise<Escrow> {
        const escrow = await this.escrowRepository.findOne({
            where: { chainId, escrowId },
        });

        if (!escrow) {
            throw new NotFoundException(
                `Escrow with chain ID ${chainId} and escrow ID ${escrowId} not found`,
            );
        }

        return escrow;
    }

    async findByAddress(address: string): Promise<Escrow[]> {
        const normalizedAddress = address.toLowerCase();

        return this.escrowRepository
            .createQueryBuilder('escrow')
            .where('LOWER(escrow.client) = :address OR LOWER(escrow.provider) = :address', {
                address: normalizedAddress,
            })
            .orderBy('escrow.createdAt', 'DESC')
            .getMany();
    }

    async syncEscrowStatus(id: string): Promise<Escrow> {
        const escrow = await this.findOne(id);

        // Fetch latest data from blockchain
        const onChainData = await this.blockchainService.getEscrow(
            escrow.chainId,
            escrow.escrowId,
        );

        // Update status if changed
        if (escrow.status !== onChainData.status) {
            escrow.status = onChainData.status;
            await this.escrowRepository.save(escrow);
        }

        return escrow;
    }

    async getStatistics(address?: string) {
        const query = this.escrowRepository.createQueryBuilder('escrow');

        if (address) {
            const normalizedAddress = address.toLowerCase();
            query.where('LOWER(escrow.client) = :address OR LOWER(escrow.provider) = :address', {
                address: normalizedAddress,
            });
        }

        const total = await query.getCount();

        const byStatus = await query
            .select('escrow.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('escrow.status')
            .getRawMany();

        const totalVolume = await query
            .select('SUM(CAST(escrow.amount AS BIGINT))', 'total')
            .getRawOne();

        return {
            total,
            byStatus: byStatus.reduce((acc, item) => {
                acc[EscrowStatus[item.status]] = parseInt(item.count);
                return acc;
            }, {}),
            totalVolume: totalVolume.total || '0',
        };
    }
}
