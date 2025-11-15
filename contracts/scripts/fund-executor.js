const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n💰 Funding ActionExecutor with DEV tokens...");
  console.log(`Deployer: ${deployer.address}`);
  
  // Get current balance
  const currentBalance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${hre.ethers.formatEther(currentBalance)} DEV\n`);

  // Load deployment addresses
  const fs = require("fs");
  const deployments = JSON.parse(
    fs.readFileSync("./deployments/moonbaseAlpha-1763068793941.json", "utf8")
  );

  const executorAddress = deployments.contracts.ActionExecutor;
  console.log(`ActionExecutor: ${executorAddress}`);

  // Check executor balance before
  const balanceBefore = await hre.ethers.provider.getBalance(executorAddress);
  console.log(`ActionExecutor balance before: ${hre.ethers.formatEther(balanceBefore)} DEV\n`);

  // Send 0.5 DEV to ActionExecutor
  const amount = hre.ethers.parseEther("0.5");
  console.log(`📤 Sending ${hre.ethers.formatEther(amount)} DEV to ActionExecutor...`);
  
  const tx = await deployer.sendTransaction({
    to: executorAddress,
    value: amount
  });

  console.log(`Transaction hash: ${tx.hash}`);
  await tx.wait();
  console.log("✅ Transaction confirmed!");

  // Check balance after
  const balanceAfter = await hre.ethers.provider.getBalance(executorAddress);
  console.log(`\nActionExecutor balance after: ${hre.ethers.formatEther(balanceAfter)} DEV`);
  
  console.log("\n🎉 ActionExecutor funded! Now it can execute native transfers.");
  console.log("\n📊 Moonscan: https://moonbase.moonscan.io/address/" + executorAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
