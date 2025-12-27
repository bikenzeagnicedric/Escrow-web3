import { run } from "hardhat";

async function main() {
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const feeCollector = process.env.FEE_COLLECTOR_ADDRESS;

    if (!contractAddress) {
        throw new Error("Please set CONTRACT_ADDRESS environment variable");
    }

    if (!feeCollector) {
        throw new Error("Please set FEE_COLLECTOR_ADDRESS environment variable");
    }

    console.log("🔍 Verifying Escrow contract...");
    console.log("Contract address:", contractAddress);
    console.log("Fee collector:", feeCollector);

    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: [feeCollector],
        });

        console.log("✅ Contract verified successfully!");
    } catch (error: any) {
        if (error.message.includes("Already Verified")) {
            console.log("✅ Contract already verified!");
        } else {
            console.error("❌ Verification failed:", error);
            throw error;
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
