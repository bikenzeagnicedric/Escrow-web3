import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class AuthService {
    private nonces: Map<string, { nonce: string; expiresAt: number }> = new Map();

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    /**
     * Generate a nonce for wallet signature
     */
    generateNonce(address: string): string {
        const nonce = ethers.hexlify(ethers.randomBytes(32));
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        this.nonces.set(address.toLowerCase(), { nonce, expiresAt });

        // Clean up expired nonces
        this.cleanupExpiredNonces();

        return nonce;
    }

    /**
     * Verify wallet signature and generate JWT
     */
    async verifySignature(
        address: string,
        signature: string,
        message: string,
    ): Promise<{ accessToken: string; refreshToken: string }> {
        const normalizedAddress = address.toLowerCase();

        // Check if nonce exists and is valid
        const nonceData = this.nonces.get(normalizedAddress);
        if (!nonceData) {
            throw new UnauthorizedException('Nonce not found or expired');
        }

        if (Date.now() > nonceData.expiresAt) {
            this.nonces.delete(normalizedAddress);
            throw new UnauthorizedException('Nonce expired');
        }

        // Verify signature
        try {
            const recoveredAddress = ethers.verifyMessage(message, signature);

            if (recoveredAddress.toLowerCase() !== normalizedAddress) {
                throw new UnauthorizedException('Invalid signature');
            }

            // Delete used nonce
            this.nonces.delete(normalizedAddress);

            // Generate tokens
            const payload = { address: normalizedAddress };
            const accessToken = this.jwtService.sign(payload);
            const refreshToken = this.jwtService.sign(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '30d',
            });

            return { accessToken, refreshToken };
        } catch (error) {
            throw new UnauthorizedException('Signature verification failed');
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });

            const newAccessToken = this.jwtService.sign({
                address: payload.address,
            });

            return { accessToken: newAccessToken };
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    /**
     * Validate JWT payload
     */
    async validateUser(payload: any): Promise<any> {
        return { address: payload.address };
    }

    /**
     * Clean up expired nonces
     */
    private cleanupExpiredNonces(): void {
        const now = Date.now();
        for (const [address, data] of this.nonces.entries()) {
            if (now > data.expiresAt) {
                this.nonces.delete(address);
            }
        }
    }
}
