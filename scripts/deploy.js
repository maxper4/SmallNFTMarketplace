const { ethers, upgrades } = require("hardhat");

async function main() {
  const NFTFactory = await ethers.getContractFactory("RaulixNFTs");
  const ShopFactory = await ethers.getContractFactory("RaulixShop");
  const nft = await NFTFactory.deploy();
  await nft.deployed();
  const shop = await upgrades.deployProxy(ShopFactory, [200, "0x0000000000000000000000", [nft.address]]);
  await shop.deployed();
  console.log("Shop Proxy Contract deployed to:", shop.address);
}

main();