# Smart Escrow - Backend API

NestJS backend API for the decentralized Smart Escrow platform.

## 📋 Overview

Production-ready NestJS backend with:
- 🔐 Web3 wallet authentication (Sign-In with Ethereum)
- ⛓️ Multi-chain blockchain integration (Ethereum, Polygon)
- 📊 PostgreSQL database with TypeORM
- 🔄 Real-time event indexing from smart contracts
- 🌐 WebSocket notifications
- 📚 Swagger API documentation
- ✅ Input validation and security

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm or yarn

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required environment variables:**
- `DATABASE_*`: PostgreSQL connection
- `JWT_SECRET`: Secret for JWT tokens
- `ETH_RPC_URL`: Ethereum/Sepolia RPC endpoint
- `ETH_ESCROW_CONTRACT_ADDRESS`: Deployed escrow contract address

### Database Setup

```bash
# Database will auto-sync in development mode
# For production, use migrations
npm run migration:generate
npm run migration:run
```

### Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api/v1`

Swagger documentation: `http://localhost:3000/api/docs`

## 📖 API Documentation

### Authentication

#### Get Nonce
```http
GET /api/v1/auth/nonce?address=0x...
```

Returns a nonce for wallet signature.

#### Verify Signature
```http
POST /api/v1/auth/verify
Content-Type: application/json

{
  "address": "0x...",
  "signature": "0x...",
  "message": "Sign this message..."
}
```

Returns JWT access and refresh tokens.

### Escrows

#### List Escrows
```http
GET /api/v1/escrows?chainId=11155111&status=1
Authorization: Bearer <token>
```

Query parameters:
- `chainId`: Filter by chain ID
- `client`: Filter by client address
- `provider`: Filter by provider address
- `status`: Filter by status (0-5)

#### Get Escrow Details
```http
GET /api/v1/escrows/:id
Authorization: Bearer <token>
```

#### Get User Escrows
```http
GET /api/v1/escrows/user/:address
Authorization: Bearer <token>
```

#### Get Statistics
```http
GET /api/v1/escrows/stats?address=0x...
Authorization: Bearer <token>
```

#### Sync Escrow Status
```http
POST /api/v1/escrows/:id/sync
Authorization: Bearer <token>
```

### Disputes

#### Create Dispute
```http
POST /api/v1/disputes
Authorization: Bearer <token>
Content-Type: application/json

{
  "escrowId": "uuid",
  "reason": "Service not delivered as promised"
}
```

#### List Disputes
```http
GET /api/v1/disputes?status=OPEN
Authorization: Bearer <token>
```

#### Resolve Dispute
```http
POST /api/v1/disputes/:id/resolve
Authorization: Bearer <token>
Content-Type: application/json

{
  "inFavorOfClient": true,
  "resolution": "Refunding client due to..."
}
```

## 🔄 Blockchain Event Indexing

The backend automatically indexes blockchain events every 30 seconds:

- `EscrowCreated`: Creates new escrow records
- `EscrowFunded`: Updates escrow status to FUNDED
- `EscrowReleased`: Updates status to RELEASED
- `EscrowRefunded`: Updates status to REFUNDED
- `DisputeOpened`: Updates status to DISPUTED
- `DisputeResolved`: Updates based on resolution

## 🌐 WebSocket Notifications

Connect to WebSocket for real-time notifications:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

// Subscribe to notifications for an address
socket.emit('subscribe', '0x...');

// Listen for notifications
socket.on('notification', (notification) => {
  console.log(notification);
});
```

Notification types:
- `ESCROW_CREATED`
- `ESCROW_FUNDED`
- `ESCROW_RELEASED`
- `ESCROW_REFUNDED`
- `DISPUTE_OPENED`
- `DISPUTE_RESOLVED`

## 🏗️ Architecture

### Modules

1. **AuthModule**: Web3 wallet authentication with JWT
2. **BlockchainModule**: Multi-chain provider management and contract interaction
3. **EscrowModule**: Escrow CRUD operations and statistics
4. **DisputeModule**: Dispute management and resolution
5. **NotificationModule**: Real-time WebSocket notifications

### Database Schema

**Escrows Table:**
- `id` (UUID): Primary key
- `chainId`: Blockchain network ID
- `escrowId`: On-chain escrow ID
- `client`, `provider`, `arbitrator`: Addresses
- `token`: Token address (0x0 for ETH)
- `amount`, `fee`: String (to handle big numbers)
- `status`: Enum (CREATED, FUNDED, DISPUTED, RELEASED, REFUNDED, CANCELLED)
- `transactionHash`, `blockNumber`: Blockchain references

**Disputes Table:**
- `id` (UUID): Primary key
- `escrowId`: Foreign key to Escrows
- `opener`: Address who opened dispute
- `reason`: Dispute reason
- `status`: OPEN | RESOLVED
- `resolver`, `inFavorOfClient`, `resolution`: Resolution details

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🔐 Security

- ✅ JWT authentication for all protected endpoints
- ✅ Input validation with class-validator
- ✅ SQL injection protection via TypeORM
- ✅ CORS configuration
- ✅ Rate limiting (recommended for production)
- ✅ Helmet for security headers (recommended)

## 📊 Monitoring

Recommended tools:
- **Logging**: Winston or Pino
- **APM**: New Relic, Datadog
- **Error tracking**: Sentry

## 🚀 Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "run", "start:prod"]
```

### Environment Variables (Production)

- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Configure production database
- Set up proper RPC endpoints
- Enable rate limiting
- Add Helmet middleware

## 📄 License

MIT
