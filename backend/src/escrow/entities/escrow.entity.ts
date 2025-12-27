import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export enum EscrowStatus {
    CREATED = 0,
    FUNDED = 1,
    DISPUTED = 2,
    RELEASED = 3,
    REFUNDED = 4,
    CANCELLED = 5,
}

@Entity('escrows')
@Index(['chainId', 'escrowId'], { unique: true })
@Index(['client'])
@Index(['provider'])
@Index(['status'])
export class Escrow {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int' })
    chainId: number;

    @Column({ type: 'int' })
    escrowId: number;

    @Column({ length: 42 })
    client: string;

    @Column({ length: 42 })
    provider: string;

    @Column({ length: 42 })
    arbitrator: string;

    @Column({ length: 42 })
    token: string;

    @Column({ type: 'varchar', length: 78 })
    amount: string;

    @Column({ type: 'varchar', length: 78 })
    fee: string;

    @Column({
        type: 'enum',
        enum: EscrowStatus,
        default: EscrowStatus.CREATED,
    })
    status: EscrowStatus;

    @Column({ type: 'timestamp', nullable: true })
    deadline: Date;

    @Column({ type: 'text' })
    description: string;

    @Column({ length: 66 })
    transactionHash: string;

    @Column({ type: 'int' })
    blockNumber: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
