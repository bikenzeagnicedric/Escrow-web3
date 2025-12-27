import { expect } from "chai";
import { ethers } from "hardhat";
import { Escrow, MockERC20 } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Escrow with ERC20", function () {
    let escrow: Escrow;
    let token: MockERC20;
    let owner: HardhatEthersSigner;
    let client: HardhatEthersSigner;
    let provider: HardhatEthersSigner;
    let arbitrator: HardhatEthersSigner;
    let feeCollector: HardhatEthersSigner;

    const TOKEN_AMOUNT = ethers.parseUnits("1000", 6); // 1000 USDT (6 decimals)
    const ESCROW_AMOUNT = ethers.parseUnits("100", 6); // 100 USDT
    const DEFAULT_FEE = 250; // 2.5%

    beforeEach(async function () {
        [owner, client, provider, arbitrator, feeCollector] = await ethers.getSigners();

        // Deploy mock USDT
        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        token = await MockERC20Factory.deploy("Mock USDT", "USDT", 6);
        await token.waitForDeployment();

        // Mint tokens to client
        await token.mint(client.address, TOKEN_AMOUNT);

        // Deploy Escrow
        const EscrowFactory = await ethers.getContractFactory("Escrow");
        escrow = await EscrowFactory.deploy(feeCollector.address);
        await escrow.waitForDeployment();

        await escrow.connect(owner).addArbitrator(arbitrator.address);
    });

    describe("ERC20 Escrow Flow", function () {
        it("Should create and fund escrow with ERC20", async function () {
            // Create escrow
            await escrow.connect(client).createEscrow(
                provider.address,
                arbitrator.address,
                await token.getAddress(),
                ESCROW_AMOUNT,
                0,
                "ERC20 escrow test"
            );

            // Approve tokens
            await token.connect(client).approve(await escrow.getAddress(), ESCROW_AMOUNT);

            // Fund escrow
            await expect(escrow.connect(client).fundEscrow(0))
                .to.emit(escrow, "EscrowFunded")
                .withArgs(0, client.address, ESCROW_AMOUNT);

            // Verify token transfer
            expect(await token.balanceOf(await escrow.getAddress())).to.equal(ESCROW_AMOUNT);
        });

        it("Should release ERC20 to provider with fee", async function () {
            // Setup
            await escrow.connect(client).createEscrow(
                provider.address,
                arbitrator.address,
                await token.getAddress(),
                ESCROW_AMOUNT,
                0,
                "ERC20 release test"
            );

            await token.connect(client).approve(await escrow.getAddress(), ESCROW_AMOUNT);
            await escrow.connect(client).fundEscrow(0);

            // Release
            await escrow.connect(client).releaseToProvider(0);

            // Calculate expected amounts
            const expectedFee = (ESCROW_AMOUNT * BigInt(DEFAULT_FEE)) / BigInt(10000);
            const expectedProviderAmount = ESCROW_AMOUNT - expectedFee;

            // Verify balances
            expect(await token.balanceOf(provider.address)).to.equal(expectedProviderAmount);
            expect(await token.balanceOf(feeCollector.address)).to.equal(expectedFee);
            expect(await token.balanceOf(await escrow.getAddress())).to.equal(0);
        });

        it("Should refund ERC20 to client", async function () {
            // Setup
            await escrow.connect(client).createEscrow(
                provider.address,
                arbitrator.address,
                await token.getAddress(),
                ESCROW_AMOUNT,
                0,
                "ERC20 refund test"
            );

            await token.connect(client).approve(await escrow.getAddress(), ESCROW_AMOUNT);
            await escrow.connect(client).fundEscrow(0);

            const clientBalanceBefore = await token.balanceOf(client.address);

            // Refund
            await escrow.connect(arbitrator).refundToClient(0);

            // Verify refund
            const clientBalanceAfter = await token.balanceOf(client.address);
            expect(clientBalanceAfter - clientBalanceBefore).to.equal(ESCROW_AMOUNT);
        });

        it("Should handle dispute resolution with ERC20", async function () {
            // Setup
            await escrow.connect(client).createEscrow(
                provider.address,
                arbitrator.address,
                await token.getAddress(),
                ESCROW_AMOUNT,
                0,
                "ERC20 dispute test"
            );

            await token.connect(client).approve(await escrow.getAddress(), ESCROW_AMOUNT);
            await escrow.connect(client).fundEscrow(0);

            // Open dispute
            await escrow.connect(provider).openDispute(0);

            // Resolve in favor of provider
            await escrow.connect(arbitrator).resolveDispute(0, false);

            // Verify provider received tokens (minus fee)
            const expectedFee = (ESCROW_AMOUNT * BigInt(DEFAULT_FEE)) / BigInt(10000);
            const expectedProviderAmount = ESCROW_AMOUNT - expectedFee;
            expect(await token.balanceOf(provider.address)).to.equal(expectedProviderAmount);
        });

        it("Should fail to fund with ETH for ERC20 escrow", async function () {
            await escrow.connect(client).createEscrow(
                provider.address,
                arbitrator.address,
                await token.getAddress(),
                ESCROW_AMOUNT,
                0,
                "ERC20 test"
            );

            await expect(
                escrow.connect(client).fundEscrow(0, { value: ethers.parseEther("1") })
            ).to.be.revertedWith("ETH not accepted for token escrow");
        });

        it("Should fail without token approval", async function () {
            await escrow.connect(client).createEscrow(
                provider.address,
                arbitrator.address,
                await token.getAddress(),
                ESCROW_AMOUNT,
                0,
                "ERC20 test"
            );

            // Don't approve tokens
            await expect(
                escrow.connect(client).fundEscrow(0)
            ).to.be.reverted; // Will revert with ERC20 insufficient allowance
        });
    });

    describe("Multiple Token Support", function () {
        let usdc: MockERC20;

        beforeEach(async function () {
            // Deploy mock USDC
            const MockERC20Factory = await ethers.getContractFactory("MockERC20");
            usdc = await MockERC20Factory.deploy("Mock USDC", "USDC", 6);
            await usdc.waitForDeployment();

            await usdc.mint(client.address, TOKEN_AMOUNT);
        });

        it("Should handle multiple escrows with different tokens", async function () {
            // Create USDT escrow
            await escrow.connect(client).createEscrow(
                provider.address,
                arbitrator.address,
                await token.getAddress(),
                ESCROW_AMOUNT,
                0,
                "USDT escrow"
            );

            // Create USDC escrow
            await escrow.connect(client).createEscrow(
                provider.address,
                arbitrator.address,
                await usdc.getAddress(),
                ESCROW_AMOUNT,
                0,
                "USDC escrow"
            );

            // Fund both
            await token.connect(client).approve(await escrow.getAddress(), ESCROW_AMOUNT);
            await escrow.connect(client).fundEscrow(0);

            await usdc.connect(client).approve(await escrow.getAddress(), ESCROW_AMOUNT);
            await escrow.connect(client).fundEscrow(1);

            // Verify both are funded
            const escrow0 = await escrow.getEscrow(0);
            const escrow1 = await escrow.getEscrow(1);

            expect(escrow0.status).to.equal(1); // FUNDED
            expect(escrow1.status).to.equal(1); // FUNDED
            expect(escrow0.token).to.equal(await token.getAddress());
            expect(escrow1.token).to.equal(await usdc.getAddress());
        });
    });
});
