const { ethers, upgrades } = require("hardhat");

async function main() {
  const factory = await ethers.getContractFactory("Shop");
  const contract = await upgrades.upgradeProxy("0x0000000000000000000000000000000", factory);
  console.log("Contract upgraded !");

  const shopImplementation = await upgrades.erc1967.getImplementationAddress(contract.address);

  await hre.run("verify:verify", {
    address: shopImplementation,
    constructorArguments: []
  });
}

main();