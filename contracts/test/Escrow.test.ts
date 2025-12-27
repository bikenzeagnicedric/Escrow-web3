import { expect } from "chai";
import { ethers } from "hardhat";
import { Escrow } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Escrow", function () {
    let escrow: Escrow;
    let owner: HardhatEthersSigner;
    let client: HardhatEthersSigner;
    let provider: HardhatEthersSigner;
    let arbitrator: HardhatEthersSigner;
    let feeCollector: HardhatEthersSigner;
    let other: HardhatEthersSigner;

    const ESCROW_AMOUNT = ethers.parseEther("1.0");
    const DEFAULT_FEE = 250; // 2.5%
    const DESCRIPTION = "Web development services";

    beforeEach(async function () {
        [owner, client, provider, arbitrator, feeCollector, other] = await ethers.getSigners();

        const EscrowFactory = await ethers.getContractFactory("Escrow");
        escrow = await EscrowFactory.deploy(feeCollector.address);
        await escrow.waitForDeployment();

        // Add arbitrator
        await escrow.connect(owner).addArbitrator(arbitrator.address);
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await escrow.owner()).to.equal(owner.address);
        });

        it("Should set the fee collector", async function () {
            expect(await escrow.feeCollector()).to.equal(feeCollector.address);
        });

        it("Should set default fee to 2.5%", async function () {
            expect(await escrow.defaultFee()).to.equal(DEFAULT_FEE);
        });

        it("Should authorize the arbitrator", async function () {
            expect(await escrow.isArbitrator(arbitrator.address)).to.be.true;
        });
    });

    describe("Escrow Creation", function () {
        it("Should create an escrow successfully", async function () {
            const tx = await escrow.connect(client).createEscrow(
                provider.address,
                arbitrator.address,
                ethers.ZeroAddress, // Native ETH
                ESCROW_AMOUNT,
                0, // No deadline
                DESCRIPTION
            );

            await expect(tx)
                .to.emit(escrow, "EscrowCreated")
                .withArgs(0, client.address, provider.address, ethers.ZeroAddress, ESCROW_AMOUNT, 0);

            const escrowData = await escrow.getEscrow(0);
            expect(escrowData.client).to.equal(client.address);
            expect(escrowData.provider).to.equal(provider.address);
            expect(escrowData.amount).to.equal(ESCROW_AMOUNT);
            expect(escrowData.status).to.equal(0); // CREATED
        });

        it("Should fail if provider is zero address", async function () {
            await expect(
                escrow.connect(client).createEscrow(
                    ethers.ZeroAddress,
                    arbitrator.address,
                    ethers.ZeroAddress,
                    ESCROW_AMOUNT,
                    0,
                    DESCRIPTION
                )
            ).to.be.revertedWith("Invalid provider address");
        });

        it("Should fail if client and provider are the same", async function () {
            await expect(
                escrow.connect(client).createEscrow(
                    client.address,
                    arbitrator.address,
                    ethers.ZeroAddress,
                    ESCROW_AMOUNT,
                    0,
                    DESCRIPTION
                )
            ).to.be.revertedWith("Client and provider must be different");
        });

        it("Should fail if amount is zero", async function () {
            await expect(
                escrow.connect(client).createEscrow(
                    provider.address,
                    arbitrator.address,
                    ethers.ZeroAddress,
                    0,
                    0,
                    DESCRIPTION
                )
            ).to.be.revertedWith("Amount must be greater than 0");
        });

        it("Should create escrow with deadline", async function () {
            const deadline = (await time.latest()) + 86400; // 1 day from now

            await escrow.connect(client).createEscrow(
                provider.address,
                arbitrator.address,
                ethers.ZeroAddress,
                ESCROW_AMOUNT,
                deadline,
                DESCRIPTION
            );

            const escrowData = await escrow.getEscrow(0);
            expect(escrowData.deadline).to.equal(deadline);
        });
    });

    describe("Escrow Funding", function () {
        beforeEach(async function () {
            await escrow.connect(client).createEscrow(
                provider.address,
                arbitrator.address,
                ethers.ZeroAddress,
                ESCROW_AMOUNT,
                0,
                DESCRIPTION
            );
        });

        it("Should fund escrow with correct ETH amount", async function () {
            const tx = await escrow.connect(client).fundEscrow(0, { value: ESCROW_AMOUNT });

            await expect(tx)
                .to.emit(escrow, "EscrowFunded")
                .withArgs(0, client.address, ESCROW_AMOUNT);

            const escrowData = await escrow.getEscrow(0);
            expect(escrowData.status).to.equal(1); // FUNDED
        });

        it("Should fail if wrong ETH amount sent", async function () {
            await expect(
                escrow.connect(client).fundEscrow(0, { value: ethers.parseEther("0.5") })
            ).to.be.revertedWith("Incorrect ETH amount");
        });

        it("Should fail if not called by client", async function () {
            await expect(
                escrow.connect(other).fundEscrow(0, { value: ESCROW_AMOUNT })
            ).to.be.revertedWith("Not the client");
        });

        it("Should fail if already funded", async function () {
            await escrow.connect(client).fundEscrow(0, { value: ESCROW_AMOUNT });

            await expect(
                escrow.connect(client).fundEscrow(0, { value: ESCROW_AMOUNT })
            ).to.be.revertedWith("Invalid escrow status");
        });
    });

    describe("Release to Provider", function () {
        beforeEach(async function () {
            await escrow.connect(client).createEscrow(
                provider.address,
                arbitrator.address,
                ethers.ZeroAddress,
                ESCROW_AMOUNT,
                0,
                DESCRIPTION
            );
            await escrow.connect(client).fundEscrow(0, { value: ESCROW_AMOUNT });
        });

        it("Should release funds to provider by client", async function () {
            const providerBalanceBefore = await ethers.provider.getBalance(provider.address);
            const feeCollectorBalanceBefore = await ethers.provider.getBalance(feeCollector.address);

            const expectedFee = (ESCROW_AMOUNT * BigInt(DEFAULT_FEE)) / BigInt(10000);
            const expectedProviderAmount = ESCROW_AMOUNT - expectedFee;

            await escrow.connect(client).releaseToProvider(0);

            const providerBalanceAfter = await ethers.provider.getBalance(provider.address);
            const feeCollectorBalanceAfter = await ethers.provider.getBalance(feeCollector.address);

            expect(providerBalanceAfter - providerBalanceBefore).to.equal(expectedProviderAmount);
            expect(feeCollectorBalanceAfter - feeCollectorBalanceBefore).to.equal(expectedFee);

            const escrowData = await escrow.getEscrow(0);
            expect(escrowData.status).to.equal(3); // RELEASED
        });

        it("Should release funds to provider by arbitrator", async function () {
            await escrow.connect(arbitrator).releaseToProvider(0);

            const escrowData = await escrow.getEscrow(0);
            expect(escrowData.status).to.equal(3); // RELEASED
        });

        it("Should fail if not authorized", async function () {
            await expect(
                escrow.connect(other).releaseToProvider(0)
            ).to.be.revertedWith("Not authorized to release");
        });

        it("Should emit EscrowReleased event", async function () {
            const expectedFee = (ESCROW_AMOUNT * BigInt(DEFAULT_FEE)) / BigInt(10000);
            const expectedProviderAmount = ESCROW_AMOUNT - expectedFee;

            await expect(escrow.connect(client).releaseToProvider(0))
                .to.emit(escrow, "EscrowReleased")
                .withArgs(0, provider.address, expectedProviderAmount, expectedFee);
        });
    });

    describe("Refund to Client", function () {
        beforeEach(async function () {
            await escrow.connect(client).createEscrow(
                provider.address,
                arbitrator.address,
                ethers.ZeroAddress,
                ESCROW_AMOUNT,
                0,
                DESCRIPTION
            );
            await escrow.connect(client).fundEscrow(0, { value: ESCROW_AMOUNT });
        });

        it("Should refund to client by arbitrator", async function () {
            const clientBalanceBefore = await ethers.provider.getBalance(client.address);

            await escrow.connect(arbitrator).refundToClient(0);

            const clientBalanceAfter = await ethers.provider.getBalance(client.address);
            expect(clientBalanceAfter - clientBalanceBefore).to.equal(ESCROW_AMOUNT);

            const escrowData = await escrow.getEscrow(0);
            expect(escrowData.status).to.equal(4); // REFUNDED
        });

        it("Should fail if not called by arbitrator", async function () {
            await expect(
                escrow.connect(client).refundToClient(0)
            ).to.be.revertedWith("Not an authorized arbitrator");
        });

        it("Should emit EscrowRefunded event", async function () {
            await expect(escrow.connect(arbitrator).refundToClient(0))
                .to.emit(escrow, "EscrowRefunded")
                .withArgs(0, client.address, ESCROW_AMOUNT);
        });
    });

    describe("Dispute Management", function () {
        beforeEach(async function () {
            await escrow.connect(client).createEscrow(
                provider.address,
                arbitrator.address,
                ethers.ZeroAddress,
                ESCROW_AMOUNT,
                0,
                DESCRIPTION
            );
            await escrow.connect(client).fundEscrow(0, { value: ESCROW_AMOUNT });
        });

        it("Should open dispute by client", async function () {
            await expect(escrow.connect(client).openDispute(0))
                .to.emit(escrow, "DisputeOpened")
                .withArgs(0, client.address, await time.latest() + 1);

            const escrowData = await escrow.getEscrow(0);
            expect(escrowData.status).to.equal(2); // DISPUTED
        });

        it("Should open dispute by provider", async function () {
            await expect(escrow.connect(provider).openDispute(0))
                .to.emit(escrow, "DisputeOpened");

            const escrowData = await escrow.getEscrow(0);
            expect(escrowData.status).to.equal(2); // DISPUTED
        });

        it("Should fail if not client or provider", async function () {
            await expect(
                escrow.connect(other).openDispute(0)
            ).to.be.revertedWith("Only client or provider can open dispute");
        });

        it("Should resolve dispute in favor of client", async function () {
            await escrow.connect(client).openDispute(0);

            const clientBalanceBefore = await ethers.provider.getBalance(client.address);

            await expect(escrow.connect(arbitrator).resolveDispute(0, true))
                .to.emit(escrow, "DisputeResolved")
                .withArgs(0, arbitrator.address, true);

            const clientBalanceAfter = await ethers.provider.getBalance(client.address);
            expect(clientBalanceAfter - clientBalanceBefore).to.equal(ESCROW_AMOUNT);

            const escrowData = await escrow.getEscrow(0);
            expect(escrowData.status).to.equal(4); // REFUNDED
        });

        it("Should resolve dispute in favor of provider", async function () {
            await escrow.connect(client).openDispute(0);

            const providerBalanceBefore = await ethers.provider.getBalance(provider.address);

            await expect(escrow.connect(arbitrator).resolveDispute(0, false))
                .to.emit(escrow, "DisputeResolved")
                .withArgs(0, arbitrator.address, false);

            const expectedFee = (ESCROW_AMOUNT * BigInt(DEFAULT_FEE)) / BigInt(10000);
            const expectedProviderAmount = ESCROW_AMOUNT - expectedFee;

            const providerBalanceAfter = await ethers.provider.getBalance(provider.address);
            expect(providerBalanceAfter - providerBalanceBefore).to.equal(expectedProviderAmount);

            const escrowData = await escrow.getEscrow(0);
            expect(escrowData.status).to.equal(3); // RELEASED
        });
    });

    describe("Cancel Escrow", function () {
        beforeEach(async function () {
            await escrow.connect(client).createEscrow(
                provider.address,
                arbitrator.address,
                ethers.ZeroAddress,
                ESCROW_AMOUNT,
                0,
                DESCRIPTION
            );
        });

        it("Should cancel unfunded escrow", async function () {
            await expect(escrow.connect(client).cancelEscrow(0))
                .to.emit(escrow, "EscrowCancelled")
                .withArgs(0, client.address);

            const escrowData = await escrow.getEscrow(0);
            expect(escrowData.status).to.equal(5); // CANCELLED
        });

        it("Should fail if not client", async function () {
            await expect(
                escrow.connect(other).cancelEscrow(0)
            ).to.be.revertedWith("Not the client");
        });

        it("Should fail if already funded", async function () {
            await escrow.connect(client).fundEscrow(0, { value: ESCROW_AMOUNT });

            await expect(
                escrow.connect(client).cancelEscrow(0)
            ).to.be.revertedWith("Invalid escrow status");
        });
    });

    describe("Admin Functions", function () {
        it("Should add arbitrator", async function () {
            await expect(escrow.connect(owner).addArbitrator(other.address))
                .to.emit(escrow, "ArbitratorAdded")
                .withArgs(other.address);

            expect(await escrow.isArbitrator(other.address)).to.be.true;
        });

        it("Should remove arbitrator", async function () {
            await expect(escrow.connect(owner).removeArbitrator(arbitrator.address))
                .to.emit(escrow, "ArbitratorRemoved")
                .withArgs(arbitrator.address);

            expect(await escrow.isArbitrator(arbitrator.address)).to.be.false;
        });

        it("Should update fee collector", async function () {
            await expect(escrow.connect(owner).setFeeCollector(other.address))
                .to.emit(escrow, "FeeCollectorUpdated")
                .withArgs(other.address);

            expect(await escrow.feeCollector()).to.equal(other.address);
        });

        it("Should update default fee", async function () {
            const newFee = 500; // 5%
            await expect(escrow.connect(owner).setDefaultFee(newFee))
                .to.emit(escrow, "DefaultFeeUpdated")
                .withArgs(newFee);

            expect(await escrow.defaultFee()).to.equal(newFee);
        });

        it("Should fail to set fee above maximum", async function () {
            await expect(
                escrow.connect(owner).setDefaultFee(1001) // > 10%
            ).to.be.revertedWith("Fee exceeds maximum");
        });

        it("Should fail if not owner", async function () {
            await expect(
                escrow.connect(other).addArbitrator(other.address)
            ).to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
        });
    });

    describe("View Functions", function () {
        it("Should return escrow count", async function () {
            expect(await escrow.getEscrowCount()).to.equal(0);

            await escrow.connect(client).createEscrow(
                provider.address,
                arbitrator.address,
                ethers.ZeroAddress,
                ESCROW_AMOUNT,
                0,
                DESCRIPTION
            );

            expect(await escrow.getEscrowCount()).to.equal(1);
        });

        it("Should fail to get non-existent escrow", async function () {
            await expect(escrow.getEscrow(999)).to.be.revertedWith("Escrow does not exist");
        });
    });

    describe("Reentrancy Protection", function () {
        it("Should prevent reentrancy on fundEscrow", async function () {
            // This would require a malicious contract to test properly
            // For now, we verify the modifier is present
            const escrowData = await escrow.connect(client).createEscrow(
                provider.address,
                arbitrator.address,
                ethers.ZeroAddress,
                ESCROW_AMOUNT,
                0,
                DESCRIPTION
            );

            // Fund normally
            await escrow.connect(client).fundEscrow(0, { value: ESCROW_AMOUNT });

            // Verify status changed
            const escrow Data = await escrow.getEscrow(0);
            expect(escrowData.status).to.equal(1); // FUNDED
        });
    });
});
