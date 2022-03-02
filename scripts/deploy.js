// const { ethers } = require("hardhat");

async function main() {
  // Deploy Excited Ape Contracts
  const excitedApe = await ethers.getContractFactory("ExcitedApe");
  // const excitedApe = await ethers.getContractAt("ExcitedApe");

  const excitedApeInstance = await excitedApe.deploy(
    "0x3ed5088BD4FDdfDeB2D71e69a72A0e4d6a942c26",
    "0x438B3201219d4f29F8baC3bFbC84665cEF2AfDd2"
  );
  await excitedApeInstance.deployed();

  console.log("Excited Ape Deployed: ", excitedApeInstance.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
