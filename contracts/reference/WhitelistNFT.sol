// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "erc721a/contracts/ERC721A.sol";

contract WhitelistNFT is ERC721A {
    bytes32 immutable public merkleRoot;
    uint256 public MAX_TOKENS;
    uint256 public MAX_MINTS;
    mapping(address => uint256) public claimedAmount;

    constructor(
        bytes32 _merkleRoot,
        uint256 _maxTokens,
        uint256 _maxMints
    )
    ERC721A("WhitelistNFT", "WLNFT"){
        merkleRoot = _merkleRoot;
        MAX_TOKENS = _maxTokens;
        MAX_MINTS = _maxMints;
    }

    function toBytes32(address addr) pure internal returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }

    function mintTokens(bytes32[] calldata merkleProof, uint256 numberOfTokens) public payable {
        require(claimedAmount[msg.sender] + numberOfTokens <= MAX_MINTS, "No more claim");
        claimedAmount[msg.sender] += numberOfTokens;
        require(MerkleProof.verify(merkleProof, merkleRoot, toBytes32(msg.sender)), "Invalid MerkleProof");
        _mint(msg.sender, numberOfTokens);
    }
}