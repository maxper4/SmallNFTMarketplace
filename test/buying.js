const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Buying/Selling a listed NFT", function () {
  it("Should receive the bought NFT", async function () {
    const [owner, royaltiesAccount, buyer] = await ethers.getSigners();

    const NFTFactory = await ethers.getContractFactory("RaulixNFTs");
    const ShopFactory = await ethers.getContractFactory("RaulixShop");
    const nft = await NFTFactory.deploy();
    await nft.deployed();
    const shop = await upgrades.deployProxy(ShopFactory, [200, royaltiesAccount.address, [nft.address]]);
    await shop.deployed();

    await nft.mint(1);
    
    await nft.setApprovalForAll(shop.address, true);
    await shop.sell(nft.address, 0, 100);
    await shop.connect(buyer).buy(nft.address, 0, {value: 100});

    const owner1 = await nft.ownerOf(0);
    expect(owner1).to.equal(buyer.address);
  });

  it("Should transfer money", async function () {
    const [owner, royaltiesAccount, seller, buyer] = await ethers.getSigners();

    const NFTFactory = await ethers.getContractFactory("RaulixNFTs");
    const ShopFactory = await ethers.getContractFactory("RaulixShop");
    const nft = await NFTFactory.deploy();
    await nft.deployed();
    const shop = await upgrades.deployProxy(ShopFactory, [200, royaltiesAccount.address, [nft.address]]);
    await shop.deployed();

    await nft.connect(seller).mint(1);
    
    await nft.connect(seller).setApprovalForAll(shop.address, true);
    await shop.connect(seller).sell(nft.address, 0, 100);

    const balanceBeforeSeller = await ethers.provider.getBalance(seller.address);

    await shop.connect(buyer).buy(nft.address, 0, {value: 100});

    const sellerBalance = await ethers.provider.getBalance(seller.address);

    expect(sellerBalance).to.equal(balanceBeforeSeller.add(98));
  });

  it("Should transfer royalties", async function () {
    const [owner, royaltiesAccount, seller, buyer] = await ethers.getSigners();

    const NFTFactory = await ethers.getContractFactory("RaulixNFTs");
    const ShopFactory = await ethers.getContractFactory("RaulixShop");
    const nft = await NFTFactory.deploy();
    await nft.deployed();
    const shop = await upgrades.deployProxy(ShopFactory, [200, royaltiesAccount.address, [nft.address]]);
    await shop.deployed();

    await nft.connect(seller).mint(1);
    
    await nft.connect(seller).setApprovalForAll(shop.address, true);
    await shop.connect(seller).sell(nft.address, 0, 100);

    const balanceBefore = await ethers.provider.getBalance(royaltiesAccount.address);

    await shop.connect(buyer).buy(nft.address, 0, {value: 100});

    const balanceAfter = await ethers.provider.getBalance(royaltiesAccount.address);

    expect(balanceAfter).to.equal(balanceBefore.add(2));
  });

  it("Should not allow to buy with less money than listed", async function () {
    const [owner] = await ethers.getSigners();

    const NFTFactory = await ethers.getContractFactory("RaulixNFTs");
    const ShopFactory = await ethers.getContractFactory("RaulixShop");
    const nft = await NFTFactory.deploy();
    await nft.deployed();
    const shop = await upgrades.deployProxy(ShopFactory, [200, owner.address, [nft.address]]);
    await shop.deployed();

    await nft.mint(1);
    
    await nft.setApprovalForAll(shop.address, true);
    await shop.sell(nft.address, 0, 1000);

    await expect(
      shop.buy(nft.address, 0, {value: 500})
    ).to.be.revertedWith("Raulix: not enough funds");
  });

  it("Should not allow to buy unlisted NFT", async function () {
    const [owner, royaltiesAccount, seller, buyer] = await ethers.getSigners();

    const NFTFactory = await ethers.getContractFactory("RaulixNFTs");
    const ShopFactory = await ethers.getContractFactory("RaulixShop");
    const nft = await NFTFactory.deploy();
    await nft.deployed();
    const shop = await upgrades.deployProxy(ShopFactory, [200, royaltiesAccount.address, [nft.address]]);
    await shop.deployed();

    await expect(
      shop.connect(buyer).buy(nft.address, 0, {value: 100})
    ).to.be.revertedWith("Raulix: NFT not listed");
  });

  it("Should not allow to list from other collections", async function () {
    const [owner] = await ethers.getSigners();

    const NFTFactory = await ethers.getContractFactory("RaulixNFTs");
    const ShopFactory = await ethers.getContractFactory("RaulixShop");
    const nft = await NFTFactory.deploy();
    await nft.deployed();
    const shop = await upgrades.deployProxy(ShopFactory, [200, owner.address, [nft.address]]);
    await shop.deployed();

    await expect(
      shop.sell(owner.address, 0, 100)
    ).to.be.revertedWith("Raulix: NFT not allowed");
  });


});
