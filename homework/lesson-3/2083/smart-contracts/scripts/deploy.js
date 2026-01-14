const hre = require("hardhat");

async function main() {
  console.log("开始部署MiniSwap和测试Token...");

  // 部署MiniSwap合约
  const MiniSwap = await hre.ethers.getContractFactory("MiniSwap");
  const miniswap = await MiniSwap.deploy();
  await miniswap.waitForDeployment();
  console.log("✓ MiniSwap部署到:", await miniswap.getAddress());

  // 部署测试Token
  const Token = await hre.ethers.getContractFactory("TestToken");
  
  const tokenA = await Token.deploy("Token A", "TKA");
  await tokenA.waitForDeployment();
  console.log("✓ Token A部署到:", await tokenA.getAddress());

  const tokenB = await Token.deploy("Token B", "TKB");
  await tokenB.waitForDeployment();
  console.log("✓ Token B部署到:", await tokenB.getAddress());

  const tokenC = await Token.deploy("Token C", "TKC");
  await tokenC.waitForDeployment();
  console.log("✓ Token C部署到:", await tokenC.getAddress());

  // 创建流动性池
  const tx1 = await miniswap.createPool(await tokenA.getAddress(), await tokenB.getAddress());
  await tx1.wait();
  console.log("✓ 创建Token A-Token B交易对");

  const tx2 = await miniswap.createPool(await tokenB.getAddress(), await tokenC.getAddress());
  await tx2.wait();
  console.log("✓ 创建Token B-Token C交易对");

  // 保存部署信息
  const deploymentInfo = {
    network: hre.network.name,
    miniswap: await miniswap.getAddress(),
    tokenA: await tokenA.getAddress(),
    tokenB: await tokenB.getAddress(),
    tokenC: await tokenC.getAddress(),
    timestamp: new Date().toISOString(),
  };

  console.log("\n========== 部署完成 ==========");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // 保存到文件
  const fs = require("fs");
  fs.writeFileSync(
    "./deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n部署信息已保存到 deployment.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
