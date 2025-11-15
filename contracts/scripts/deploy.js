const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy WorkflowRegistry
  console.log("\n1. Deploying WorkflowRegistry...");
  const WorkflowRegistry = await hre.ethers.getContractFactory("WorkflowRegistry");
  const workflowRegistry = await WorkflowRegistry.deploy(deployer.address);
  await workflowRegistry.waitForDeployment();
  const workflowRegistryAddress = await workflowRegistry.getAddress();
  console.log("WorkflowRegistry deployed to:", workflowRegistryAddress);

  // Deploy FeeEscrow
  console.log("\n2. Deploying FeeEscrow...");
  const FeeEscrow = await hre.ethers.getContractFactory("FeeEscrow");
  const feeEscrow = await FeeEscrow.deploy(deployer.address);
  await feeEscrow.waitForDeployment();
  const feeEscrowAddress = await feeEscrow.getAddress();
  console.log("FeeEscrow deployed to:", feeEscrowAddress);

  // Deploy ActionExecutor
  console.log("\n3. Deploying ActionExecutor...");
  const ActionExecutor = await hre.ethers.getContractFactory("ActionExecutor");
  const actionExecutor = await ActionExecutor.deploy(
    deployer.address,
    workflowRegistryAddress,
    feeEscrowAddress
  );
  await actionExecutor.waitForDeployment();
  const actionExecutorAddress = await actionExecutor.getAddress();
  console.log("ActionExecutor deployed to:", actionExecutorAddress);

  // Grant necessary roles
  console.log("\n4. Configuring roles...");
  
  // Grant WORKER_ROLE to ActionExecutor in FeeEscrow
  const WORKER_ROLE = await feeEscrow.WORKER_ROLE();
  await feeEscrow.grantRole(WORKER_ROLE, actionExecutorAddress);
  console.log("Granted WORKER_ROLE to ActionExecutor in FeeEscrow");

  // Grant PROJECT_ADMIN to deployer in WorkflowRegistry
  const PROJECT_ADMIN = await workflowRegistry.PROJECT_ADMIN();
  await workflowRegistry.grantRole(PROJECT_ADMIN, deployer.address);
  console.log("Granted PROJECT_ADMIN to deployer in WorkflowRegistry");

  console.log("\n✅ Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("═══════════════════════════════════════════════");
  console.log("WorkflowRegistry:", workflowRegistryAddress);
  console.log("FeeEscrow:       ", feeEscrowAddress);
  console.log("ActionExecutor:  ", actionExecutorAddress);
  console.log("═══════════════════════════════════════════════");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      WorkflowRegistry: workflowRegistryAddress,
      FeeEscrow: feeEscrowAddress,
      ActionExecutor: actionExecutorAddress,
    },
  };

  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "../deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`\n💾 Deployment info saved to: deployments/${filename}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
