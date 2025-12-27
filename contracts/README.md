# Smart Escrow - Smart Contracts

Solidity smart contracts for the decentralized escrow platform with dispute resolution.

## 📋 Overview

This package contains the core smart contracts that power the Smart Escrow platform:

- **Escrow.sol**: Main escrow contract handling creation, funding, release, refund, and dispute resolution
- **MockERC20.sol**: Mock ERC20 token for testing purposes

## 🔐 Security Features

- ✅ **ReentrancyGuard**: Protection against reentrancy attacks
- ✅ **Ownable**: Access control for admin functions
- ✅ **SafeERC20**: Safe token transfers
- ✅ **Checks-Effects-Interactions**: Secure state management pattern
- ✅ **Role-based permissions**: Client, Provider, Arbitrator roles

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm run test
```

### Test Coverage

```bash
npm run coverage
```

### Run Local Node

```bash
npm run node
```

## 📝 Contract Features

### Escrow Lifecycle

1. **Creation**: Client creates escrow with provider address, amount, and optional arbitrator
2. **Funding**: Client deposits ETH or ERC20 tokens
3. **Completion**: 
   - Client releases funds to provider
   - Arbitrator can release or refund
4. **Dispute**: Either party can open a dispute
5. **Resolution**: Arbitrator resolves in favor of client or provider

### Supported Tokens

- Native ETH
- Any ERC20 token (USDT, USDC, DAI, etc.)

### Fee Structure

- Default platform fee: 2.5% (250 basis points)
- Maximum fee: 10%
- Fees collected on release only (no fees on refunds)

## 🌐 Deployment

### Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `PRIVATE_KEY`: Deployer private key
- `SEPOLIA_RPC_URL`: Sepolia RPC endpoint
- `ETHERSCAN_API_KEY`: For contract verification

### Deploy to Sepolia

```bash
npm run deploy:sepolia
```

### Verify Contract

```bash
export CONTRACT_ADDRESS=0x...
export FEE_COLLECTOR_ADDRESS=0x...
npm run verify
```

## 🧪 Testing

The test suite includes:

- ✅ Deployment and initialization
- ✅ Escrow creation and validation
- ✅ Funding with ETH and ERC20
- ✅ Release to provider with fee calculation
- ✅ Refund to client
- ✅ Dispute opening and resolution
- ✅ Escrow cancellation
- ✅ Admin functions (arbitrator management, fee updates)
- ✅ Reentrancy protection
- ✅ Multi-token support

**Total: 50+ test cases**

## 📊 Gas Optimization

To generate gas report:

```bash
REPORT_GAS=true npm run test
```

## 🔍 Contract Verification

After deployment, verify on Etherscan:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> "<FEE_COLLECTOR_ADDRESS>"
```

## 📖 API Reference

### Main Functions

#### createEscrow
```solidity
function createEscrow(
    address provider,
    address arbitrator,
    address token,
    uint256 amount,
    uint256 deadline,
    string calldata description
) external returns (uint256 escrowId)
```

#### fundEscrow
```solidity
function fundEscrow(uint256 escrowId) external payable
```

#### releaseToProvider
```solidity
function releaseToProvider(uint256 escrowId) external
```

#### refundToClient
```solidity
function refundToClient(uint256 escrowId) external
```

#### openDispute
```solidity
function openDispute(uint256 escrowId) external
```

#### resolveDispute
```solidity
function resolveDispute(uint256 escrowId, bool inFavorOfClient) external
```

### Events

- `EscrowCreated(uint256 escrowId, address client, address provider, ...)`
- `EscrowFunded(uint256 escrowId, address funder, uint256 amount)`
- `EscrowReleased(uint256 escrowId, address provider, uint256 amount, uint256 fee)`
- `EscrowRefunded(uint256 escrowId, address client, uint256 amount)`
- `DisputeOpened(uint256 escrowId, address opener, uint256 timestamp)`
- `DisputeResolved(uint256 escrowId, address arbitrator, bool inFavorOfClient)`

## 🛡️ Security Considerations

1. **Non-custodial**: Contract holds funds temporarily, no admin can withdraw user funds
2. **Immutable logic**: Core escrow logic cannot be changed after deployment
3. **Event-driven**: All state changes emit events for off-chain indexing
4. **Role validation**: Strict permission checks on all sensitive functions
5. **Reentrancy protection**: All fund transfer functions are protected

## 📄 License

MIT
