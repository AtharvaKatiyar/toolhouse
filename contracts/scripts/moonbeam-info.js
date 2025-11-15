const hre = require("hardhat");

async function main() {
  console.log("\n🌙 Moonbeam Network Information");
  console.log("═══════════════════════════════════════════════════════════════");
  
  const networkInfo = {
    moonbeam: {
      chainId: 1284,
      name: "Moonbeam",
      rpc: "https://rpc.api.moonbeam.network",
      explorer: "https://moonbeam.moonscan.io",
      token: "GLMR",
      description: "Production parachain on Polkadot"
    },
    moonriver: {
      chainId: 1285,
      name: "Moonriver",
      rpc: "https://rpc.api.moonriver.moonbeam.network",
      explorer: "https://moonriver.moonscan.io",
      token: "MOVR",
      description: "Production parachain on Kusama"
    },
    moonbaseAlpha: {
      chainId: 1287,
      name: "Moonbase Alpha",
      rpc: "https://rpc.api.moonbase.moonbeam.network",
      explorer: "https://moonbase.moonscan.io",
      token: "DEV",
      description: "Testnet - Free tokens from faucet",
      faucet: "https://faucet.moonbeam.network/"
    }
  };

  const currentNetwork = hre.network.name;
  
  if (networkInfo[currentNetwork]) {
    const info = networkInfo[currentNetwork];
    console.log(`\n📍 Current Network: ${info.name}`);
    console.log("───────────────────────────────────────────────────────────────");
    console.log(`Chain ID:     ${info.chainId}`);
    console.log(`RPC URL:      ${info.rpc}`);
    console.log(`Explorer:     ${info.explorer}`);
    console.log(`Token:        ${info.token}`);
    console.log(`Description:  ${info.description}`);
    if (info.faucet) {
      console.log(`Faucet:       ${info.faucet}`);
    }
  } else {
    console.log(`\n📍 Current Network: ${currentNetwork}`);
    console.log("───────────────────────────────────────────────────────────────");
    console.log("This is not a Moonbeam network.");
    console.log("\nAvailable Moonbeam networks:");
  }
  
  console.log("\n\n🌐 All Moonbeam Networks");
  console.log("═══════════════════════════════════════════════════════════════");
  
  for (const [key, info] of Object.entries(networkInfo)) {
    const isCurrent = key === currentNetwork ? " (CURRENT)" : "";
    console.log(`\n${info.name}${isCurrent}`);
    console.log("───────────────────────────────────────────────────────────────");
    console.log(`Network Key:  ${key}`);
    console.log(`Chain ID:     ${info.chainId}`);
    console.log(`Token:        ${info.token}`);
    console.log(`Type:         ${info.description}`);
    if (info.faucet) {
      console.log(`Faucet:       ${info.faucet}`);
    }
  }
  
  console.log("\n\n📦 Deployment Commands");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("npm run deploy:moonbase      # Deploy to Moonbase Alpha (testnet)");
  console.log("npm run deploy:moonriver     # Deploy to Moonriver");
  console.log("npm run deploy:moonbeam      # Deploy to Moonbeam");
  
  console.log("\n\n🔍 Verification Commands");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("npm run verify:moonbase -- <ADDRESS> <ARGS>");
  console.log("npm run verify:moonriver -- <ADDRESS> <ARGS>");
  console.log("npm run verify:moonbeam -- <ADDRESS> <ARGS>");
  
  console.log("\n\n💡 Helpful Links");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("Docs:         https://docs.moonbeam.network/");
  console.log("Faucet:       https://faucet.moonbeam.network/");
  console.log("Discord:      https://discord.gg/moonbeam");
  console.log("Add Networks: https://chainlist.org/");
  console.log("═══════════════════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
