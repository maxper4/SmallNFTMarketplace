const { ethers, upgrades } = require("hardhat");

async function main() {
  const NFTFactory = await ethers.getContractFactory("NFTs");
  const ShopFactory = await ethers.getContractFactory("Shop");
  const nft = await NFTFactory.deploy();
  await nft.deployed();
  const shop = await upgrades.deployProxy(ShopFactory, [500, "0xfdf3403d3426C6ecC7C2acb9cdE70ca369445836", [nft.address]]);
  await shop.deployed();

  const shopImplementation = await upgrades.erc1967.getImplementationAddress(shop.address);

  console.log("Shop Proxy Contract deployed to:", shop.address);
  console.log("Shop Implementation Contract deployed to:", shopImplementation);
  console.log("NFT Contract deployed to:", nft.address);

  await hre.run("verify:verify", {
    address: shopImplementation,
    constructorArguments: []
  });

  await hre.run("verify:verify", {
    address: nft.address,
    constructorArguments: []
  });
}

main();