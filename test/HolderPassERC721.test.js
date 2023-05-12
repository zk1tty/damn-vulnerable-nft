const { expect, use, assert } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { keccak256 } = ethers.utils;
use(require("chai-as-promised"));

const name = "MitamaHolderPass";
const symbol = "MHP";
const baseURI = "ipfs://QmcbszmyqbrgSvihEhEDG1YbzKguwkMbT6Ed4Zz2jhxcse/";

const arguments = [name, symbol, baseURI];

let listAccount;
let owner;
describe("HolderPass", () => {
  beforeEach(async () => {
    const [deployer, ...accounts] = await hre.ethers.getSigners();
    signer = deployer;
    owner = deployer.address;
    listAccount = accounts.map((account) => account.address);
    const HolderPassERC721 = await hre.ethers.getContractFactory("HolderPassERC721");

    holderPassErc721 = await HolderPassERC721.deploy(...arguments);
    await holderPassErc721.deployed();
  });

  it("should mint pass correctly", async () => {
    const MITAMA_TOKEN_ID = 0;
    for (let i = 0; i < 8; i++) {
      const account = listAccount[i];
      const tx = await holderPassErc721.mintPass(MITAMA_TOKEN_ID, account);
      await tx.wait();
      if (i === 0) {
        // check gold pass
        const allHolders = await holderPassErc721.getHolderList(
            MITAMA_TOKEN_ID
          );
        expect(allHolders[0]).to.be.eq(listAccount[0]);
      } else if (i === 6) {
        const allHolders = await holderPassErc721.getHolderList(
          MITAMA_TOKEN_ID
        );
        expect(allHolders).to.deep.eq(listAccount.slice(0, 7));
      } else if (i === 7) {
        const allHolders = await holderPassErc721.getHolderList(
          MITAMA_TOKEN_ID
        );
        const silverHolders = allHolders.slice(1,7);
        // check if the first silverPass is burned, and the onwer is new taker.
        expect(silverHolders[0]).to.be.eq(listAccount[7]);
        expect(silverHolders.slice(1, 6)).to.deep.eq(listAccount.slice(2, 7));
      }
    }
  });

  it("should the silverPassRemainingRound is correct", async() => {
    const MITAMA_TOKEN_ID = 0;
    for (let i = 0; i < 8; i++) {
      const account = listAccount[i];
      const tx = await holderPassErc721.mintPass(MITAMA_TOKEN_ID, account);
      await tx.wait();
      if (i === 0) {
        // check gold pass case
        await expect(holderPassErc721.getSilverPassRemainingRound(MITAMA_TOKEN_ID)).to.be.reverted;
      } else if (i === 6) {
        const exptectedRemainingRound = [1,2,3,4,5,6]
        for(count of [0,1,2,3,4,5]) {
            const expireCount = await holderPassErc721.getSilverPassRemainingRound(
                MITAMA_TOKEN_ID + (count + 1) * 10000
            );
            expect(expireCount).to.eq(exptectedRemainingRound[count]);
        }
      } else if (i === 7) {
        const exptectedRemainingRoundt = [6,1,2,3,4,5]
        for(count of [0,1,2,3,4,5]) {
            const remainingRound = await holderPassErc721.getSilverPassRemainingRound(
                MITAMA_TOKEN_ID + (count + 1) * 10000
            );
            expect(remainingRound).to.eq(exptectedRemainingRoundt[count]);
        }
      }
    }
  });
});