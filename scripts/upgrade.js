const { ethers, upgrades } = require("hardhat");

async function main() {
  const factory = await ethers.getContractFactory("RaulixShop");
  const contract = await upgrades.upgradeProxy("0x0000000000000000000000000000000", factory);
  console.log("Contract upgraded !");
}

main();