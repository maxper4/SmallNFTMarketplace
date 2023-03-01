# Marketplace Hardhat Project
Small Marketplace in solidity using hardhat. Allow users to list items for sale and buy them.

----
Live on goerli testnet:
- Shop Proxy Contract: 0x425032a6efdf55B1168Abcc11c471bDC97E6bee8
- Shop Implementation Contract: 0x8fdE95803c5959bcc8480D27fEC732d0Cc405DC9
- NFT Contract: 0xaA87bAa53DC1eCA0E0087722D5A9a8678f35eE16

----
Unit Tests available: 
```shell
npx hardhat test
```

Deploy with:
```shell
npx hardhat run scripts/deploy.js
```

Upgrade with:
```shell
npx hardhat run scripts/upgrade.js
```

verify on etherscan with:
```shell
npx hardhat run scripts/verify.js
```