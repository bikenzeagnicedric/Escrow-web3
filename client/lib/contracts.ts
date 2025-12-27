import { ESCROW_ADDRESSES } from './wagmi';

export const ESCROW_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "_provider", "type": "address" },
            { "internalType": "address", "name": "_token", "type": "address" },
            { "internalType": "uint256", "name": "_amount", "type": "uint256" },
            { "internalType": "uint256", "name": "_deadline", "type": "uint256" },
            { "internalType": "string", "name": "_description", "type": "string" }
        ],
        "name": "createEscrow",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "escrowId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "client", "type": "address" },
            { "indexed": true, "internalType": "address", "name": "provider", "type": "address" },
            { "indexed": false, "internalType": "address", "name": "token", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "EscrowCreated",
        "type": "event"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "_escrowId", "type": "uint256" }],
        "name": "fundEscrow",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "_escrowId", "type": "uint256" }],
        "name": "releaseToProvider",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "_escrowId", "type": "uint256" }],
        "name": "refundToClient",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "_escrowId", "type": "uint256" },
            { "internalType": "string", "name": "_reason", "type": "string" }
        ],
        "name": "openDispute",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "_escrowId", "type": "uint256" },
            { "internalType": "uint8", "name": "_resolution", "type": "uint8" }
        ],
        "name": "resolveDispute",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "_escrowId", "type": "uint256" }],
        "name": "getEscrow",
        "outputs": [
            {
                "components": [
                    { "internalType": "address", "name": "client", "type": "address" },
                    { "internalType": "address", "name": "provider", "type": "address" },
                    { "internalType": "address", "name": "token", "type": "address" },
                    { "internalType": "uint256", "name": "amount", "type": "uint256" },
                    { "internalType": "uint256", "name": "deadline", "type": "uint256" },
                    { "internalType": "bool", "name": "isFunded", "type": "bool" },
                    { "internalType": "bool", "name": "isReleased", "type": "bool" },
                    { "internalType": "bool", "name": "isRefunded", "type": "bool" },
                    { "internalType": "bool", "name": "isDisputed", "type": "bool" },
                    { "internalType": "uint8", "name": "status", "type": "uint8" },
                    { "internalType": "string", "name": "description", "type": "string" }
                ],
                "internalType": "struct Escrow.EscrowData",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;
