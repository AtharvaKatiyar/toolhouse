const hre = require("hardhat");

async function main() {
  console.log("🚀 Creating Valid Test Workflow on Moonbase Alpha...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  
  // Contract addresses
  const REGISTRY_ADDRESS = "0x87bb7A86E657f1dDd2e84946545b6686935E3a56";
  const FEE_ESCROW_ADDRESS = "0x6a4E6dA8A8B9C1a178d7B1E4EE1279653A806C7e";
  
  const WorkflowRegistry = await hre.ethers.getContractAt(
    "WorkflowRegistry",
    REGISTRY_ADDRESS
  );
  
  const FeeEscrow = await hre.ethers.getContractAt(
    "FeeEscrow",
    FEE_ESCROW_ADDRESS
  );

  // Check current escrow balance
  const currentBalance = await FeeEscrow.balances(deployer.address);
  console.log(`\n💰 Current FeeEscrow balance: ${hre.ethers.formatEther(currentBalance)} DEV`);

  // Deposit more gas budget if needed
  if (currentBalance < hre.ethers.parseEther("0.5")) {
    console.log("\n💸 Depositing 0.5 DEV to FeeEscrow...");
    const depositTx = await FeeEscrow.depositGas({ value: hre.ethers.parseEther("0.5") });
    await depositTx.wait();
    console.log("✅ Deposited 0.5 DEV");
  }

  const newBalance = await FeeEscrow.balances(deployer.address);
  console.log(`💰 FeeEscrow balance: ${hre.ethers.formatEther(newBalance)} DEV\n`);

  // ============================================================
  // Create Workflow #3: Valid Native Transfer
  // ============================================================
  console.log("📝 Creating Workflow #3: Valid Native Transfer\n");
  
  // Trigger: Time-based, run every 5 minutes
  const triggerType = 1; // TIME
  const triggerData = "0x"; // Empty for time-based triggers
  
  // Action: Native transfer (actionType = 1)
  // Format: actionType (1 byte) + recipient (20 bytes) + amount (32 bytes)
  const actionType = 1; // NATIVE_TRANSFER
  const recipient = "0x0000000000000000000000000000000000000001"; // Burn address for testing
  const amount = hre.ethers.parseEther("0.001"); // 0.001 DEV
  
  // Encode action data: actionType (1 byte) + ABI-encoded (recipient, amount)
  const abiCoder = hre.ethers.AbiCoder.defaultAbiCoder();
  const encodedParams = abiCoder.encode(["address", "uint256"], [recipient, amount]);
  const actionData = hre.ethers.concat([
    hre.ethers.toBeHex(actionType, 1),  // 1 byte action type
    encodedParams                        // ABI-encoded parameters
  ]);
  
  // Schedule: Run now and repeat every 5 minutes
  const now = Math.floor(Date.now() / 1000);
  const nextRun = now + 30; // Start in 30 seconds
  const interval = 300; // 5 minutes
  const gasBudget = hre.ethers.parseEther("0.1");

  console.log(`  Trigger Type: ${triggerType} (TIME)`);
  console.log(`  Action Type: ${actionType} (NATIVE_TRANSFER)`);
  console.log(`  Recipient: ${recipient}`);
  console.log(`  Amount: ${hre.ethers.formatEther(amount)} DEV`);
  console.log(`  Next Run: ${new Date(nextRun * 1000).toISOString()}`);
  console.log(`  Interval: ${interval}s (5 minutes)`);
  console.log(`  Gas Budget: ${hre.ethers.formatEther(gasBudget)} DEV\n`);

  const tx3 = await WorkflowRegistry.createWorkflow(
    triggerType,
    triggerData,
    actionType,
    actionData,
    nextRun,
    interval,
    gasBudget
  );
  
  console.log(`  Tx hash: ${tx3.hash}`);
  const receipt3 = await tx3.wait();
  console.log(`  Block: ${receipt3.blockNumber}`);
  console.log(`  ✅ Workflow #3 created!\n`);

  // ============================================================
  // Verify workflows
  // ============================================================
  console.log("🔍 Verifying workflow...\n");
  
  const wf3 = await WorkflowRegistry.getWorkflow(3);
  console.log(`Workflow #3:`);
  console.log(`  Owner: ${wf3.owner}`);
  console.log(`  Active: ${wf3.active}`);
  console.log(`  Trigger Type: ${wf3.triggerType}`);
  console.log(`  Action Type: ${wf3.actionType}`);
  console.log(`  Next Run: ${new Date(Number(wf3.nextRun) * 1000).toISOString()}`);
  console.log(`  Interval: ${wf3.interval}s`);
  console.log(`  Gas Budget: ${hre.ethers.formatEther(wf3.gasBudget)} DEV`);
  
  const isReady = Number(wf3.nextRun) <= Math.floor(Date.now() / 1000);
  console.log(`  Status: ${isReady ? "⏰ READY TO EXECUTE NOW!" : "⏳ Waiting..."}\n`);

  console.log("=" + "=".repeat(60));
  console.log("🎉 Valid Test Workflow Created Successfully!");
  console.log("=" + "=".repeat(60));
  console.log("\nNext Steps:");
  console.log("1. Scheduler will detect workflow #3 within 10 seconds");
  console.log("2. Worker will execute the native transfer");
  console.log("3. Check Moonscan for WorkflowExecuted event:");
  console.log(`   https://moonbase.moonscan.io/address/0x1Cb45BceCC3f0CEd2875b49d4f6dd5543B2bD559#events`);
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
