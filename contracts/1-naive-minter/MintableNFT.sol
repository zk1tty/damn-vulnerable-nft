// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MintableNFT is ERC721, Ownable {
    uint256 public  tokenIdCounter;
    string public baseURI;
    uint256 public tokenPrice; 
    
    constructor(string memory baseURI_) ERC721("CSTFToken", "CSTF") {
        baseURI = baseURI_;
    }

    // Q: who can mint your NFT?
    // Q: Who is the receiver of minted NFT?
    function mintMulti(uint256 quantity,address to) payable public returns (uint256) {
        require(tokenPrice != 0, "set tokenPrice.");
        require(msg.value == tokenPrice, "payment amount is wrong.");
        for (uint256 i = 0; i < quantity; ) {
            _mintOne(to);
            ++ i;
        }
        return tokenIdCounter;
    }

    function _mintOne(address to) private returns (uint256) {
        uint256 newTokenId = tokenIdCounter;
        _safeMint(to, newTokenId);
        ++tokenIdCounter;

        // tokenID minted
        return tokenIdCounter;
    }

function setTokenPrice(uint256 price_) onlyOwner public {
        tokenPrice = price_;
    }
}