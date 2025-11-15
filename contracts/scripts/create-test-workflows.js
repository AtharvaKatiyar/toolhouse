/**
 * Create test workflows on Moonbase Alpha for end-to-end testing
 * 
 * This script creates 3 test workflows:
 * 1. Time-based recurring transfer (every 5 minutes)
 * 2. Contract call workflow (ERC20 transfer)
 * 3. Price-based trigger workflow
 * 
 * Usage:
 *   npx hardhat run scripts/create-test-workflows.js --network moonbaseAlpha
 */

const hre = require("hardhat");

async function main() {
  console.log("🔧 Creating test workflows on Moonbase Alpha...\n");

  const [signer] = await hre.ethers.getSigners();
  console.log("Signer address:", signer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(signer.address)), "DEV\n");

  // Contract addresses
  const REGISTRY_ADDRESS = "0x87bb7A86E657f1dDd2e84946545b6686935E3a56";
  const FEEESCROW_ADDRESS = "0x6a4E6dA8A8B9C1a178d7B1E4EE1279653A806C7e";
  
  // Get contract instances
  const registry = await hre.ethers.getContractAt("WorkflowRegistry", REGISTRY_ADDRESS);
  const feeEscrow = await hre.ethers.getContractAt("FeeEscrow", FEEESCROW_ADDRESS);

  console.log("Registry:", REGISTRY_ADDRESS);
  console.log("FeeEscrow:", FEEESCROW_ADDRESS);
  console.log();

  // Deposit gas budget into FeeEscrow (0.5 DEV total for all workflows)
  const gasBudget = hre.ethers.parseEther("0.5");
  console.log("💰 Depositing gas budget to FeeEscrow...");
  const depositTx = await feeEscrow.depositGas({ value: gasBudget });
  await depositTx.wait();
  console.log("✅ Deposited:", hre.ethers.formatEther(gasBudget), "DEV");
  
  // Check balance (balances is a public mapping)
  const balance = await feeEscrow.balances(signer.address);
  console.log("✅ FeeEscrow balance:", hre.ethers.formatEther(balance), "DEV\n");

  // ========================================
  // WORKFLOW 1: Time-based recurring transfer
  // ========================================
  console.log("📋 Creating Workflow #1: Time-based recurring transfer");
  
  const now = Math.floor(Date.now() / 1000);
  const nextRun1 = now + 60; // Start in 60 seconds
  const interval1 = 300; // Repeat every 5 minutes (300 seconds)
  
  // Trigger data: empty for time trigger (nextRun and interval are params)
  const triggerData1 = "0x";

  // Action data: Native transfer to test address (0.01 DEV)
  // For native transfer: target address, value, empty calldata
  const testRecipient = "0x1234567890123456789012345678901234567890";
  const transferAmount = hre.ethers.parseEther("0.01");
  
  const actionData1 = hre.ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "uint256", "bytes"],
    [testRecipient, transferAmount, "0x"]
  );

  const workflow1GasBudget = hre.ethers.parseEther("0.1");

  console.log("  Trigger: TimeTrigger (type 1)");
  console.log("  Start:", new Date(nextRun1 * 1000).toISOString());
  console.log("  Interval:", interval1, "seconds (5 minutes)");
  console.log("  Action: Transfer", hre.ethers.formatEther(transferAmount), "DEV to", testRecipient);
  console.log("  Gas Budget:", hre.ethers.formatEther(workflow1GasBudget), "DEV");

  const tx1 = await registry.createWorkflow(
    1, // TimeTrigger
    triggerData1,
    0, // Native transfer action
    actionData1,
    nextRun1,
    interval1,
    workflow1GasBudget
  );
  
  const receipt1 = await tx1.wait();
  console.log("✅ Workflow #1 created - Tx:", receipt1.hash);
  
  // Get workflow ID from events
  const event1 = receipt1.logs.find(log => {
    try {
      const parsed = registry.interface.parseLog(log);
      return parsed && parsed.name === "WorkflowCreated";
    } catch { return false; }
  });
  
  if (event1) {
    const parsed = registry.interface.parseLog(event1);
    console.log("   Workflow ID:", parsed.args.workflowId.toString());
  }
  console.log();

  // ========================================
  // WORKFLOW 2: Simple test workflow (immediate execution)
  // ========================================
  console.log("📋 Creating Workflow #2: Immediate execution test");
  
  const nextRun2 = now + 30; // Start in 30 seconds
  const interval2 = 0; // One-time execution
  
  const triggerData2 = "0x";

  // Simple empty action for testing
  const actionData2 = "0x";
  const workflow2GasBudget = hre.ethers.parseEther("0.05");

  console.log("  Trigger: TimeTrigger (type 1)");
  console.log("  Start:", new Date(nextRun2 * 1000).toISOString());
  console.log("  Interval: 0 (one-time)");
  console.log("  Action: Empty test action");
  console.log("  Gas Budget:", hre.ethers.formatEther(workflow2GasBudget), "DEV");

  const tx2 = await registry.createWorkflow(
    1, // TimeTrigger
    triggerData2,
    0, // Test action
    actionData2,
    nextRun2,
    interval2,
    workflow2GasBudget
  );
  
  const receipt2 = await tx2.wait();
  console.log("✅ Workflow #2 created - Tx:", receipt2.hash);
  
  const event2 = receipt2.logs.find(log => {
    try {
      const parsed = registry.interface.parseLog(log);
      return parsed && parsed.name === "WorkflowCreated";
    } catch { return false; }
  });
  
  if (event2) {
    const parsed = registry.interface.parseLog(event2);
    console.log("   Workflow ID:", parsed.args.workflowId.toString());
  }
  console.log();

  // ========================================
  // Summary
  // ========================================
  console.log("="  .repeat(60));
  console.log("🎉 Test Workflows Created Successfully!");
  console.log("="  .repeat(60));
  console.log();
  console.log("Next steps:");
  console.log("1. Start scheduler: cd ../worker && python -m src.main scheduler");
  console.log("2. Start worker: cd ../worker && python -m src.main worker");
  console.log("3. Watch logs for workflow execution");
  console.log("4. Check Moonscan for WorkflowExecuted events:");
  console.log("   https://moonbase.moonscan.io/address/" + REGISTRY_ADDRESS);
  console.log();
  console.log("Workflow execution will begin:");
  console.log("  - Workflow #2: ~30 seconds from now");
  console.log("  - Workflow #1: ~60 seconds from now (then every 5 min)");
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
