const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Mint basis", function () {
  it("Should allow to mint how many we want", async function () {
    const NFTFactory = await ethers.getContractFactory("NFTs");
    const nft = await NFTFactory.deploy();
    await nft.deployed();

    const [owner] = await ethers.getSigners();

    const mintTx = await nft.mint(2);

    await mintTx.wait();

    const owner1 = await nft.ownerOf(0);
    expect(owner1).to.equal(owner.address);

    const owner2 = await nft.ownerOf(1);
    expect(owner2).to.equal(owner.address);

    const balance = await nft.balanceOf(owner.address);
    expect(balance).to.equal(2);
  });
});
