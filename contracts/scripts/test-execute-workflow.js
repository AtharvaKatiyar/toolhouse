const hre = require("hardhat");

async function main() {
  console.log("\n🧪 Testing ActionExecutor.executeWorkflow manually...\n");

  const [deployer] = await hre.ethers.getSigners();
  const workerAddr = "0x3f17f1962B36e491b30A40b2405849e597Ba5FB5";

  // Load contracts
  const fs = require("fs");
  const deployments = JSON.parse(
    fs.readFileSync("./deployments/moonbaseAlpha-1763068793941.json", "utf8")
  );

  const ActionExecutor = await hre.ethers.getContractFactory("ActionExecutor");
  const executor = ActionExecutor.attach(deployments.contracts.ActionExecutor);

  const WorkflowRegistry = await hre.ethers.getContractFactory("WorkflowRegistry");
  const registry = WorkflowRegistry.attach(deployments.contracts.WorkflowRegistry);

  // Get workflow #3 details
  const workflow = await registry.getWorkflow(3);
  console.log("📋 Workflow #3 Details:");
  console.log(`  Owner: ${workflow[0]}`);
  console.log(`  Active: ${workflow[7]}`);
  console.log(`  ActionData: ${workflow[4]}`);
  console.log(`  NextRun: ${workflow[5]}`);
  console.log(`  Gas Budget: ${hre.ethers.formatEther(workflow[8])} DEV\n`);

  // Prepare execution parameters
  const workflowId = 3;
  const actionData = workflow[4];
  const now = Math.floor(Date.now() / 1000);
  const newNextRun = now + 300; // 5 minutes from now
  const user = workflow[0];
  const gasToCharge = hre.ethers.parseEther("0.001"); // Charge a small amount for testing

  console.log("🔧 Execution Parameters:");
  console.log(`  Workflow ID: ${workflowId}`);
  console.log(`  Action Data: ${actionData}`);
  console.log(`  New Next Run: ${newNextRun}`);
  console.log(`  User: ${user}`);
  console.log(`  Gas to Charge: ${hre.ethers.formatEther(gasToCharge)} DEV\n`);

  // Check executor balance
  const executorBalance = await hre.ethers.provider.getBalance(deployments.contracts.ActionExecutor);
  console.log(`ActionExecutor balance: ${hre.ethers.formatEther(executorBalance)} DEV\n`);

  // Try to call executeWorkflow (from deployer, will fail due to role check)
  try {
    console.log("❌ Testing call from non-worker (should fail)...");
    await executor.executeWorkflow(workflowId, actionData, newNextRun, user, gasToCharge);
  } catch (error) {
    console.log(`Expected error: ${error.message.substring(0, 100)}...\n`);
  }

  console.log("✅ Manual test complete. Check above for errors.");
  console.log("\n💡 The worker should be calling this same function with WORKER_ROLE.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
