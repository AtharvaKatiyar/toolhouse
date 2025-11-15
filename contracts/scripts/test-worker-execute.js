const hre = require("hardhat");

async function main() {
  // Impersonate the worker address
  const WORKER_ADDRESS = "0x79F9779D2f0B537887180362D0FA4c00AFbe5AC1";
  
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [WORKER_ADDRESS],
  });
  
  const worker = await hre.ethers.getSigner(WORKER_ADDRESS);
  
  console.log("Testing as worker:", worker.address);
  
  const executor = await hre.ethers.getContractAt("ActionExecutor", "0x1Cb45BceCC3f0CEd2875b49d4f6dd5543B2bD559");
  const registry = await hre.ethers.getContractAt("WorkflowRegistry", "0x87bb7A86E657f1dDd2e84946545b6686935E3a56");
  
  const wf = await registry.getWorkflow(3);
  console.log("\nWorkflow #3:");
  console.log("  Owner:", wf[0]);
  console.log("  Active:", wf[7]);
  console.log("  GasBudget:", hre.ethers.formatEther(wf[8]), "DEV");
  
  // Test with worker
  console.log("\n🧪 Testing executeWorkflow as worker...");
  try {
    const tx = await executor.connect(worker).executeWorkflow(
      3,
      wf[4],
      Math.floor(Date.now() / 1000) + 300,
      wf[0],
      wf[8]
    );
    console.log("✅ SUCCESS! Tx:", tx.hash);
    const receipt = await tx.wait();
    console.log("   Gas used:", receipt.gasUsed.toString());
  } catch (e) {
    console.log("❌ FAILED:");
    console.log("   Error:", e.message);
    if (e.data) console.log("   Data:", e.data);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
