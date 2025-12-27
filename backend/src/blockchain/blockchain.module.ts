import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { EventListenerService } from './event-listener.service';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [BlockchainService, EventListenerService],
    exports: [BlockchainService, EventListenerService],
})
export class BlockchainModule { }
