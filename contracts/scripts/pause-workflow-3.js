const hre = require("hardhat");

async function main() {
  console.log("⏸️  Pausing Workflow #3...\n");

  const [signer] = await hre.ethers.getSigners();
  console.log("Using account:", signer.address);

  const WorkflowRegistry = await hre.ethers.getContractAt(
    "WorkflowRegistry",
    "0x87bb7A86E657f1dDd2e84946545b6686935E3a56"
  );

  const tx = await WorkflowRegistry.adminSetWorkflow(3, false, 0);
  console.log("Tx hash:", tx.hash);
  await tx.wait();
  console.log("✅ Workflow #3 paused\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
