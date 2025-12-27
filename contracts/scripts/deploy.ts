import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Starting Escrow contract deployment...\n");

    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

    // Deploy Escrow contract
    console.log("📦 Deploying Escrow contract...");

    const feeCollector = process.env.FEE_COLLECTOR_ADDRESS || deployer.address;
    console.log("💼 Fee collector address:", feeCollector);

    const EscrowFactory = await ethers.getContractFactory("Escrow");
    const escrow = await EscrowFactory.deploy(feeCollector);
    await escrow.waitForDeployment();

    const escrowAddress = await escrow.getAddress();
    console.log("✅ Escrow deployed to:", escrowAddress);

    // Add initial arbitrator if specified
    const initialArbitrator = process.env.INITIAL_ARBITRATOR_ADDRESS;
    if (initialArbitrator && initialArbitrator !== "") {
        console.log("\n🔐 Adding initial arbitrator:", initialArbitrator);
        const tx = await escrow.addArbitrator(initialArbitrator);
        await tx.wait();
        console.log("✅ Arbitrator added successfully");
    }

    // Display deployment summary
    console.log("\n" + "=".repeat(60));
    console.log("📋 DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log("Network:", (await ethers.provider.getNetwork()).name);
    console.log("Escrow Contract:", escrowAddress);
    console.log("Fee Collector:", feeCollector);
    console.log("Default Fee:", await escrow.defaultFee(), "basis points (2.5%)");
    console.log("Owner:", await escrow.owner());
    console.log("=".repeat(60));

    // Save deployment info
    const deploymentInfo = {
        network: (await ethers.provider.getNetwork()).name,
        chainId: (await ethers.provider.getNetwork()).chainId,
        escrowAddress: escrowAddress,
        feeCollector: feeCollector,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
    };

    console.log("\n📄 Deployment info:", JSON.stringify(deploymentInfo, null, 2));

    // Verification instructions
    console.log("\n" + "=".repeat(60));
    console.log("🔍 TO VERIFY ON ETHERSCAN:");
    console.log("=".repeat(60));
    console.log(`npx hardhat verify --network ${(await ethers.provider.getNetwork()).name} ${escrowAddress} "${feeCollector}"`);
    console.log("=".repeat(60));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
