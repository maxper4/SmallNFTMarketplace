const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { setupFixture } = require("./fixture.js");

describe("Buying/Selling a listed NFT", function () {
  it("Should receive the bought NFT", async function () {
    const { owner, royaltiesAccount, seller, buyer, nft, shop } = await loadFixture(setupFixture);

    await shop.connect(seller).sell(nft.address, 0, 100);
    await shop.connect(buyer).buy(nft.address, 0, {value: 100});

    const owner1 = await nft.ownerOf(0);
    expect(owner1).to.equal(buyer.address);
  });

  it("Should transfer money", async function () {
    const { owner, royaltiesAccount, seller, buyer, nft, shop } = await loadFixture(setupFixture);

    await shop.connect(seller).sell(nft.address, 0, 100);

    const balanceBeforeSeller = await ethers.provider.getBalance(seller.address);

    await shop.connect(buyer).buy(nft.address, 0, {value: 100});

    const sellerBalance = await ethers.provider.getBalance(seller.address);

    expect(sellerBalance).to.equal(balanceBeforeSeller.add(98));
  });

  it("Should transfer royalties", async function () {
    const { owner, royaltiesAccount, seller, buyer, nft, shop } = await loadFixture(setupFixture);

    await shop.connect(seller).sell(nft.address, 0, 100);

    const balanceBefore = await ethers.provider.getBalance(royaltiesAccount.address);

    await shop.connect(buyer).buy(nft.address, 0, {value: 100});

    const balanceAfter = await ethers.provider.getBalance(royaltiesAccount.address);

    expect(balanceAfter).to.equal(balanceBefore.add(2));
  });

  it("Should not allow to buy with less money than listed", async function () {
    const { owner, royaltiesAccount, seller, buyer, nft, shop } = await loadFixture(setupFixture);

    await shop.connect(seller).sell(nft.address, 0, 1000);

    await expect(
      shop.buy(nft.address, 0, {value: 500})
    ).to.be.revertedWith("InsufficientBalance()");
  });

  it("Should not allow to buy unlisted NFT", async function () {
    const { owner, royaltiesAccount, seller, buyer, nft, shop } = await loadFixture(setupFixture);

    await expect(
      shop.connect(buyer).buy(nft.address, 0, {value: 100})
    ).to.be.revertedWith('requireListed("'+nft.address+'", 0)');
  });

  it("Should not allow to list from other collections", async function () {
    const { owner, royaltiesAccount, seller, buyer, nft, shop } = await loadFixture(setupFixture);

    await expect(
      shop.sell(owner.address, 0, 100)
    ).to.be.revertedWith('requireAllowedNFTs("'+owner.address+'")');
  });


});
