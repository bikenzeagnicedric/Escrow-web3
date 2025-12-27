// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Escrow
 * @dev Smart contract for secure escrow transactions with dispute resolution
 * @notice This contract allows clients and providers to engage in secure transactions
 * with built-in arbitration for dispute resolution
 */
contract Escrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Enums ============

    enum EscrowStatus {
        CREATED,      // Escrow created but not funded
        FUNDED,       // Funds deposited, awaiting completion
        DISPUTED,     // Dispute opened
        RELEASED,     // Funds released to provider
        REFUNDED,     // Funds refunded to client
        CANCELLED     // Escrow cancelled before funding
    }

    // ============ Structs ============

    struct EscrowData {
        address client;           // Client who creates and funds the escrow
        address provider;         // Service provider who receives payment
        address arbitrator;       // Arbitrator for dispute resolution
        address token;            // Token address (address(0) for native ETH)
        uint256 amount;           // Escrow amount
        uint256 fee;              // Platform fee in basis points (e.g., 250 = 2.5%)
        EscrowStatus status;      // Current status
        uint256 createdAt;        // Creation timestamp
        uint256 deadline;         // Deadline for automatic release (0 = no deadline)
        string description;       // Escrow description
    }

    // ============ State Variables ============

    uint256 private _escrowIdCounter;
    mapping(uint256 => EscrowData) public escrows;
    mapping(address => bool) public authorizedArbitrators;
    
    uint256 public defaultFee = 250; // 2.5% default fee
    uint256 public constant MAX_FEE = 1000; // 10% maximum fee
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    address public feeCollector;
    mapping(address => uint256) public collectedFees; // token => amount

    // ============ Events ============

    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed client,
        address indexed provider,
        address token,
        uint256 amount,
        uint256 deadline
    );

    event EscrowFunded(
        uint256 indexed escrowId,
        address indexed funder,
        uint256 amount
    );

    event EscrowReleased(
        uint256 indexed escrowId,
        address indexed provider,
        uint256 amount,
        uint256 fee
    );

    event EscrowRefunded(
        uint256 indexed escrowId,
        address indexed client,
        uint256 amount
    );

    event DisputeOpened(
        uint256 indexed escrowId,
        address indexed opener,
        uint256 timestamp
    );

    event DisputeResolved(
        uint256 indexed escrowId,
        address indexed arbitrator,
        bool inFavorOfClient
    );

    event EscrowCancelled(
        uint256 indexed escrowId,
        address indexed client
    );

    event ArbitratorAdded(address indexed arbitrator);
    event ArbitratorRemoved(address indexed arbitrator);
    event FeeCollectorUpdated(address indexed newFeeCollector);
    event DefaultFeeUpdated(uint256 newFee);

    // ============ Modifiers ============

    modifier onlyClient(uint256 escrowId) {
        require(escrows[escrowId].client == msg.sender, "Not the client");
        _;
    }

    modifier onlyProvider(uint256 escrowId) {
        require(escrows[escrowId].provider == msg.sender, "Not the provider");
        _;
    }

    modifier onlyArbitrator(uint256 escrowId) {
        require(
            authorizedArbitrators[msg.sender] || 
            escrows[escrowId].arbitrator == msg.sender,
            "Not an authorized arbitrator"
        );
        _;
    }

    modifier escrowExists(uint256 escrowId) {
        require(escrows[escrowId].client != address(0), "Escrow does not exist");
        _;
    }

    modifier inStatus(uint256 escrowId, EscrowStatus status) {
        require(escrows[escrowId].status == status, "Invalid escrow status");
        _;
    }

    // ============ Constructor ============

    constructor(address _feeCollector) Ownable(msg.sender) {
        require(_feeCollector != address(0), "Invalid fee collector");
        feeCollector = _feeCollector;
    }

    // ============ Main Functions ============

    /**
     * @notice Create a new escrow
     * @param provider Address of the service provider
     * @param arbitrator Address of the arbitrator (can be address(0) for default)
     * @param token Token address (address(0) for native ETH)
     * @param amount Amount to be escrowed
     * @param deadline Deadline timestamp (0 for no deadline)
     * @param description Description of the escrow
     * @return escrowId The ID of the created escrow
     */
    function createEscrow(
        address provider,
        address arbitrator,
        address token,
        uint256 amount,
        uint256 deadline,
        string calldata description
    ) external returns (uint256) {
        require(provider != address(0), "Invalid provider address");
        require(provider != msg.sender, "Client and provider must be different");
        require(amount > 0, "Amount must be greater than 0");
        
        if (deadline > 0) {
            require(deadline > block.timestamp, "Deadline must be in the future");
        }

        uint256 escrowId = _escrowIdCounter++;

        escrows[escrowId] = EscrowData({
            client: msg.sender,
            provider: provider,
            arbitrator: arbitrator,
            token: token,
            amount: amount,
            fee: defaultFee,
            status: EscrowStatus.CREATED,
            createdAt: block.timestamp,
            deadline: deadline,
            description: description
        });

        emit EscrowCreated(escrowId, msg.sender, provider, token, amount, deadline);

        return escrowId;
    }

    /**
     * @notice Fund an escrow
     * @param escrowId ID of the escrow to fund
     */
    function fundEscrow(uint256 escrowId)
        external
        payable
        nonReentrant
        escrowExists(escrowId)
        inStatus(escrowId, EscrowStatus.CREATED)
        onlyClient(escrowId)
    {
        EscrowData storage escrow = escrows[escrowId];

        if (escrow.token == address(0)) {
            // Native ETH
            require(msg.value == escrow.amount, "Incorrect ETH amount");
        } else {
            // ERC20 token
            require(msg.value == 0, "ETH not accepted for token escrow");
            IERC20(escrow.token).safeTransferFrom(
                msg.sender,
                address(this),
                escrow.amount
            );
        }

        escrow.status = EscrowStatus.FUNDED;

        emit EscrowFunded(escrowId, msg.sender, escrow.amount);
    }

    /**
     * @notice Release funds to provider
     * @param escrowId ID of the escrow
     */
    function releaseToProvider(uint256 escrowId)
        external
        nonReentrant
        escrowExists(escrowId)
        inStatus(escrowId, EscrowStatus.FUNDED)
    {
        EscrowData storage escrow = escrows[escrowId];
        
        // Only client or arbitrator can release
        require(
            msg.sender == escrow.client || 
            msg.sender == escrow.arbitrator ||
            authorizedArbitrators[msg.sender],
            "Not authorized to release"
        );

        escrow.status = EscrowStatus.RELEASED;

        // Calculate fee
        uint256 feeAmount = (escrow.amount * escrow.fee) / FEE_DENOMINATOR;
        uint256 providerAmount = escrow.amount - feeAmount;

        // Transfer funds
        if (escrow.token == address(0)) {
            // Native ETH
            (bool successProvider, ) = escrow.provider.call{value: providerAmount}("");
            require(successProvider, "Transfer to provider failed");
            
            if (feeAmount > 0) {
                (bool successFee, ) = feeCollector.call{value: feeAmount}("");
                require(successFee, "Fee transfer failed");
                collectedFees[address(0)] += feeAmount;
            }
        } else {
            // ERC20 token
            IERC20(escrow.token).safeTransfer(escrow.provider, providerAmount);
            
            if (feeAmount > 0) {
                IERC20(escrow.token).safeTransfer(feeCollector, feeAmount);
                collectedFees[escrow.token] += feeAmount;
            }
        }

        emit EscrowReleased(escrowId, escrow.provider, providerAmount, feeAmount);
    }

    /**
     * @notice Refund funds to client
     * @param escrowId ID of the escrow
     */
    function refundToClient(uint256 escrowId)
        external
        nonReentrant
        escrowExists(escrowId)
        onlyArbitrator(escrowId)
    {
        EscrowData storage escrow = escrows[escrowId];
        
        require(
            escrow.status == EscrowStatus.FUNDED || 
            escrow.status == EscrowStatus.DISPUTED,
            "Invalid status for refund"
        );

        escrow.status = EscrowStatus.REFUNDED;

        // Refund full amount (no fee on refund)
        if (escrow.token == address(0)) {
            (bool success, ) = escrow.client.call{value: escrow.amount}("");
            require(success, "Refund transfer failed");
        } else {
            IERC20(escrow.token).safeTransfer(escrow.client, escrow.amount);
        }

        emit EscrowRefunded(escrowId, escrow.client, escrow.amount);
    }

    /**
     * @notice Open a dispute
     * @param escrowId ID of the escrow
     */
    function openDispute(uint256 escrowId)
        external
        escrowExists(escrowId)
        inStatus(escrowId, EscrowStatus.FUNDED)
    {
        EscrowData storage escrow = escrows[escrowId];
        
        require(
            msg.sender == escrow.client || msg.sender == escrow.provider,
            "Only client or provider can open dispute"
        );

        escrow.status = EscrowStatus.DISPUTED;

        emit DisputeOpened(escrowId, msg.sender, block.timestamp);
    }

    /**
     * @notice Resolve a dispute
     * @param escrowId ID of the escrow
     * @param inFavorOfClient True to refund client, false to release to provider
     */
    function resolveDispute(uint256 escrowId, bool inFavorOfClient)
        external
        escrowExists(escrowId)
        inStatus(escrowId, EscrowStatus.DISPUTED)
        onlyArbitrator(escrowId)
    {
        emit DisputeResolved(escrowId, msg.sender, inFavorOfClient);

        if (inFavorOfClient) {
            refundToClient(escrowId);
        } else {
            // Temporarily change status to FUNDED to allow release
            escrows[escrowId].status = EscrowStatus.FUNDED;
            releaseToProvider(escrowId);
        }
    }

    /**
     * @notice Cancel an unfunded escrow
     * @param escrowId ID of the escrow
     */
    function cancelEscrow(uint256 escrowId)
        external
        escrowExists(escrowId)
        inStatus(escrowId, EscrowStatus.CREATED)
        onlyClient(escrowId)
    {
        escrows[escrowId].status = EscrowStatus.CANCELLED;
        emit EscrowCancelled(escrowId, msg.sender);
    }

    // ============ Admin Functions ============

    /**
     * @notice Add an authorized arbitrator
     * @param arbitrator Address of the arbitrator
     */
    function addArbitrator(address arbitrator) external onlyOwner {
        require(arbitrator != address(0), "Invalid arbitrator address");
        authorizedArbitrators[arbitrator] = true;
        emit ArbitratorAdded(arbitrator);
    }

    /**
     * @notice Remove an authorized arbitrator
     * @param arbitrator Address of the arbitrator
     */
    function removeArbitrator(address arbitrator) external onlyOwner {
        authorizedArbitrators[arbitrator] = false;
        emit ArbitratorRemoved(arbitrator);
    }

    /**
     * @notice Update fee collector address
     * @param newFeeCollector New fee collector address
     */
    function setFeeCollector(address newFeeCollector) external onlyOwner {
        require(newFeeCollector != address(0), "Invalid fee collector");
        feeCollector = newFeeCollector;
        emit FeeCollectorUpdated(newFeeCollector);
    }

    /**
     * @notice Update default fee
     * @param newFee New fee in basis points
     */
    function setDefaultFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee exceeds maximum");
        defaultFee = newFee;
        emit DefaultFeeUpdated(newFee);
    }

    // ============ View Functions ============

    /**
     * @notice Get escrow details
     * @param escrowId ID of the escrow
     * @return Escrow data
     */
    function getEscrow(uint256 escrowId)
        external
        view
        escrowExists(escrowId)
        returns (EscrowData memory)
    {
        return escrows[escrowId];
    }

    /**
     * @notice Get total number of escrows
     * @return Total escrow count
     */
    function getEscrowCount() external view returns (uint256) {
        return _escrowIdCounter;
    }

    /**
     * @notice Check if address is an authorized arbitrator
     * @param arbitrator Address to check
     * @return True if authorized
     */
    function isArbitrator(address arbitrator) external view returns (bool) {
        return authorizedArbitrators[arbitrator];
    }

    // ============ Emergency Functions ============

    /**
     * @notice Emergency withdraw (only owner, for stuck funds)
     * @dev Should only be used in extreme circumstances
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            (bool success, ) = owner().call{value: amount}("");
            require(success, "Emergency withdraw failed");
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }
}
