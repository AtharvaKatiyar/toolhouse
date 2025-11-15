/**
 * Grant WORKER_ROLE to worker address on ActionExecutor contract
 * 
 * This script grants the WORKER_ROLE to the worker address so it can execute workflows.
 * 
 * Usage:
 *   npx hardhat run scripts/grant-worker-role.js --network moonbaseAlpha
 * 
 * Requirements:
 *   - Signer must have DEFAULT_ADMIN_ROLE on ActionExecutor
 *   - Worker address must be set in this script
 */

const hre = require("hardhat");

async function main() {
  console.log("🔑 Granting WORKER_ROLE on ActionExecutor...\n");

  // Get signer (deployer account)
  const [signer] = await hre.ethers.getSigners();
  console.log("Signer address:", signer.address);
  console.log("Signer balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(signer.address)), "DEV\n");

  // ⚠️ IMPORTANT: Worker address derived from WORKER_PRIVATE_KEY in .env
  const WORKER_ADDRESS = "0x79F9779D2f0B537887180362D0FA4c00AFbe5AC1"; // NEW worker address

  console.log(`Worker address to grant role: ${WORKER_ADDRESS}\n`);

  // ActionExecutor contract address on Moonbase Alpha (from latest deployment)
  const ACTIONEXECUTOR_ADDRESS = "0x1Cb45BceCC3f0CEd2875b49d4f6dd5543B2bD559";

  // Get contract instance
  const ActionExecutor = await hre.ethers.getContractAt("ActionExecutor", ACTIONEXECUTOR_ADDRESS);
  console.log("ActionExecutor address:", ACTIONEXECUTOR_ADDRESS);

  // Compute WORKER_ROLE
  const WORKER_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("WORKER_ROLE"));
  console.log("WORKER_ROLE:", WORKER_ROLE);
  console.log("Worker address:", WORKER_ADDRESS);

  // Check if worker already has role
  const hasRole = await ActionExecutor.hasRole(WORKER_ROLE, WORKER_ADDRESS);
  
  if (hasRole) {
    console.log("\n✅ Worker already has WORKER_ROLE!");
    return;
  }

  console.log("\n⏳ Granting WORKER_ROLE to worker address...");

  // Grant role
  const tx = await ActionExecutor.grantRole(WORKER_ROLE, WORKER_ADDRESS);
  console.log("Transaction hash:", tx.hash);
  
  // Wait for confirmation
  console.log("⏳ Waiting for confirmation...");
  const receipt = await tx.wait();
  
  console.log("\n✅ WORKER_ROLE granted successfully!");
  console.log("   Block:", receipt.blockNumber);
  console.log("   Gas used:", receipt.gasUsed.toString());
  
  // Verify role was granted
  const hasRoleAfter = await ActionExecutor.hasRole(WORKER_ROLE, WORKER_ADDRESS);
  console.log("   Role verified:", hasRoleAfter ? "✅" : "❌");

  console.log("\n🎉 Worker is now authorized to execute workflows!");
  console.log("   View on Moonscan:");
  console.log(`   https://moonbase.moonscan.io/tx/${tx.hash}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
