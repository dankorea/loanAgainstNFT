//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract SimpleNFT is ERC721 {
    uint256 public tokenCounter;

    constructor() public ERC721("Dogie", "DOG") {
        tokenCounter = 0;
    }

    function createNFT(string memory tokenUri) public returns (uint256) {
        uint256 newTokenId = tokenCounter;
        _safeMint(msg.sender, newTokenId);
        _baseURI(tokenUri);
        tokenURI(newTokenId);
        tokenCounter = tokenCounter + 1;
        return newTokenId;
    }

    function _baseURI(string memory tokenUri) internal returns (string memory) {
        return bytes(tokenUri).length > 0 ? tokenUri : "";
    }
}
