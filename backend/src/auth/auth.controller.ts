import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GetNonceDto, VerifySignatureDto, RefreshTokenDto } from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get('nonce')
    @ApiOperation({ summary: 'Get nonce for wallet signature' })
    @ApiResponse({ status: 200, description: 'Nonce generated successfully' })
    getNonce(@Query() getNonceDto: GetNonceDto) {
        const nonce = this.authService.generateNonce(getNonceDto.address);
        return {
            nonce,
            message: `Sign this message to authenticate with Smart Escrow:\n\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`,
        };
    }

    @Post('verify')
    @ApiOperation({ summary: 'Verify wallet signature and get JWT' })
    @ApiResponse({ status: 200, description: 'Authentication successful' })
    @ApiResponse({ status: 401, description: 'Invalid signature' })
    async verifySignature(@Body() verifySignatureDto: VerifySignatureDto) {
        const tokens = await this.authService.verifySignature(
            verifySignatureDto.address,
            verifySignatureDto.signature,
            verifySignatureDto.message,
        );

        return {
            ...tokens,
            address: verifySignatureDto.address.toLowerCase(),
        };
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshToken(refreshTokenDto.refreshToken);
    }
}
