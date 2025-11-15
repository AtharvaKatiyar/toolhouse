const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("Testing with signer:", signer.address);
  
  const WORKER_ADDRESS = "0x79F9779D2f0B537887180362D0FA4c00AFbe5AC1";
  
  const executor = await hre.ethers.getContractAt("ActionExecutor", "0x1Cb45BceCC3f0CEd2875b49d4f6dd5543B2bD559");
  const registry = await hre.ethers.getContractAt("WorkflowRegistry", "0x87bb7A86E657f1dDd2e84946545b6686935E3a56");
  
  const wf = await registry.getWorkflow(3);
  console.log("\nWorkflow #3:");
  console.log("  Owner:", wf[0]);
  console.log("  Active:", wf[7]);
  console.log("  NextRun:", wf[3].toString());
  console.log("  GasBudget:", hre.ethers.formatEther(wf[8]), "DEV");
  
  // Try as deployer
  console.log("\n🧪 Testing executeWorkflow as deployer (should fail - no WORKER_ROLE)...");
  try {
    await executor.executeWorkflow(
      3,
      wf[4],
      Math.floor(Date.now() / 1000) + 300,
      wf[0],
      wf[8]
    );
    console.log("✅ SUCCESS");
  } catch (e) {
    console.log("❌ FAILED:", e.message.substring(0, 150));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
