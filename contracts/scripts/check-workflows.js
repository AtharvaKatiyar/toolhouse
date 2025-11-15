/**
 * Check workflow status on WorkflowRegistry
 * 
 * Usage:
 *   npx hardhat run scripts/check-workflows.js --network moonbaseAlpha
 */

const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking workflows on WorkflowRegistry...\n");

  const REGISTRY_ADDRESS = "0x87bb7A86E657f1dDd2e84946545b6686935E3a56";
  const registry = await hre.ethers.getContractAt("WorkflowRegistry", REGISTRY_ADDRESS);

  // Try to get workflows 1 and 2 (we just created them)
  const workflowIds = [1, 2];
  
  console.log("Checking workflows...\n");

  for (const i of workflowIds) {
    try {
      const workflow = await registry.getWorkflow(i);
      
      console.log(`Workflow #${i}:`);
      console.log(`  Owner: ${workflow.owner}`);
      console.log(`  Active: ${workflow.active}`);
      console.log(`  Trigger Type: ${workflow.triggerType}`);
      console.log(`  Action Type: ${workflow.actionType}`);
      console.log(`  Next Run: ${new Date(Number(workflow.nextRun) * 1000).toISOString()}`);
      console.log(`  Interval: ${workflow.interval}s`);
      console.log(`  Gas Budget: ${hre.ethers.formatEther(workflow.gasBudget)} DEV`);
      
      // Check if workflow is ready to execute
      const now = Math.floor(Date.now() / 1000);
      const nextRun = Number(workflow.nextRun);
      
      if (workflow.active && nextRun > 0 && nextRun <= now) {
        console.log(`  ⏰ STATUS: READY TO EXECUTE NOW!`);
      } else if (workflow.active && nextRun > now) {
        const waitTime = nextRun - now;
        console.log(`  ⏳ STATUS: Waiting ${waitTime}s (${Math.floor(waitTime / 60)} min ${waitTime % 60}s)`);
      } else if (!workflow.active) {
        console.log(`  ❌ STATUS: Inactive`);
      } else {
        console.log(`  💤 STATUS: Not scheduled (nextRun = 0)`);
      }
      
      console.log();
    } catch (error) {
      console.log(`  ℹ️  Workflow #${i} does not exist or error reading:`, error.message);
      console.log();
      break; // Stop checking if workflow doesn't exist
    }
  }

  console.log("="  .repeat(60));
  console.log("To execute workflows:");
  console.log("  cd ../worker && python -m src.main scheduler  # Terminal 1");
  console.log("  cd ../worker && python -m src.main worker     # Terminal 2");
  console.log("="  .repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
