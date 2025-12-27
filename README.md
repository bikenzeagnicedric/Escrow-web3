# Smart Escrow Web3 Platform

A complete decentralized escrow platform with smart contracts, backend API, and modern frontend.

## 🎯 Overview

Smart Escrow is a production-ready Web3 application that enables secure escrow transactions between clients and service providers with built-in dispute resolution and arbitration.

### Key Features

- ✅ **Non-custodial**: Funds secured by smart contracts, not intermediaries
- ✅ **Multi-chain**: Support for Ethereum, Polygon, and testnets
- ✅ **Multi-token**: Native ETH and ERC20 tokens (USDT, USDC)
- ✅ **Dispute Resolution**: Built-in arbitration system
- ✅ **Real-time Updates**: WebSocket notifications
- ✅ **Modern Stack**: Solidity, NestJS, Next.js 14

## 📁 Project Structure

```
Escrow-web3/
├── contracts/          # Solidity smart contracts (Hardhat)
│   ├── contracts/      # Escrow.sol, MockERC20.sol
│   ├── test/           # Comprehensive test suites
│   └── scripts/        # Deployment and verification scripts
│
├── backend/            # NestJS API server
│   └── src/
│       ├── auth/       # Web3 wallet authentication
│       ├── blockchain/ # Multi-chain provider management
│       ├── escrow/     # Escrow CRUD operations
│       ├── dispute/    # Dispute management
│       └── notification/ # WebSocket notifications
│
└── client/             # Next.js 14 frontend
    ├── app/            # App Router pages
    ├── components/     # UI components (shadcn/ui)
    ├── lib/            # Utilities and wagmi config
    └── hooks/          # Custom React hooks
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- MetaMask or compatible Web3 wallet

### 1. Smart Contracts

```bash
cd contracts
npm install
cp .env.example .env
# Edit .env with your configuration

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Sepolia
npm run deploy:sepolia
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Configure database and blockchain settings

# Run development server
npm run start:dev
```

API will be available at `http://localhost:3000/api/v1`  
Swagger docs at `http://localhost:3000/api/docs`

### 3. Frontend

```bash
cd client
npm install
cp .env.local.example .env.local
# Configure API URL and contract addresses

# Run development server
npm run dev
```

Frontend will be available at `http://localhost:3001`

## 📚 Documentation

Each package has its own detailed README:

- [Smart Contracts Documentation](./contracts/README.md)
- [Backend API Documentation](./backend/README.md)
- Frontend documentation (in client/README.md)

## 🔐 Security Features

### Smart Contracts
- ✅ OpenZeppelin security libraries
- ✅ ReentrancyGuard protection
- ✅ Role-based access control
- ✅ Comprehensive test coverage (50+ tests)

### Backend
- ✅ JWT authentication
- ✅ Input validation (class-validator)
- ✅ SQL injection protection (TypeORM)
- ✅ CORS configuration

### Frontend
- ✅ Wallet signature authentication
- ✅ Transaction confirmation UI
- ✅ Input sanitization

## 🏗️ Architecture

### Smart Contract Flow

1. **Create**: Client creates escrow with provider address and amount
2. **Fund**: Client deposits ETH or ERC20 tokens
3. **Complete**: Client releases funds or opens dispute
4. **Resolve**: Arbitrator resolves disputes if needed

### Backend Architecture

- **AuthModule**: Web3 wallet authentication with nonce + signature
- **BlockchainModule**: Multi-chain provider management and event indexing
- **EscrowModule**: Database sync and API endpoints
- **DisputeModule**: Dispute creation and resolution
- **NotificationModule**: Real-time WebSocket notifications

### Frontend Stack

- **Next.js 14**: App Router for modern React
- **wagmi + viem**: Type-safe Ethereum interactions
- **RainbowKit**: Beautiful wallet connection
- **shadcn/ui**: Accessible component library
- **TailwindCSS**: Utility-first styling

## 🧪 Testing

### Smart Contracts
```bash
cd contracts
npm run test
npm run coverage
```

### Backend
```bash
cd backend
npm run test
npm run test:e2e
```

### Frontend
```bash
cd client
npm run test
```

## 🚀 Deployment

### Smart Contracts

1. Configure `.env` with deployment keys
2. Deploy to desired network:
   ```bash
   npm run deploy:sepolia
   # or
   npm run deploy:polygon
   ```
3. Verify on Etherscan:
   ```bash
   npm run verify
   ```

### Backend

Recommended: Docker deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "run", "start:prod"]
```

### Frontend

Deploy to Vercel:

```bash
vercel --prod
```

Or build for static hosting:

```bash
npm run build
npm run start
```

## 📊 Tech Stack Summary

| Layer | Technologies |
|-------|-------------|
| **Smart Contracts** | Solidity 0.8.24, Hardhat, OpenZeppelin |
| **Backend** | NestJS, TypeORM, PostgreSQL, ethers.js |
| **Frontend** | Next.js 14, wagmi, viem, RainbowKit, shadcn/ui |
| **Testing** | Hardhat, Jest, React Testing Library |
| **DevOps** | Docker, GitHub Actions (optional) |

## 🤝 Contributing

This is a professional template project. Feel free to fork and customize for your needs.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- NestJS team for the excellent framework
- Vercel for Next.js and deployment platform
- wagmi and viem teams for Web3 tooling
- shadcn for the beautiful UI components

---

**Built with ❤️ for the decentralized future**
