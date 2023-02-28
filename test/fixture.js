const { ethers } = require("hardhat");

async function setupFixture() {
    const [owner, royaltiesAccount, seller, buyer] = await ethers.getSigners();

    const NFTFactory = await ethers.getContractFactory("NFTs");
    const ShopFactory = await ethers.getContractFactory("Shop");
    const nft = await NFTFactory.deploy();
    await nft.deployed();
    const shop = await upgrades.deployProxy(ShopFactory, [200, royaltiesAccount.address, [nft.address]]);
    await shop.deployed();

    await nft.connect(seller).mint(1);
    
    await nft.connect(seller).setApprovalForAll(shop.address, true);

    return {
        owner,
        royaltiesAccount,
        buyer,
        seller,
        nft,
        shop
    }
}


module.exports = {
    setupFixture
}