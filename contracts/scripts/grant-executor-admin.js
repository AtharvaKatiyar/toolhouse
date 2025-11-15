const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n🔑 Granting PROJECT_ADMIN role to ActionExecutor...");
  console.log(`Deployer: ${deployer.address}\n`);

  // Load deployment addresses
  const fs = require("fs");
  const deployments = JSON.parse(
    fs.readFileSync("./deployments/moonbaseAlpha-1763068793941.json", "utf8")
  );

  const registryAddress = deployments.contracts.WorkflowRegistry;
  const executorAddress = deployments.contracts.ActionExecutor;

  console.log(`WorkflowRegistry: ${registryAddress}`);
  console.log(`ActionExecutor: ${executorAddress}\n`);

  // Get contract
  const WorkflowRegistry = await hre.ethers.getContractFactory("WorkflowRegistry");
  const registry = WorkflowRegistry.attach(registryAddress);

  // Compute PROJECT_ADMIN role
  const PROJECT_ADMIN = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("PROJECT_ADMIN"));
  console.log(`PROJECT_ADMIN role hash: ${PROJECT_ADMIN}\n`);

  // Check current state
  const hasRole = await registry.hasRole(PROJECT_ADMIN, executorAddress);
  console.log(`ActionExecutor has PROJECT_ADMIN: ${hasRole}`);

  if (hasRole) {
    console.log("\n✅ ActionExecutor already has PROJECT_ADMIN role!");
    return;
  }

  // Grant role
  console.log("\n📝 Granting PROJECT_ADMIN role...");
  const tx = await registry.grantRole(PROJECT_ADMIN, executorAddress);
  console.log(`Transaction hash: ${tx.hash}`);
  
  await tx.wait();
  console.log("✅ Transaction confirmed!");

  // Verify
  const hasRoleAfter = await registry.hasRole(PROJECT_ADMIN, executorAddress);
  console.log(`\nVerification: ActionExecutor has PROJECT_ADMIN = ${hasRoleAfter}`);

  if (hasRoleAfter) {
    console.log("\n🎉 SUCCESS! ActionExecutor can now update workflows via adminSetWorkflow()");
  } else {
    console.log("\n❌ ERROR: Role grant failed");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
