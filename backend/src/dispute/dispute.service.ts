import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispute, DisputeStatus } from './entities/dispute.entity';
import { EscrowService } from '../escrow/escrow.service';
import { EscrowStatus } from '../escrow/entities/escrow.entity';

@Injectable()
export class DisputeService {
    constructor(
        @InjectRepository(Dispute)
        private disputeRepository: Repository<Dispute>,
        private escrowService: EscrowService,
    ) { }

    async create(escrowId: string, opener: string, reason: string): Promise<Dispute> {
        const escrow = await this.escrowService.findOne(escrowId);

        if (escrow.status !== EscrowStatus.FUNDED) {
            throw new BadRequestException('Escrow must be in FUNDED status to open a dispute');
        }

        const normalizedOpener = opener.toLowerCase();

        if (
            normalizedOpener !== escrow.client.toLowerCase() &&
            normalizedOpener !== escrow.provider.toLowerCase()
        ) {
            throw new BadRequestException('Only client or provider can open a dispute');
        }

        const dispute = this.disputeRepository.create({
            escrowId,
            opener: normalizedOpener,
            reason,
            status: DisputeStatus.OPEN,
        });

        return this.disputeRepository.save(dispute);
    }

    async findAll(filters?: { status?: DisputeStatus; escrowId?: string }): Promise<Dispute[]> {
        const query = this.disputeRepository
            .createQueryBuilder('dispute')
            .leftJoinAndSelect('dispute.escrow', 'escrow');

        if (filters?.status) {
            query.andWhere('dispute.status = :status', { status: filters.status });
        }

        if (filters?.escrowId) {
            query.andWhere('dispute.escrowId = :escrowId', { escrowId: filters.escrowId });
        }

        query.orderBy('dispute.createdAt', 'DESC');

        return query.getMany();
    }

    async findOne(id: string): Promise<Dispute> {
        const dispute = await this.disputeRepository.findOne({
            where: { id },
            relations: ['escrow'],
        });

        if (!dispute) {
            throw new NotFoundException(`Dispute with ID ${id} not found`);
        }

        return dispute;
    }

    async resolve(
        id: string,
        resolver: string,
        inFavorOfClient: boolean,
        resolution: string,
    ): Promise<Dispute> {
        const dispute = await this.findOne(id);

        if (dispute.status !== DisputeStatus.OPEN) {
            throw new BadRequestException('Dispute is already resolved');
        }

        dispute.status = DisputeStatus.RESOLVED;
        dispute.resolver = resolver.toLowerCase();
        dispute.inFavorOfClient = inFavorOfClient;
        dispute.resolution = resolution;
        dispute.resolvedAt = new Date();

        return this.disputeRepository.save(dispute);
    }
}
