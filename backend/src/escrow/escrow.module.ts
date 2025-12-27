import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EscrowController } from './escrow.controller';
import { EscrowService } from './escrow.service';
import { Escrow } from './entities/escrow.entity';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
    imports: [TypeOrmModule.forFeature([Escrow]), BlockchainModule],
    controllers: [EscrowController],
    providers: [EscrowService],
    exports: [EscrowService],
})
export class EscrowModule { }
