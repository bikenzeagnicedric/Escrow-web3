import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Escrow } from '../../escrow/entities/escrow.entity';

export enum DisputeStatus {
    OPEN = 'OPEN',
    RESOLVED = 'RESOLVED',
}

@Entity('disputes')
export class Dispute {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    escrowId: string;

    @ManyToOne(() => Escrow)
    @JoinColumn({ name: 'escrowId' })
    escrow: Escrow;

    @Column({ length: 42 })
    opener: string;

    @Column({ type: 'text' })
    reason: string;

    @Column({
        type: 'enum',
        enum: DisputeStatus,
        default: DisputeStatus.OPEN,
    })
    status: DisputeStatus;

    @Column({ length: 42, nullable: true })
    resolver: string;

    @Column({ type: 'boolean', nullable: true })
    inFavorOfClient: boolean;

    @Column({ type: 'text', nullable: true })
    resolution: string;

    @Column({ type: 'timestamp', nullable: true })
    resolvedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
