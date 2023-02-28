//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

error MintAmountMustBeGreaterThanZero();
contract NFTs is ERC721 {
    uint256 private _tokenId;

    constructor() ERC721("Marketplace Tests NFTs", "MTN") { 
        _tokenId = 0;
    }

    function mint(uint256 mintAmount) external {
        if(mintAmount == 0) {
            revert MintAmountMustBeGreaterThanZero();
        }
        
        for (uint256 i = 0; i < mintAmount; ++i) {
            _safeMint(msg.sender, _tokenId++);
        }
    }
}
