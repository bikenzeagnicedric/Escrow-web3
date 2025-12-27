import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
    Post,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { EscrowService } from './escrow.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { EscrowStatus } from './entities/escrow.entity';

@ApiTags('escrows')
@Controller('escrows')
export class EscrowController {
    constructor(private readonly escrowService: EscrowService) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get all escrows with optional filters' })
    @ApiQuery({ name: 'chainId', required: false, type: Number })
    @ApiQuery({ name: 'client', required: false, type: String })
    @ApiQuery({ name: 'provider', required: false, type: String })
    @ApiQuery({ name: 'status', required: false, enum: EscrowStatus })
    @ApiResponse({ status: 200, description: 'List of escrows' })
    async findAll(
        @Query('chainId') chainId?: number,
        @Query('client') client?: string,
        @Query('provider') provider?: string,
        @Query('status') status?: EscrowStatus,
    ) {
        return this.escrowService.findAll({
            chainId: chainId ? Number(chainId) : undefined,
            client,
            provider,
            status: status !== undefined ? Number(status) : undefined,
        });
    }

    @Get('stats')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get escrow statistics' })
    @ApiQuery({ name: 'address', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Escrow statistics' })
    async getStatistics(@Query('address') address?: string) {
        return this.escrowService.getStatistics(address);
    }

    @Get('user/:address')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get escrows for a specific address' })
    @ApiResponse({ status: 200, description: 'User escrows' })
    async findByAddress(@Param('address') address: string) {
        return this.escrowService.findByAddress(address);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get escrow by ID' })
    @ApiResponse({ status: 200, description: 'Escrow details' })
    @ApiResponse({ status: 404, description: 'Escrow not found' })
    async findOne(@Param('id') id: string) {
        return this.escrowService.findOne(id);
    }

    @Post(':id/sync')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Sync escrow status from blockchain' })
    @ApiResponse({ status: 200, description: 'Escrow synced successfully' })
    async syncStatus(@Param('id') id: string) {
        return this.escrowService.syncEscrowStatus(id);
    }
}
