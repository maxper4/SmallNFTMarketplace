//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract RaulixNFTs is ERC721 {
    uint256 private _tokenId;

    constructor() ERC721("Raulix", "RAL") { 
        _tokenId = 0;
    }

    function mint(uint256 mintAmount) external {
        require(mintAmount > 0, "mint amount must be greater than 0");
        for (uint256 i = 0; i < mintAmount; ++i) {
            _safeMint(msg.sender, _tokenId++);
        }
    }
}
