import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { DisputeService } from './dispute.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DisputeStatus } from './entities/dispute.entity';

@ApiTags('disputes')
@Controller('disputes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DisputeController {
    constructor(private readonly disputeService: DisputeService) { }

    @Post()
    @ApiOperation({ summary: 'Open a new dispute' })
    @ApiResponse({ status: 201, description: 'Dispute created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid request' })
    async create(
        @Body() createDisputeDto: { escrowId: string; reason: string },
        @CurrentUser() user: any,
    ) {
        return this.disputeService.create(
            createDisputeDto.escrowId,
            user.address,
            createDisputeDto.reason,
        );
    }

    @Get()
    @ApiOperation({ summary: 'Get all disputes' })
    @ApiResponse({ status: 200, description: 'List of disputes' })
    async findAll(
        @Query('status') status?: DisputeStatus,
        @Query('escrowId') escrowId?: string,
    ) {
        return this.disputeService.findAll({ status, escrowId });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get dispute by ID' })
    @ApiResponse({ status: 200, description: 'Dispute details' })
    @ApiResponse({ status: 404, description: 'Dispute not found' })
    async findOne(@Param('id') id: string) {
        return this.disputeService.findOne(id);
    }

    @Post(':id/resolve')
    @ApiOperation({ summary: 'Resolve a dispute (arbitrator only)' })
    @ApiResponse({ status: 200, description: 'Dispute resolved successfully' })
    @ApiResponse({ status: 400, description: 'Invalid request' })
    async resolve(
        @Param('id') id: string,
        @Body() resolveDto: { inFavorOfClient: boolean; resolution: string },
        @CurrentUser() user: any,
    ) {
        return this.disputeService.resolve(
            id,
            user.address,
            resolveDto.inFavorOfClient,
            resolveDto.resolution,
        );
    }
}
