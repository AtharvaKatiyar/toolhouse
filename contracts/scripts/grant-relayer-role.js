const hre = require("hardhat");

async function main() {
  console.log("=" * 70);
  console.log("🔑 Granting PROJECT_ADMIN Role to Relayer");
  console.log("=" * 70);
  
  // Get deployed contract addresses
  const registryAddr = "0x87bb7A86E657f1dDd2e84946545b6686935E3a56";
  
  // New dedicated relayer address
  const RELAYER_ADDRESS = "0x6Db011ec0EA5F23aCa9410cfD343DdFD50741649";
  
  console.log(`\n📍 WorkflowRegistry: ${registryAddr}`);
  console.log(`📍 Relayer Address:   ${RELAYER_ADDRESS}`);
  
  // Get contract instance
  const Registry = await hre.ethers.getContractAt("WorkflowRegistry", registryAddr);
  
  // PROJECT_ADMIN role hash
  const PROJECT_ADMIN = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("PROJECT_ADMIN"));
  
  console.log(`\n🔑 Role: PROJECT_ADMIN`);
  console.log(`   Hash: ${PROJECT_ADMIN}`);
  
  // Check if relayer already has the role
  const hasRole = await Registry.hasRole(PROJECT_ADMIN, RELAYER_ADDRESS);
  
  if (hasRole) {
    console.log(`\n✅ Relayer already has PROJECT_ADMIN role!`);
    console.log(`   No action needed.`);
  } else {
    console.log(`\n📝 Granting PROJECT_ADMIN role to relayer...`);
    const tx = await Registry.grantRole(PROJECT_ADMIN, RELAYER_ADDRESS);
    console.log(`   TX submitted: ${tx.hash}`);
    
    console.log(`\n⏳ Waiting for confirmation...`);
    const receipt = await tx.wait();
    
    console.log(`\n✅ Role granted successfully!`);
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
  }
  
  // Verify the role was granted
  const verified = await Registry.hasRole(PROJECT_ADMIN, RELAYER_ADDRESS);
  
  console.log("\n" + "=" * 70);
  if (verified) {
    console.log("✅ VERIFICATION PASSED");
    console.log(`   ${RELAYER_ADDRESS}`);
    console.log("   has PROJECT_ADMIN role on WorkflowRegistry");
    console.log("\n🎉 Relayer setup is COMPLETE!");
    console.log("\n📋 You can now start the backend:");
    console.log("   cd backend && ./start.sh");
  } else {
    console.log("❌ VERIFICATION FAILED");
    console.log("   Role grant may have failed. Check transaction.");
  }
  console.log("=" * 70);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
