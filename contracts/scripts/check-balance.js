const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Checking account balance...");
  console.log("═══════════════════════════════════════════════");
  console.log("Network:", hre.network.name);
  console.log("Account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance));
  
  // Network-specific token name
  let tokenName = "ETH";
  if (hre.network.name === "moonbeam") tokenName = "GLMR";
  else if (hre.network.name === "moonriver") tokenName = "MOVR";
  else if (hre.network.name === "moonbaseAlpha") tokenName = "DEV";
  
  console.log("Token:", tokenName);
  console.log("═══════════════════════════════════════════════");
  
  // Check if balance is sufficient
  const minBalance = hre.ethers.parseEther("0.1");
  if (balance < minBalance) {
    console.log("\n⚠️  Warning: Low balance!");
    console.log("You may need more funds for deployment.");
    if (hre.network.name === "moonbaseAlpha") {
      console.log("Get testnet tokens: https://faucet.moonbeam.network/");
    }
  } else {
    console.log("\n✅ Balance is sufficient for deployment");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
