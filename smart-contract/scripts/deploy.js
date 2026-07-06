const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying LucidDropCasino...");

  const LucidDropCasino = await hre.ethers.getContractFactory("LucidDropCasino");
  const casino = await LucidDropCasino.deploy();

  await casino.waitForDeployment();

  const address = await casino.getAddress();
  console.log(`✅ LucidDropCasino deployed to: ${address}`);

  const deploymentInfo = {
    address,
    network: hre.network.name,
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(
    `deployment-${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});