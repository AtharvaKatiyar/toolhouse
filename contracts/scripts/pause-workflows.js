const hre = require("hardhat");

async function main() {
  console.log("⏸️  Pausing invalid workflows...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);
  
  const REGISTRY_ADDRESS = "0x87bb7A86E657f1dDd2e84946545b6686935E3a56";
  
  const WorkflowRegistry = await hre.ethers.getContractAt(
    "WorkflowRegistry",
    REGISTRY_ADDRESS
  );

  // Pause workflow #1
  console.log("\n⏸️  Pausing Workflow #1...");
  const tx1 = await WorkflowRegistry.pauseWorkflow(1);
  console.log(`Tx hash: ${tx1.hash}`);
  await tx1.wait();
  console.log("✅ Workflow #1 paused");

  // Pause workflow #2
  console.log("\n⏸️  Pausing Workflow #2...");
  const tx2 = await WorkflowRegistry.pauseWorkflow(2);
  console.log(`Tx hash: ${tx2.hash}`);
  await tx2.wait();
  console.log("✅ Workflow #2 paused");

  console.log("\n✅ All workflows paused successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
