import { IsEthereumAddress, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetNonceDto {
    @ApiProperty({
        description: 'Ethereum wallet address',
        example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    })
    @IsEthereumAddress()
    @IsNotEmpty()
    address: string;
}

export class VerifySignatureDto {
    @ApiProperty({
        description: 'Ethereum wallet address',
        example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    })
    @IsEthereumAddress()
    @IsNotEmpty()
    address: string;

    @ApiProperty({
        description: 'Signed message',
        example: '0x...',
    })
    @IsNotEmpty()
    signature: string;

    @ApiProperty({
        description: 'Original message that was signed',
    })
    @IsNotEmpty()
    message: string;
}

export class RefreshTokenDto {
    @ApiProperty({
        description: 'Refresh token',
    })
    @IsNotEmpty()
    refreshToken: string;
}
